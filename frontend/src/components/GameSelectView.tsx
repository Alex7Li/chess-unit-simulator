import React, { FC, useEffect } from 'react'
import _ from 'lodash'
import { api } from "../App"
import { chessStore } from '../store';
import { BoardSetupMeta } from './types';

interface SimpleBoardViewProps {
  boardSetup: BoardSetupMeta
}

const SimpleBoardView: FC<SimpleBoardViewProps> = ({boardSetup}) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-50 border-gray-900 border-2 p-0 m-0">
    {boardSetup.boardSetup.map((boardLine, row) => {
      const pkToPiece = chessStore((state) => state.pkToPiece)
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
interface GameSelectViewProps {
}
export const GameSelectView: FC<GameSelectViewProps> = () => {
  const boardSetups = chessStore((state) => state.boardSetups)
  const updateBoardSetups = chessStore((state) => state.updateBoardSetups)
  const updatePkToPiece = chessStore((state) => state.updatePkToPiece)
  useEffect(() => {
    api.get('/boardSetups', {
      params: {}
    }).then((response) => {
      const data = response.data;
      updateBoardSetups(data['boards'])
      updatePkToPiece(data['pieces'])
    })
  }, [])
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-5">
      {boardSetups.map((boardSetup) => {
        const startGame = () => {
          
        }
        return <button className="col-span-1 bg-neutral-200" onClick={startGame}>
          <SimpleBoardView boardSetup={boardSetup}></SimpleBoardView>
          <h3>{boardSetup.name}</h3>
          <h3>by {boardSetup.author}</h3>
        </button>
      })}
  </div>
}
