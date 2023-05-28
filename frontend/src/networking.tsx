import _ from 'lodash'
import axios from 'axios';

import { initBoardSetup, pieceMapToBoardSetup } from './components/utils'
import { BoardSetup, PieceMap, Move, BoardSetupMeta, GamePiece, GameState, GameTile } from './components/types'
import { chessStore, updatePkToPiece } from "./store";
import { Game, LobbySetup } from './components/types';
import { makeGameSocket } from './components/GameView';
import { API_URL } from './components/definitions';


// Declaring the api is better than importing it since this file is run
// first for some network queries.
const csrf_token: String = document.querySelector('[name=csrfmiddlewaretoken]')!.value;
export const api = axios.create({
    baseURL: API_URL,
    timeout: 1000,
    headers: {'X-CSRFToken': csrf_token}
});


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
  const pieceMap: PieceMap = [];
  console.assert(grid.length == 8)
  console.assert(grid[0].length == 8)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const grid_loc = grid[i][j]
      if (grid_loc != null) {
        pieceMap.push({
          // @ts-ignore
          'piece': grid_loc.piece_pk, 
          'row': i,
          'col': j,
          'team': grid_loc.team
        })
      }
    }
  }
  return pieceMap;
}

export type BoardSetupDjangoMeta = {
  author: string,
  piece_locations: PieceMap,
  cat: string
  name: string,
  pk: number,
}
const updateBoardSetups = (djangoBoardSetups: BoardSetupDjangoMeta[]) => {
  const newBoardSetups: BoardSetupMeta[] = _.map(djangoBoardSetups, (x) => {
    return {
      'cat': x.cat,
      'name': x.name,
      'pk': x.pk,
      'author': x.author,
      'board_setup': pieceMapToBoardSetup(x.piece_locations),
    }
  })
  chessStore.setState((state) => {
    const mergedBoards = _.uniqBy([...state.boardSetups, ...newBoardSetups], (board) => board.pk)
    return {
      boardSetups: mergedBoards
    }
  })
}

export const saveBoardToDB = async (boardSetup: BoardSetup, boardName: string) => {
  const pieces = boardSetupToMap(boardSetup)
  return await api.post('/boardSetups',
    {
      params: {
        name: boardName,
        piece_locations: pieces,
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
      data['pieces'] = _.mapValues(data['pieces'], (piece) => {piece.piece_pk = piece.piece; delete piece.piece; return piece;})
      updatePkToPiece(data['pieces'])
      updateBoardSetups(data['boards'])
    });
}


export type DjangoGamePiece = {
  piece_pk: number
  team: string
}
export type DjangoGameStateTile = {
  piece: DjangoGamePiece
}
export type DjangoGameState = {
  board: {[key: string]: DjangoGameStateTile}
  moves: Move[]
}
// Django sends data formatted like a board setup, convert it to GameState
export const GameStateFromDjango = (init_state: DjangoGameState) => {
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
// Related file: api/consumers.py
export const addToLobby = (newLobbySetups: Array<LobbySetup>, merge: boolean=true) => chessStore.setState((state) => {
  const fixedLobbySetups: Array<LobbySetup> = newLobbySetups.map(x => {
    //@ts-ignore
    x.board_setup_meta = x.board_setup
    //@ts-ignore
    x.board_setup_meta.board_setup = pieceMapToBoardSetup(x.board_setup.piece_locations)
    return x
  })
  if (merge) {
    const mergedLobby = _.uniqBy([...state.lobbySetups, ...fixedLobbySetups], (board) => board.pk)
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

  lobbySocket.onmessage = function (m) {
    const data = JSON.parse(m.data);
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
            is_playing_white: is_white,
            is_playing_black: is_black,
            board_name: data['game_name'],
            game_state: GameStateFromDjango(game_data['game_state']),
            pk: game_pk
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