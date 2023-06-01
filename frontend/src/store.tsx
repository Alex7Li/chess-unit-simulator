// Mm, let's buy things from this store!
// No, no. It's a database.
import _ from 'lodash'
import { DjangoPiece,  createLobbySocket} from './networking'
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
  lobby: null | WebSocket;
  lobbySetups: Array<LobbySetup>;
  games: Array<Game>;
  updateMoves: (newMoves: Array<Move>) => void;

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
  games: [],
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
  mouseDownState: 0,
  errorMessage: "",
}));


export const setErrorMessage = (message: string) => chessStore.setState((state) => {
  return {
    errorMessage: message
  }
});

export const setMouseDownState = (state: number) => chessStore.setState((state) => {
  return {
    mouseDownState: state
  }
});

export const updatePieces = (pieceData: Array<DjangoPiece>) => chessStore.setState((state) => {
    const newPieces: Array<Piece> = _.map(pieceData, x => {
      return {
        moves:  moveMapToGrid(x.piece_moves),
        name: x.name,
        imageBlack: x.image_black,
        imageWhite: x.image_white,
        pk: x.pk,
        author: x.author
      }
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

export const updateGame = (game_pk: number, newGameState: GameState) => chessStore.setState((state) => {
  let new_games = _.map(state.games, (game) => {
    if (game.pk == game_pk) {
      return {
        websocket: game.websocket,
        isPlayingWhite: game.isPlayingWhite,
        isPlayingBlack: game.isPlayingBlack,
        gameState: newGameState,
        boardName: game.boardName,
        pk: game.pk
      }
    } else {
      return game
    }
  })
  return {games: new_games}
})