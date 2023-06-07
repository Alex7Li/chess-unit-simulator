import _ from 'lodash'
import axios from 'axios';

import { initBoardSetup } from './components/utils'
import { BoardSetup, Move, BoardSetupMeta, GameState } from './components/types'
import { Game, LobbySetup } from './components/types';
import { makeGameSocket } from './components/GameView';
import { API_URL, GameResult } from './components/definitions';
import { chessStore, updatePieces, updatePkToMove, updatePkToPiece } from "./store";

// We need to redeclare the api because this file is run
// by the store for network queries before the app is initalized
// and there is a referenceerror. Not sure if there is a nicer way to fix it.
// @ts-ignore
const csrf_token: String = document.querySelector('[name=csrfmiddlewaretoken]')!.value;

console.log(csrf_token)

const api = axios.create({
    baseURL: API_URL,
    timeout: 1000,
    headers: {'X-CSRFToken': csrf_token}
});
api.interceptors.response.use((response) => {
  // console.info(response)
  return response
},
  (error) => {
    console.error(error)
    const message = error?.response?.data?.message
    if (message) {
      chessStore.setState(()=>{
        return {'errorMessage': JSON.stringify(message)}
      })
    }
    throw error;
  });

// Types that we get from django. In an ideal world they are the same
// as the types that we use in the typescript code, but
// - some varible names are more clear in one language than the other,
//    - python has snake_case and typescript doesNot, also django conventions vs ts.
//    - though not all of the variable names are switched, the decision to split types came late
// - sometimes slightly different data structures are more useful
//    - in particular, some of the shipped data structures are designed to be space-efficient
//      for networking speed, but need to be unpacked for other speed reasons
// - it's good to decouple so that backend changes can be dealt with in one place
// so they are not. It's harder than you would expect to share the same types
// in the frontend and backend!
type DjangoGamePiece = {
  piece_pk: number
  team: string
  is_royal: boolean
}
type DjangoGameStateTile = {
  piece: DjangoGamePiece
}
type DjangoGameState = {
  board: {[key: string]: DjangoGameStateTile}
  moves: Move[]
}
type DjangoPieceOnBoard = {
  row: number;
  col: number;
  piece: number;
  team: string;
  is_royal: boolean;
}
type DjangoPieceMap = Array<DjangoPieceOnBoard>;

interface DjangoPieceLocations extends BoardSetupMeta {
  piece_locations: DjangoPieceMap
}

type DjangoLobbySetup = {
  requesting_user: string,
  board_setup: DjangoPieceLocations
  pk: number,
}
type BoardSetupDjangoMeta = {
  author: string,
  piece_locations: DjangoPieceMap,
  cat: string
  name: string,
  pk: number,
}

type PieceMove = {
  relative_row: number,
  relative_col: number,
  move: number,
}

// A map from the primary key of the move to all (dx, dy) where it applies
export type DjangoMoveMap = Array<PieceMove>;


export interface DjangoPiece {
  name: string; // max length 31
  image_white: string;
  image_black: string;
  piece_moves: DjangoMoveMap;
  author?: string;
  pk: number; // max length 31
}

export const fetchMoves = async () => {
    const response = await api.get('/moves', {
      params: {}
    })
    chessStore.setState((state) => {
      state.updateMoves(response.data);
      return {}
    });
}

const boardSetupToMap = (grid: BoardSetup) => {
  const pieceMap: DjangoPieceMap = [];
  console.assert(grid.length == 8)
  console.assert(grid[0].length == 8)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const grid_loc = grid[i][j]
      if (grid_loc != null) {
        pieceMap.push({
          'piece': grid_loc.piecePk, 
          'row': i,
          'col': j,
          'team': grid_loc.team,
          'is_royal': grid_loc.isRoyal
        })
      }
    }
  }
  return pieceMap;
}
const updateBoardSetups = (djangoBoardSetups: BoardSetupDjangoMeta[]) => {
  const newBoardSetups: BoardSetupMeta[] = _.map(djangoBoardSetups, (x) => {
    return {
      'cat': x.cat,
      'name': x.name,
      'pk': x.pk,
      'author': x.author,
      'boardSetup': pieceMapToBoardSetup(x.piece_locations),
    }
  })
  chessStore.setState((state) => {
    const mergedBoards = _.uniqBy([...newBoardSetups, ...state.boardSetups], (board) => board.pk)
    return {
      boardSetups: mergedBoards
    }
  })
}

export const saveBoardToDB = async (boardSetup: BoardSetup, boardName: string, winConWhite: string, winConBlack: string) => {
  const pieces = boardSetupToMap(boardSetup)
  return await api.post('/boardSetups',
    {
      params: {
        name: boardName,
        piece_locations: pieces,
        wincon_white: winConWhite,
        wincon_black: winConBlack,
      }
    }).then((response) => 
      // Add the board setup that we just created to our list
      updateBoardSetups([response.data['new_board_setups']])
    )
}


export const getBoardSetups = async () => {
    return api.get('/boardSetups', {
      params: {}
    }).then((response) => {
      const data = response.data;
      data['pieces'] = _.mapValues(data['pieces'], (piece) => {piece.piecePk = piece.piece; delete piece.piece; return piece;})
      updatePkToPiece(data['pieces'])
      updateBoardSetups(data['boards'])
    });
}


// Django sends data formatted like a board setup, convert it to GameState
export const gameStateFromDjango = (init_state: DjangoGameState) => {
  const grid: GameState = Array.from({ length: 8 }).map((_, row: number) => {
    return Array.from({ length: 8 }).map((_, col: number) => {
      return {'row': row, 'col': col, 'piece': null}
    });
  });
  const pkToPiece = chessStore.getState().pkToPiece
  for(let [key, value] of Object.entries(init_state.board)) {
      let [row, col] = key.split(',')
      if (value.piece != null) {
        const piece = {
          'team': value.piece.team,
          'isRoyal': value.piece.is_royal,
          ...pkToPiece.get(value.piece.piece_pk)!,
        }
        grid[parseInt(row)][parseInt(col)]['piece'] = piece
      }
  }
  return grid
}

/**************************************************
 ****************      Lobby     ******************
 **************************************************/
const pieceMapToBoardSetup = (pieceMap: DjangoPieceMap) => {
  const grid = initBoardSetup()
  for (let piece of Object.values(pieceMap)) {
    grid[piece.row][piece.col] = {
      piecePk: piece.piece,
      team: piece.team,
      isRoyal: piece.is_royal
    }
  }
  return grid;
}

// Related file: api/consumers.py
export const addToLobby = (newLobbySetups: Array<DjangoLobbySetup>, merge: boolean=true) => chessStore.setState((state) => {
  const fixedLobbySetups: Array<LobbySetup> = newLobbySetups.map(x => {
    return {
      requestingUser: x.requesting_user,
      pk: x.pk,
      boardSetupMeta: {
        ...x.board_setup,
        boardSetup: pieceMapToBoardSetup(x.board_setup.piece_locations),
      }
    }
  })
  if (merge) {
    const mergedLobby = _.uniqBy([...fixedLobbySetups, ...state.lobbySetups], (board) => board.pk)
    return {
      lobbySetups: mergedLobby
    }
  } else {
    return {
      lobbySetups: fixedLobbySetups
    }
  } 
});

const removeFromLobby = (removeIds: Array<number>) => chessStore.setState((state) => {
  const filterLobby = state.lobbySetups.filter((setup) => removeIds.indexOf(setup.pk) == -1)
  return {
    lobbySetups: filterLobby
  }
});
export const createLobbySocket = () => {
  const lobbySocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/lobby/'
  );
  return setupLobbySocket(lobbySocket)
}

export const setupLobbySocket = (lobbySocket: WebSocket) => {
  lobbySocket.onmessage = function (m) { const data = JSON.parse(m.data);
    if (data['event_type'] == 'begin_game') {
      // Were we one of the players?
      const game_data = data['game_data']
      const is_white = data['whoami'] == game_data['white_user']
      const is_black = data['whoami'] == game_data['black_user']
      if (is_white || is_black) {
        chessStore.setState((state) => {
          const game_pk = game_data['pk']
          const newGame: Game = {
            websocket: makeGameSocket(game_pk),
            isPlayingWhite: is_white,
            isPlayingBlack: is_black,
            boardName: data['game_name'],
            gameState: gameStateFromDjango(game_data['game_state']),
            pk: game_pk,
            result: GameResult.IN_PROGRESS,
          }
          return {games: [...state.games, newGame]}
          }
        )
      }
      removeFromLobby(data['deleted_ids'])
    } else if (data['event_type'] == 'delete_game') {
      removeFromLobby(data['deleted_ids'])
    } else if (data['event_type'] == 'fail') {
      chessStore.setState(() => { return { errorMessage: data['message'] } });
    } else if (data['event_type'] == 'new_game') {
      addToLobby([data['request']])
      updatePkToPiece(data['pieces'])
    }
  };

  lobbySocket.onclose = function (m) {
    console.log('Lobby socket closed with message: ');
    console.log(m)
  };
  return lobbySocket
};

export const onLogin = (username: string) => {
  chessStore.setState(()=>{
    return {'username': username}
  })
  if (username == "") {
    return
  }
  // Get moves
  fetchMoves()

  // Get pieces
  api.get('/pieces', {
    params: {}
  }).then((response) => {
    const data = response.data;
    // Add the pieces to our storage.
    updatePieces(data['pieces'])
    // Also add any moves that those pieces may use.
    const moves = data['move_map']
    updatePkToMove(moves);
  })

  // Get board setups
  getBoardSetups()

  // Setup the lobby
  chessStore.setState((state) => {
    if (state.lobby != null){
      return {}
    }
    const lobby = new WebSocket( 'ws://' + window.location.host + '/ws/lobby/')
    return {lobby: setupLobbySocket(lobby)}
  })
  
  // Get games in the lobby
  api.get('/games').then((response) => {
    const data = response.data;
    updatePkToPiece(data['pieces'])
    addToLobby(data['game_requests'], false)
  });
}