import {Blockly} from '../blockly';
import { GameResult } from './definitions';
export interface Passive {
  implementation: string
}

export interface Move {
  cat: string; //max length 15
  color: Array<number>; // stored in rgb
  implementation: Blockly.WorkspaceSvg | null
  overview: string; // max length 127
  description: string;
  symbol: string; // max length 3
  author?: string; // max length 31
  pk: string; // max length 31
}

export type MoveGrid = (string | null)[][];

export interface Piece {
  name: string; // max length 31
  imageWhite: string;
  imageBlack: string;
  moves: MoveGrid;
  author?: string;
  pk: string;
}


export interface BoardPosition {
  piece: PieceOnBoard | null
}

// A type for communicating with the backend
// don't change/rename the fields
export type PieceOnBoard = {
  row: number;
  col: number;
  piecePk: string;
  team: string;
}

export type BoardSetupPiece = {
  piecePk: string;
  team: string;
  isRoyal: boolean;
}

export type PieceMap = Array<PieceOnBoard>
export type BoardSetup = (BoardSetupPiece | null)[][]
export interface BoardSetupMeta {
  author: string,
  boardSetup: BoardSetup,
  cat: string
  name: string,
  pk: string,
}

export type LobbySetup = {
  requestingUser: string,
  boardSetupMeta: BoardSetupMeta,
  pk: string,
}

// Piece + information pertaining to a specific game being played
export interface GamePiece extends Piece {
  team: string
  isRoyal: boolean
}

// State of a tile pertaining to a specific game being played
export interface GameTile {
  row: number;
  col: number;
  piece: GamePiece | null
}

export type GameState = GameTile[][]

export type Game = {
  websocket: WebSocket,
  gameState: GameState,
  boardName: string,
  boardPk: string,
  pk: string,
  whiteUser: string,
  blackUser: string,
  result: GameResult
  whiteToMove: boolean,
  errorMessage: string,
  drawOffer: string
}


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
export type DjangoGamePiece = {
  is_royal: boolean
  name: string
  piece_id: number
  piece_pk: string
  piece_moves: PieceMove[]
  team: string
}
export type DjangoGameStateTile = {
  piece: DjangoGamePiece | null
}
export type DjangoGameState = {
  board: {[key: string]: DjangoGameStateTile}
  moves: Move[]
  wincon_black: string
  wincon_white: string
  draw_offer: string
}

export type DjangoSetupShort = {
  pk: string,
  name: string,
}
export type DjangoGameData = {
  game_state: DjangoGameState
  pk: string
  white_user: string
  black_user: string
  setup: DjangoSetupShort
  white_to_move: boolean
  result: GameResult
}

export type BoardSetupDjangoMeta = {
  author: string,
  piece_locations: DjangoPieceMap,
  cat: string
  name: string,
  pk: string,
}

export type PieceMove = {
  relative_row: number,
  relative_col: number,
  move: string,
}

export type DjangoPieceOnBoard = {
  row: number;
  col: number;
  piece: string;
  team: string;
  is_royal: boolean;
}
export type DjangoPieceMap = Array<DjangoPieceOnBoard>;

export interface DjangoPieceLocations extends BoardSetupMeta {
  piece_locations: DjangoPieceMap
}


export type DjangoLobbySetup = {
  requesting_user: string,
  board_setup: DjangoPieceLocations
  pk: string,
}

// A map from the primary key of the move to all (dx, dy) where it applies
export type DjangoMoveMap = Array<PieceMove>;


export interface DjangoPiece {
  name: string; // max length 31
  image_white: string;
  image_black: string;
  piece_moves: DjangoMoveMap;
  author?: string;
  pk: string; // max length 31
}