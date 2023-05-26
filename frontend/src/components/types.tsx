import {Blockly} from '../blockly';
export interface Passive {
  implementation: string
}

export interface Move {
  cat: string; //max length 15
  color: Array<number>; // stored in rgb
  implementation: Blockly.WorkspaceSvg | null
  name: string; // max length 31
  overview: string; // max length 127
  description: string;
  symbol: string; // max length 3
  author?: string; // max length 31
  pk: number; // max length 31
}

export type MoveGrid = (number | null)[][];

export type PieceMove = {
  relative_row: number,
  relative_col: number,
  move: number,
}
// A map from the primary key of the move to all (dx, dy) where it applies
export type MoveMap = Array<PieceMove>;

export interface Piece {
  name: string; // max length 31
  image_white: string;
  image_black: string;
  moves: MoveGrid;
  author?: string;
  pk: number; // max length 31
}

export interface BoardPosition {
  piece_pk: number;
  is_white: boolean;
}

export type PieceOnBoard = {
  row: number;
  col: number;
  piece: number;
  team: string;
}
export type PieceMap = Array<PieceOnBoard>
export type BoardSetup = (BoardPosition | null)[][]
export type BoardSetupMeta = {
  author: string,
  board_setup: BoardSetup,
  cat: string
  name: string,
  pk: number,
}

export type Game = {
  websocket: WebSocket,
  // Booleans detecting if you are playing as white or black. Note that
  // both can be true for local multiplayer.
  is_playing_white: boolean,
  is_playing_black: boolean,
  board_setup_meta: BoardSetupMeta
}

export type LobbySetup = {
  requesting_user: string,
  board_setup_meta: BoardSetupMeta,
  pk: number,
}