import React, { FC, useEffect } from 'react'
import _ from 'lodash'
import { chessStore, setErrorMessage } from '../store';
import { BoardSetupMeta, } from './types';

interface SimpleBoardViewProps {
  boardSetup: BoardSetupMeta
}

const SimpleBoardView: FC<SimpleBoardViewProps> = ({ boardSetup }) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-50 border-gray-900 border-2 p-0 m-0">
    {boardSetup.boardSetup.map((boardLine, row) => {
      const pkToPiece = chessStore((state) => state.pkToPiece)
      return boardLine.map((boardCell, col) => {
        const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
        let grid_style = "h-6 w-6 m-0 b-0"
        if (parity === 'light') {
          grid_style += " bg-grid_light"
        } else {
          grid_style += " bg-grid_dark"
        }
        let inner_piece = <div className="relative"/>
        let inner_royal = <></>
        if (boardCell != null) {
          let image_url = ''
          const piece = pkToPiece.get(boardCell.piecePk)!
          if (boardCell.team == 'white') {
            image_url = piece.imageWhite
          } else {
            image_url = piece.imageBlack
          }
          inner_piece = <img draggable="false" className="relative" src={image_url} />
          if (boardCell.isRoyal) {
            inner_royal = <img draggable="false" src="media/crown.png" className="absolute top-0 left-0 h-3 w-3 rotate-12 mx-4 -my-1 rounded-md drop-shadow-md"/>
        }
        }
        let inner_element = <div className='relative'>
          {inner_piece}
          {inner_royal}
        </div>
        return <div className={grid_style} key={row * 15 + col}>
          {inner_element}
        </div>
      })
    })
    }
  </div>
}

interface LobbyProps {
}
export const Lobby: FC<LobbyProps> = () => {
  const boardSetups = chessStore((state) => state.boardSetups)
  const lobby = chessStore((state) => state.lobby)
  const lobbySetups = chessStore((state) => state.lobbySetups)
  return <div>
    <p>Join an existing game</p>
    <div className="inline-block">
      {lobbySetups.map((lobbySetup) => {
        const requestGameClicked = () => {
          if (lobby == null) {
            setErrorMessage("Failed to load the lobby, try refreshing?")
            return
          }
          lobby.send(JSON.stringify(
            {
              'event_type': 'accept_game',
              'request_pk': lobbySetup.pk,
            })
          )
        };
        return <button key={lobbySetup.pk.toString()} className="col-span-1 m-2 bg-neutral-200" onClick={requestGameClicked}>
          <SimpleBoardView boardSetup={lobbySetup.boardSetupMeta}></SimpleBoardView>
          <p>{lobbySetup.boardSetupMeta.name}</p>
          {/* <p className='text-xs'>by {lobbySetup.boardSetup.author}</p> */}
          <p className='text-m'>vs {lobbySetup.requestingUser}</p>
        </button>
      })}
    </div>
    <p>Or create a new game</p>
    <div className="inline-block">
      {boardSetups.map((boardSetup) => {
        const requestGameClicked = () => {
          if (lobby == null) {
            setErrorMessage("Failed to load the lobby, try refreshing?")
            return
          }
          lobby.send(JSON.stringify(
            {
              'event_type': 'request_game',
              'board_pk': boardSetup.pk,
            })
          )
        };
        return <button key={boardSetup.pk.toString()} className="col-span-1 m-2 bg-neutral-200" onClick={requestGameClicked}>
          <SimpleBoardView boardSetup={boardSetup}></SimpleBoardView>
          <p>{boardSetup.name}</p><p className='text-xs'>by {boardSetup.author}</p>
        </button>
      })}
    </div>
  </div>
}
