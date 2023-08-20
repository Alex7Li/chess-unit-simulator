import React, { FC, useState } from "react";
import { Piece, Move, MoveGrid } from './types'
import { FaceSmileIcon } from '@heroicons/react/24/outline'
import _ from 'lodash'
import MoveIcon from './MoveIcon'
import { chessStore } from "../store";
import { CANCEL_MOVE_PK } from "./PieceEditor";
interface PieceViewProps {
  piece: Piece
}

interface MovesViewProps {
  moveGrid: MoveGrid;
  changeMoveGrid?: React.Dispatch<React.SetStateAction<MoveGrid>>;
  selectedMove?: Move
}

export const MovesView: FC<MovesViewProps> = ({ moveGrid, changeMoveGrid, selectedMove}) => {
  const pkToMove = chessStore((state) => state.pkToMove)
  const mouseDownState = chessStore((state) => state.mouseDownState)
  const editable = (changeMoveGrid !== undefined) && (selectedMove !== undefined)
  return (
    <div className="grid grid-cols-15 grid-rows-15 gap-x-0 w-75 h-75 border-gray-900 border-2 p-0 m-0">
      {moveGrid.map((moveLine, row) => {
        return moveLine.map((movePK, col) => {
          const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
          // Note: we need to include all class names in the code so that tailwind
          // sees that we are using them (can't do bg-grid_{parity})
          let grid_style = "h-5 w-5 m-0 b-0 min-w-full"
          if (parity === 'light') {
            grid_style += " bg-grid_light hover:bg-blue-100 focus:bg-blue-300"
          } else {
            grid_style += " bg-grid_dark hover:bg-green-100 focus:bg-green-300"
          }
          let inner_element = <></>
          if (row == 7 && col == 7) {
            inner_element = <div className="rounded-full"><FaceSmileIcon /></div>
          }
          if (movePK) {
            inner_element = <div className="-translate-y-0.5 -translate-x-0.5">
              <MoveIcon move={pkToMove.get(movePK)!} />
              </div>
          }
          let handler_func:  React.MouseEventHandler<HTMLButtonElement> | undefined = undefined;
          if (editable) {
            handler_func = (e) => {
              if (row == 7 && col == 7) {
                return;
              }
              // Check that we are reacting to a mousedown or a mouseenter while
              // the mouse is pressed.
              if (e.type == "mousedown" || mouseDownState >= 0) {
                const newGrid = _.cloneDeep(moveGrid);
                // Erase if we are using the cancel item, or if
                // the mouse is holding down the right click button.
                if (selectedMove.pk == CANCEL_MOVE_PK || mouseDownState == 2 || ("mousedown" && e.button == 2)) {
                  newGrid[row][col] = null;
                  newGrid[row][15 - col - 1] = null;
                } else {
                  newGrid[row][col] = selectedMove.pk;
                  newGrid[row][15 - col - 1] = selectedMove.pk;
                }
                changeMoveGrid(newGrid);
              }
            }
          }
          return <button className={grid_style} key={row * 15 + col} onMouseDown={handler_func} onMouseEnter={handler_func} >
            {inner_element}
          </button>
        })
      })
      }
    </div>
  );
};

const PieceView: FC<PieceViewProps> = ({ piece }) => {
  const pkToMove = chessStore((state) => state.pkToMove)
  return <div>
    <p className='inline-flex'><img draggable="false" src={piece.imageWhite} />{piece.name}</p>

    <div className='container mx-auto p-1' onContextMenu={(e) => e.preventDefault()}>
      <MovesView moveGrid={piece.moves}/>
    </div>
    <div className='container mx-auto p-1'>
      {
        _.uniq(_.flatMap(piece.moves)).filter((x) => { return x != null }).map((moveId) => {
          const move = pkToMove.get(moveId!)!;
          return <div key={moveId} className='inline-flex'> <MoveIcon move={move}></MoveIcon>{move.overview}</div>;
        })
      }
    </div>
  </div>
}

export default PieceView