import React, { FC, useEffect } from 'react'
import _ from 'lodash'
import { chessStore, updatePkToPiece } from '../store';
import { BoardSetupMeta, Game, LobbySetup } from './types';
import { makeGameSocket } from './GameView';
import { pieceMapToBoardSetup } from './utils'
import { api, getBoardSetups, addToLobby } from '../networking';
interface SimpleBoardViewProps {
  boardSetup: BoardSetupMeta
}

const SimpleBoardView: FC<SimpleBoardViewProps> = ({ boardSetup }) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-50 border-gray-900 border-2 p-0 m-0">
    {boardSetup.board_setup.map((boardLine, row) => {
      const pkToPiece = chessStore((state) => state.pkToPiece)
      return boardLine.map((boardCell, col) => {
        const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
        let grid_style = "h-6 w-6 m-0 b-0"
        if (parity === 'light') {
          grid_style += " bg-grid_light"
        } else {
          grid_style += " bg-grid_dark"
        }
        let inner_element = <></>
        if (boardCell != null) {
          let image_url = ''
          const piece = pkToPiece.get(boardCell.piece_pk)!
          if (boardCell.team == 'white') {
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

interface LobbyProps {
}
export const Lobby: FC<LobbyProps> = () => {
  const boardSetups = chessStore((state) => state.boardSetups)
  const lobby = chessStore((state) => state.lobby)
  const lobbySetups = chessStore((state) => state.lobbySetups)
  const setErrorMessage = chessStore((state) => state.setErrorMessage)
  useEffect(() => {
    getBoardSetups()
    api.get('/games').then((response) => {
      const data = response.data;
      updatePkToPiece(data['pieces'])
      addToLobby(data['game_requests'], false)
    });
  }, [])
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
          <SimpleBoardView boardSetup={lobbySetup.board_setup_meta}></SimpleBoardView>
          <p>{lobbySetup.board_setup_meta.name}</p>
          {/* <p className='text-xs'>by {lobbySetup.board_setup.author}</p> */}
          <p className='text-m'>vs {lobbySetup.requesting_user}</p>
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
