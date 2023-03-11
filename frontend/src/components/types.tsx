
export interface Passive {
  implementation: string
}

export interface Move {
  cat: string; //max length 15
  color: Array<number>; // stored in rgb
  implementation: string
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
  image: string;
  moves: MoveGrid;
  author?: string;
  pk: number; // max length 31
}

export type BoardSetup = (number | null)[][]
