
export interface Passive {
  implementation: string
}

export interface Move {
  cat: string;
  color: Array<number>; // stored in rgb
  borderColor?: Array<number>;
  implementation: string
  name: string;
  text: string;
  long: string;
  symbol: string;
}
export type MoveGrid = (string | null)[][];

export interface Piece {
  image: string;
  name: string;
  moves: MoveGrid;
  passives: Passive[];
}

export type BoardSetup = (string | null)[][]
