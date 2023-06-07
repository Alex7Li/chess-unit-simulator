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
  pk: number; // max length 31
}

export type MoveGrid = (number | null)[][];

export interface Piece {
  name: string; // max length 31
  imageWhite: string;
  imageBlack: string;
  moves: MoveGrid;
  author?: string;
  pk: number; // max length 31
}


export interface BoardPosition {
  piece: PieceOnBoard | null
}

// A type for communicating with the backend
// don't change/rename the fields
export type PieceOnBoard = {
  row: number;
  col: number;
  piecePk: number;
  team: string;
}

export type BoardSetupPiece = {
  piecePk: number;
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
  pk: number,
}

export type LobbySetup = {
  requestingUser: string,
  boardSetupMeta: BoardSetupMeta,
  pk: number,
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
  // Booleans detecting if you are playing as white or black. Note that
  // both can be true for local multiplayer.
  isPlayingWhite: boolean,
  isPlayingBlack: boolean,
  gameState: GameState,
  boardName: string,
  pk: number,
  result: GameResult
}