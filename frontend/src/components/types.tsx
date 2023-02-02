
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

export interface Piece {
  name: string; // max length 31
  image: string;
  moves: MoveGrid;
  passives: string;
  author?: string;
}

export type BoardSetup = (string | null)[][]
