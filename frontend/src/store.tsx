// Mm, let's buy things from this store!
// No, no. It's a database.
import _ from 'lodash'
import { create } from 'zustand'
import { BoardSetupMeta, Move, Piece } from './components/types'
import { moveMapToGrid, pieceMapToBoardSetup } from './components/utils'

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
  moves: Array<Move>;
  pieces: Array<Piece>;
  boardSetups: Array<BoardSetupMeta>
  pkToMove: Map<number, Move>;
  pkToPiece: Map<number, Piece>;
  updatePkToMove: (newPkToMove: {[key: number]: Move}) => void;
  updatePkToPiece: (newPkToPiece: {[key: number]: Piece}) => void;
  updateMoves: (newMoves: Array<Move>) => void;
  updatePieces: (newPieces: Array<Piece>) => void;
  updateBoardSetups: (newBoards: Array<BoardSetupMeta>) => void;

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
  moves: [],
  pieces: [],
  boardSetups: [],
  pkToMove: new Map(),
  pkToPiece: new Map(),
  updatePkToMove: (newPkToMove) => set((state) => {
    const ret = new Map<number, Move>(state.pkToMove);
    for(let [k, v] of Object.entries(newPkToMove)) {
      ret.set(parseInt(k), v);
    }
    return {pkToMove: ret}
  }),
  updatePkToPiece: (newPkToPiece) => set((state) => {
    const ret = new Map(state.pkToPiece);
    for(let [k, v] of Object.entries(newPkToPiece)) {
      ret.set(parseInt(k), v);
    }
    return {pkToPiece: ret}
  }),
  updateMoves: (newMoves) => set((state) => {
    let mergedMoves = _.unionBy([...state.moves, ...newMoves], (move) => move.pk);
    mergedMoves.sort((a, b) => moveOrder(a) - moveOrder(b));
    return {moves: mergedMoves}
  }),
  updatePieces: (newPieces) => set((state) => {
      newPieces.map(x => {
        // @ts-ignore
        x.moves = moveMapToGrid(x.piece_moves);
        return x
      });
      let mergedPieces = _.uniqBy([...state.pieces, ...newPieces], (piece) => piece.pk)
      const new_pk_map = new Map<Number, Piece>(); //Lookup key by move name
      _.forEach(mergedPieces, function (p: Piece) {
        new_pk_map.set(p.pk, p);
      });
      return {
        pieces: mergedPieces,
        pkToPiece: new_pk_map
    }
  }),
  updateBoardSetups: (newBoardSetups) => set((state) => {
    newBoardSetups.map(x => {
      // @ts-ignore
      x.boardSetup = pieceMapToBoardSetup(x.piece_locations)
    })
    let mergedBoards = _.uniqBy([...state.boardSetups, ...newBoardSetups], (board) => board.pk)
    return {
      boardSetups: mergedBoards
    }
  }),
  // Misc database
  username: '',
  setUsername: (newUsername) => set(() => ({username: newUsername})),
  mouseDownState: 0,
  setMouseDownState: (newState) => set(()  => ({mouseDownState: newState})),
  errorMessage: "",
  setErrorMessage: (newMessage) => set(()  => ({errorMessage: newMessage})),
}))
