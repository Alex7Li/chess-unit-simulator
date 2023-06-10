// Mm, let's buy things from this store!
// No, no. It's a database.
import _ from 'lodash'
import { DjangoPiece,  DjangoGameData } from './networking'
import { create } from 'zustand'
import { BoardSetupMeta, Move, Piece, Game, LobbySetup, GameState } from './components/types'
import { moveMapToGrid } from './components/utils'

const moveOrder = (a: Move) => {
  switch (a.cat) {
    case "UI": return 0;
    case "official": return 1;
    case "custom": return 2;
    case "unmade": return 3;
    default: console.error("Got bad move category: " + a.cat); return 3;
  }
}

interface ChessStoreInterface {
  // Chess Related
  // Moves that the user has created and can use to modify their
  // pieces
  userMoves: Array<Move>;
  // Pieces that the user has created and can use to
  // build boards
  userPieces: Array<Piece>;
  // board setups wthat will be visible 
  boardSetups: Array<BoardSetupMeta>
  // move map from a primary key, may contain more moves
  // than just userMoves
  pkToMove: Map<number, Move>;
  // piece map from a primary key, may contain more pieces
  // than just userPieces
  pkToPiece: Map<number, Piece>;
  // all of the moves in a given game
  gamePkToMove: Map<number, Map<number, Move>>;
  lobby: null | WebSocket;
  lobbySetups: Array<LobbySetup>;
  games: Array<Game>;

  // Misc
  username: string;
  mouseDownState: number;
  errorMessage: string;
}
export const chessStore = create<ChessStoreInterface>()((set) => ({
  // Chess Related
  userMoves: [],
  userPieces: [],
  boardSetups: [],
  lobbySetups: [],
  // games: [],
  lobby: null, 
  pkToMove: new Map(),
  pkToPiece: new Map(),
  gamePkToMove: new Map(),
  games: [],
  // Misc database
  username: '',
  mouseDownState: 0,
  errorMessage: "",
}));

export const updateMoves = (newMoves: Array<Move>) => chessStore.setState((state) => {
    let mergedMoves = _.uniqBy([...newMoves, ...state.userMoves], (move) => move.pk);
    mergedMoves.sort((a, b) => moveOrder(a) - moveOrder(b));
    const pkToMove = new Map<number, Move>(state.pkToMove);
    for(let v of newMoves) {
      pkToMove.set(v.pk, v);
    }
    return {userMoves: mergedMoves, pkToMove: pkToMove}
});

export const setErrorMessage = (message: string) => chessStore.setState(() => {
  return {
    errorMessage: message
  }
});

export const setMouseDownState = (mouse_state: number) => chessStore.setState(() => {
  return {
    mouseDownState: mouse_state
  }
});

export const updatePieces = (pieceData: Array<DjangoPiece>) => chessStore.setState((state) => {
    const newPieces: Array<Piece> = _.map(pieceData, x => {
      return {
        moves:  moveMapToGrid(x.piece_moves),
        imageBlack: x.image_black,
        imageWhite: x.image_white,
        pk: x.pk,
        author: x.author,
        name: x.name
      }
    });
    const mergedPieces = _.uniqBy([...newPieces, ...state.userPieces], (piece) => piece.pk)
    const newPkMap= new Map<number, Piece>(state.pkToPiece); // Lookup key by move name
    _.forEach(mergedPieces, function (p: Piece) {
      newPkMap.set(p.pk, p);
    });
    return {
      userPieces: mergedPieces,
      pkToPiece: newPkMap
  }
})
export const updatePkToMove = (newPkToMove: {[key: number]: Move}) => chessStore.setState((state) => {
    const ret = new Map<number, Move>(state.pkToMove);
    for(let [k, v] of Object.entries(newPkToMove)) {
      ret.set(parseInt(k), v);
    }
    return {pkToMove: ret}
})

export const updatePkToPiece = (newPkToPiece: {[key: number]: DjangoPiece}) => chessStore.setState((state) => {
  const ret = new Map(state.pkToPiece);
  for(let [k, v] of Object.entries(newPkToPiece)) {
    const piece: Piece = {
        moves:  moveMapToGrid(v.piece_moves),
        name: v.name,
        imageBlack: v.image_black,
        imageWhite: v.image_white,
        pk: v.pk,
        author: v.author
    }
    ret.set(parseInt(k), piece);
  }
  return {pkToPiece: ret}
})

export const updateGamePkToMove = (newPkToMove: {[key: number]: Move}, game_id: number) => chessStore.setState((state) => {
  const ret = new Map<number, Move>(state.gamePkToMove.get(game_id));
  for(let [k, v] of Object.entries(newPkToMove)) {
    ret.set(parseInt(k), v);
  }
  const newGamePkToMove = _.clone(state.gamePkToMove)
  newGamePkToMove.set(game_id, ret)
  return {gamePkToMove: newGamePkToMove}
})

export const updateGameMessage = (gamePk: number, message: string) => chessStore.setState((state) => {
  let newGames: Array<Game> = _.map(state.games, (game) => {
    if (game.pk == gamePk) {
      return { ...game, errorMessage: message}
    } else {
      return game
    }
  })
  return  {games: newGames}
})

export const exitGame = (game_pk: number) => chessStore.setState((state) => {
  let new_games: Array<Game> = _.reject(state.games, (game) => {
    if (game.pk == game_pk) {
      game.websocket.close(1000)
      return true
    } else {
      return false
    }
  })
  return {games: new_games}
})