import React, { FC, useRef, useState, useEffect } from "react";
import _ from 'lodash'
import { api } from "../App"
import { chessStore,  } from "../store";
import { Game, BoardSetup } from "./types";

export const makeGameSocket = (game_pk: number) => {
  const gameSocket = new WebSocket(
    'ws://' + window.location.host
    + '/ws/game/' + game_pk.toString() + '/'
  );
  
  gameSocket.onmessage = function (m) {
  }
  gameSocket.onclose = function (m) {
    console.log('Game socket closed with message: ');
    console.log(m)
  }
  return gameSocket
}

interface PlayBoardViewProps {
  boardSetup: BoardSetup
}

const PlayBoardView: FC<PlayBoardViewProps> = ({ boardSetup }) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 h-98 w-98 border-gray-900 border-2 p-0 m-0">
    {boardSetup.map((boardLine, row) => {
      const pkToPiece = chessStore((state) => state.pkToPiece)
      return boardLine.map((boardCell, col) => {
        const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
        let grid_style = "h-12 w-12 m-0 b-0 min-w-full"
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


interface GameProps {
  game_info: Game
}
export const GameView: FC<GameProps> = ({game_info}) => {
  return <div>
    videogame
    <p>{game_info.is_playing_white ? "is white" : "not white"} </p>
    <p>{game_info.is_playing_black ? "is black" : "not black"} </p>
    <PlayBoardView boardSetup={game_info.board_setup_meta.board_setup}/>
  </div>
}
