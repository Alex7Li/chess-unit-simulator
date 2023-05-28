// Mm, let's buy things from this store!
// No, no. It's a database.
import _ from 'lodash'
import { createLobbySocket } from './networking'
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
  lobby: WebSocket;
  lobbySetups: Array<LobbySetup>;
  games: Array<Game>;
  updatePkToMove: (newPkToMove: {[key: number]: Move}) => void;
  updateMoves: (newMoves: Array<Move>) => void;

  // Misc
  username: string;
  setUsername: (username: string) => void;
  mouseDownState: number;
  setMouseDownState: (newState: number) => void;
  errorMessage: string;
  setErrorMessage: (newMessage: string) => void;
}

export const chessStore = create<ChessStoreInterface>()((set) => ({
  // Chess Related
  userMoves: [],
  userPieces: [],
  boardSetups: [],
  lobbySetups: [],
  // games: [],
  lobby: createLobbySocket(),
  pkToMove: new Map(),
  pkToPiece: new Map(),
  games: [],
  updatePkToMove: (newPkToMove) => set((state) => {
    const ret = new Map<number, Move>(state.pkToMove);
    for(let [k, v] of Object.entries(newPkToMove)) {
      ret.set(parseInt(k), v);
    }
    return {pkToMove: ret}
  }),
  updateMoves: (newMoves) => set((state) => {
    let mergedMoves = _.unionBy([...state.userMoves, ...newMoves], (move) => move.pk);
    mergedMoves.sort((a, b) => moveOrder(a) - moveOrder(b));
    const pkToMove = new Map<number, Move>(state.pkToMove);
    for(let v of newMoves) {
      pkToMove.set(v.pk, v);
    }
    return {userMoves: mergedMoves, pkToMove: pkToMove}
  }),
  // Misc database
  username: '',
  setUsername: (newUsername) => set(() => ({username: newUsername})),
  mouseDownState: 0,
  setMouseDownState: (newState) => set(()  => ({mouseDownState: newState})),
  errorMessage: "",
  setErrorMessage: (newMessage) => set(()  => ({errorMessage: newMessage})),
}));



export const updatePieces = (newPieces: Array<Piece>) => chessStore.setState((state) => {
    newPieces.map(x => {
      // @ts-ignore
      x.moves = moveMapToGrid(x.piece_moves);
      return x
    });
    const mergedPieces = _.uniqBy([...state.userPieces, ...newPieces], (piece) => piece.pk)
    const newPkMap= new Map<number, Piece>(state.pkToPiece); //Lookup key by move name
    _.forEach(mergedPieces, function (p: Piece) {
      newPkMap.set(p.pk, p);
    });
    return {
      userPieces: mergedPieces,
      pkToPiece: newPkMap
  }
})

export const updatePkToPiece = (newPkToPiece: {[key: number]: Piece}) => chessStore.setState((state) => {
  const ret = new Map(state.pkToPiece);
  for(let [k, v] of Object.entries(newPkToPiece)) {
    // @ts-ignore
    v.moves = moveMapToGrid(v.piece_moves);
    ret.set(parseInt(k), v);
  }
  return {pkToPiece: ret}
})

export const updateGame = (game_pk: number, newGameState: GameState) => chessStore.setState((state) => {
  let new_games = _.map(state.games, (game) => {
    if (game.pk == game_pk) {
      return {
        websocket: game.websocket,
        is_playing_white: game.is_playing_white,
        is_playing_black: game.is_playing_black,
        game_state: newGameState,
        board_name: game.board_name,
        pk: game.pk
      }
    } else {
      return game
    }
  })
  return {games: new_games}
})