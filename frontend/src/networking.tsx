import _ from 'lodash'
import axios from 'axios';

import { makeGameSocket } from './components/GameView';
import { addToLobby } from './components/Lobby';
import { initBoardSetup, moveMapToGrid } from './components/utils'
import { BoardSetup, Game, BoardSetupMeta, GameState, BoardSetupDjangoMeta, DjangoGameData, DjangoGameState, DjangoPieceMap} from './components/types'
import { chessStore, updatePieces, updateMoves, updatePkToMove, updatePkToPiece } from "./store";
import {api} from './App';

export const fetchMoves = async () => {
    const response = await api.get('/moves', {
      params: {}
    })
    updateMoves(response.data);
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
    }).then((response) => {
        // Add the board setup that we just created to our list
        return updateBoardSetups([response.data['new_board_setups']])
      }
    )
}


export const getBoardSetups = async (params={}) => {
    return api.get('/boardSetups', {
      params: params
    }).then((response) => {
      const data = response.data;
      data['pieces'] = _.mapValues(data['pieces'], (piece) => {piece.piecePk = piece.piece; delete piece.piece; return piece;})
      updatePkToPiece(data['pieces'])
      updateBoardSetups(data['boards'])
    });
}


// Django sends data formatted like a board setup, convert it to GameState
const gameStateFromDjango = (init_state: DjangoGameState) => {
  const grid: GameState = Array.from({ length: 8 }).map((_, row: number) => {
    return Array.from({ length: 8 }).map((_, col: number) => {
      return {'row': row, 'col': col, 'piece': null}
    });
  });
  const pkToPiece = chessStore.getState().pkToPiece
  for(let [key, value] of Object.entries(init_state.board)) {
    let [row, col] = key.split(',')
    const p = value.piece
    if (p != null) {
      const orig_piece = pkToPiece.get(p.piece_pk)!
      const piece = {
        team: p.team,
        isRoyal: p.is_royal,
        moves: moveMapToGrid(p.piece_moves),
        name: p.name,
        pk: p.piece_pk,
        // Reference orig_piece only for data unrelated
        // to the game - if the piece is modified, and
        // then the game is refreshed, it may change,
        // and we want to mitigate the damage!
        author: orig_piece?.author,
        imageBlack: orig_piece?.imageBlack,
        imageWhite: orig_piece?.imageWhite
      }
      grid[parseInt(row)][parseInt(col)]['piece'] = piece
    }
  }
  return grid
}

export const updateGame = (gameData: DjangoGameData) => chessStore.setState((state) => {
  const newGameState = gameStateFromDjango(gameData['game_state'])
  const gamePk = gameData.pk
  let newGames: Array<Game> = _.map(state.games, (game) => {
    if (game.pk == gamePk) {
      return {
        websocket: game.websocket,
        whiteUser: gameData.white_user,
        blackUser: gameData.black_user,
        whiteToMove: gameData.white_to_move,
        gameState: newGameState,
        boardName: game.boardName,
        boardPk: game.boardPk,
        pk: gameData.pk,
        result: gameData.result,
        errorMessage: "",
        drawOffer: gameData.game_state.draw_offer
      }
    } else {
      return game
    }
  })
  return {games: newGames}
})

export const pieceMapToBoardSetup = (pieceMap: DjangoPieceMap) => {
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

export const startGame = (game_data: DjangoGameData) => {
  chessStore.setState((state) => {
    const game_pk = game_data['pk']

    for(let game of state.games) {
      if (game.pk == game_pk) {
        return {} // already in this game
      }
    }
    
    const newGame: Game = {
      websocket: makeGameSocket(game_pk),
      whiteUser: game_data['white_user'],
      blackUser: game_data['black_user'],
      whiteToMove: game_data['white_to_move'],
      boardName: game_data['setup']['name'],
      boardPk: game_data['setup']['pk'],
      gameState: gameStateFromDjango(game_data['game_state']),
      pk: game_pk,
      result: game_data['result'],
      errorMessage: "",
      drawOffer: game_data['game_state']['draw_offer']
    }
    return {games: [...state.games, newGame]}
    }
  )
}

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

  
  // Get games in the lobby
  api.get('/gameRequests').then((response) => {
    const data = response.data;
    updatePkToPiece(data['pieces'])
    addToLobby(data['game_requests'], false)
  });

  // Get games that we are currently playing
  api.get('/games').then((response) => {
    const games: DjangoGameData[] = response.data['games']
    // First, fetch piece images that are the board setups
    let setup_pk_list: string[] = []
    for(const game of games) {
      setup_pk_list.push(game['setup']['pk'])
    }
    setup_pk_list =  _.uniq(setup_pk_list)
    getBoardSetups({'pk_list': setup_pk_list.join(",")}).then(() => {
        // Now, display all of the games
        const inProgGames = chessStore.getState().games
        for(const game of games) {
          let is_in_db = false
          for(const curGame of inProgGames){
            if (curGame.pk == game.pk) {
              is_in_db = true
            }
          }
          if (!is_in_db) {
            startGame(game)
          }
        }
      }
    )
  });
}
