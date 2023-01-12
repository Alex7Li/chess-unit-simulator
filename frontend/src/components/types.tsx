
export interface Passive {
  implementation: string
}

export interface Move {
  cat: string; //max length 15
  color: Array<number>; // stored in rgb
  borderColor?: Array<number>;
  implementation: string
  name: string; // max length 31
  overview: string; // max length 127
  description: string;
  symbol: string; // max length 3
  author?: string; // max length 31
}

export type MoveGrid = (string | null)[][];

export interface Piece {
  name: string; // max length 31
  image: string;
  moves: MoveGrid;
  passives: Passive[];
  author?: string;
}

export type BoardSetup = (string | null)[][]
