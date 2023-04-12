
import React, { FC, useEffect } from 'react'
import _ from 'lodash'
import { api } from "../App"
import { chessStore } from '../store';
import { BoardSetup } from './types';

interface PlayRoundViewProps {
  boardSetup: BoardSetup
}

const PlayRound: FC<PlayRoundViewProps> = ({boardSetup}) => {
  const pkToPiece = chessStore((state) => state.pkToPiece)
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-50 border-gray-900 border-2 p-0 m-0">
    {boardSetup.map((boardLine, row) => {
      return boardLine.map((boardCell, col) => {
          const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
          let grid_style = "h-6 w-6 m-0 b-0 min-w-full"
          if (parity === 'light') {
            grid_style += " bg-grid_light"
          } else {
            grid_style += " bg-grid_dark"
          }
          let inner_element = <></>
          if (boardCell != null) {
            let image_url = ''
            const piece = pkToPiece.get(boardCell.piece_pk)!
            if (boardCell.is_white) {
              image_url = piece.image_white
            } else {
              image_url = piece.image_black
            }
            inner_element = <img draggable="false" src={image_url} />
          }
          return <div className={grid_style} key={row * 15 + col}>
            {inner_element}
          </div>
      })
    })
  }
  </div>
}
