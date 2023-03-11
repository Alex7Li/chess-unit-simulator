import React, {FC} from "react";
import { MoveGrid, MoveMap } from './types'
export type SaveState ='saving'|'fail'|'ok' 

interface SaveElementProps {
  savingState: SaveState
}
export const SaveElement: FC<SaveElementProps> = ({savingState}) => {
  let response = <p>{savingState}</p>
  if(savingState == 'fail'){
    response = <p>fail</p>
  }
  if(savingState == 'saving'){
    // todo use loading bar?
    response = <p>saving...</p>
  }
  if(savingState == 'ok'){
    // maybe: flash animation or something?
    response = <p></p>
  }
  return response
}

export const moveGridToMap = (grid: MoveGrid) => {
  const moveMap: MoveMap = [];
  console.assert(grid.length == 15)
  console.assert(grid[0].length == 15)
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      const value = grid[i][j];
      if (value != null) {
        if(value in moveMap){
          moveMap.push({
            'relative_row': i - 7,
            'relative_col': j - 7,
            'move': value
          })
        }
      }
    }
  }
  return moveMap;
}

export const moveMapToGrid = (moveMap: MoveMap) => {
  const moveGrid: MoveGrid = Array.from({ length: 15 }).map(() => {
    return Array.from({ length: 15 }).map(() => {
      return null
    });
  });
  for(let pieceMove of Object.values(moveMap)) {
    moveGrid[pieceMove.relative_row + 7][pieceMove.relative_col + 7] = pieceMove.move
  }
  return moveGrid;
}
