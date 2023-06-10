import React, { FC, useRef, useState, useEffect } from "react";
import _ from 'lodash'
import { chessStore, exitGame, updateGamePkToMove, updateGameMessage, setErrorMessage } from "../store";
import { Game, GameState, GameTile, GamePiece } from "./types";
import PieceView from "./PieceView";
import MoveIcon from "./MoveIcon";
import { updateGame, DjangoGameData } from "../networking";
import { GameResult } from "./definitions";
import { Button } from "flowbite-react";
import { format_username, isYourMove } from './utils'

// Related file: api/consumers
export const makeGameSocket = (gamePk: number) => {
  const gameSocket = new WebSocket(
    'ws://' + window.location.host
    + '/ws/game/' + gamePk.toString() + '/'
  );

  gameSocket.onmessage = function (m) {
    const data = JSON.parse(m.data);
    if ((data['event_type'] == 'invalid_move') || (data['event_type'] == 'fail')){
      updateGameMessage(gamePk, data['message'])
    } else if (data['event_type'] == "board_update" || // played a move
               data['event_type'] == "agreement" // resign/draw offer
    ) {
      const gameData: DjangoGameData = data['game_data']
      updateGamePkToMove(gameData['game_state']['moves'], gameData['pk'])
      updateGame(gameData)
    }

  }

  gameSocket.onclose = function (m) {
    if (m.code == 1000) {
      // Successful, closed as game is finished
      return
    }
    console.error('Game socket closed with message: ');
    console.error(m)
    setErrorMessage("Game socket has closed, the dev is bad! Todo: a way to reset connection")
  }
  return gameSocket
}

interface PlayBoardViewProps {
  gameState: GameState
  locToHandler: (row: number, col: number) => React.MouseEventHandler<HTMLButtonElement> 
  selectedTile: GameTile | null
}

const PlayBoardView: FC<PlayBoardViewProps> = ({ locToHandler, gameState, selectedTile }) => {
  const pkToMove = chessStore((state) => state.pkToMove)
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 h-98 w-98 border-gray-900 border-2 p-0 m-0">
    {gameState.map((boardLine, row) => {
      return boardLine.map((boardCell, col) => {
        const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
        let grid_style = "h-12 w-12 m-0 b-0 min-w-full"
        const is_selected = selectedTile && selectedTile.row == row && selectedTile.col == col
        if (parity === 'light') {
          if (is_selected) {
            grid_style += " bg-grid_light_highlight"
          } else {
            grid_style += " bg-grid_light"
          }
        } else {
          if (is_selected) {
            grid_style += " bg-grid_dark_highlight"
          } else {
            grid_style += " bg-grid_dark"
          }
        }
        // first div is relative, others are absolute
        let inner_piece = <div className='relative h-12'/>
        let inner_icon = <></>
        let inner_royal = <></>
        let image_url = ""
        if (boardCell.piece != null) {
          if (boardCell.piece.team == "white") {
            image_url = boardCell.piece.imageWhite
          } else {
            image_url = boardCell.piece.imageBlack
          }
          inner_piece = <img draggable="false" src={image_url} className="relative z-10"/>
          if (boardCell.piece.isRoyal) {
            inner_royal = <img draggable="false" src="static/crown.png" className="absolute z-20 top-0 left-0 h-4 w-4 rotate-12 mx-8 -my-1 rounded-md drop-shadow-md"/>
          }
        }
        if (selectedTile?.piece) {
          let d_row = row - selectedTile.row
          if (selectedTile.piece.team == 'black') {
            d_row *= -1
          }
          d_row += 7
          const movePk = selectedTile.piece.moves[d_row][col - selectedTile.col + 7]
          if (movePk != null) {
            const move = pkToMove.get(movePk)!
            inner_icon = <MoveIcon move={move} transparency={.5} className="absolute z-30 h-6 w-6 my-3 mx-3 rounded-md border-2 drop-shadow-md top-0 left-0"></MoveIcon>
          }
        }
        const inner_element = <div className='relative'>
          {inner_piece}
          {inner_icon}
          {inner_royal}
        </div>
        return <button className={grid_style} key={row * 15 + col} onMouseDown={locToHandler(row, col)}>
          {inner_element}
        </button>
      })
    })
    }
  </div>
}


interface GameProps {
  gameInfo: Game
}

export const GameView: FC<GameProps> = ({gameInfo}) => {
  const [selTile, setSelectedTile] = useState<GameTile | null>(null)
  const locToHandler = (row: number, col: number) => {
      const handlerFunc: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      let selectedPiece: null | GamePiece = gameInfo.gameState[row][col].piece
      if (selTile == null) {
        // Left click to select a location when no location is selected
        if (e.button == 0) {
          setSelectedTile(
            {
            'row': row,
            'col': col,
            'piece': selectedPiece,
          });
        }
      } else {
        if (e.button == 0) { // Left click
          // If no piece is currently selected
          if (selTile.piece == null) {
            setSelectedTile({
              'row': row,
              'col': col,
              'piece': selectedPiece
            });
          } else {
            let d_row = row - selTile.row
            if(selTile.piece.team == 'black') {
                d_row *= -1
            }
            d_row += 7
            const move: number | null | undefined = selTile.piece.moves[d_row][col - selTile.col + 7]
            // If the current piece cannot move to the target square
            if (move == null) {
              setSelectedTile({
                'row': row,
                'col': col,
                'piece': selectedPiece
              });
            } else {
              // Otherwise, make the move
              gameInfo.websocket.send(JSON.stringify(
                {
                  'event_type': 'move',
                  'from_loc': [selTile.row, selTile.col],
                  'to_loc': [row, col],
                })
              )
              setSelectedTile(null)
            }
          }
        } else if ((e.button == 2)) {
          // Right click
          if(selTile != null) {
            setSelectedTile(null)
          }
        } 
      }
    }
    return handlerFunc
  }
  const resign = () => {
    gameInfo.websocket.send(JSON.stringify(
      {
        'event_type': 'resign',
      })
    )
  }
  const offer_accept_draw = () => {
    gameInfo.websocket.send(JSON.stringify(
      {
        'event_type': 'draw',
      })
    )
  }
  let whiteUser = format_username(gameInfo.whiteUser)
  let blackUser = format_username(gameInfo.blackUser)
  let endText = <span></span>
  switch (gameInfo.result) {
    case GameResult.BLACK_WIN:
      endText = <span>{blackUser} wins as Black</span>; break;
    case GameResult.BLACK_WIN_RESIGN:
      endText = <span>{whiteUser} resigns. {blackUser} wins as Black</span>; break;
    case GameResult.WHITE_WIN:
      endText = <span>{whiteUser} wins as White</span>; break;
    case GameResult.WHITE_WIN_RESIGN:
      endText = <span>{blackUser} resigns. {whiteUser} wins as White</span>; break;
    case GameResult.DRAW:
      endText = <span>Draw</span>; break;
    case GameResult.DRAW_AGREED:
      endText = <span>Draw by agreement</span>; break;
    case GameResult.IN_PROGRESS:
  }
  let drawOfferText = "Offer Draw"
  let drawDisabled = false
  if (gameInfo.drawOffer != 'none') {
    const username = chessStore.getState().username
    if ((gameInfo.drawOffer == "black" && gameInfo.whiteUser == username) ||
        (gameInfo.drawOffer == "white" && gameInfo.blackUser == username)) {
      drawOfferText = "Accept Draw"
    } else {
      drawDisabled = true
    }
  }
  const formattedMessage = gameInfo.errorMessage.replace('\\n', '\n')
  let resignMessage = "Resign"
  if (gameInfo.whiteUser == gameInfo.blackUser) {
    if (gameInfo.whiteToMove){
      resignMessage = "Resign as white"
    } else {
      resignMessage = "Resign as black"
    }
  }
  return <div>
    <p>{whiteUser} (white) vs {blackUser} (black)</p>
    <div className="grid md:grid-cols-2">
      <div className="col-span-1">
        <PlayBoardView locToHandler={locToHandler} gameState={gameInfo.gameState} selectedTile={selTile}/>
        {gameInfo.result == GameResult.IN_PROGRESS ? 
        <div className="inline-flex">
          <Button onClick={resign}>{resignMessage}</Button>
          <Button onClick={offer_accept_draw} disabled={drawDisabled}>{drawOfferText}</Button>
        </div>
        : <div>{endText}<Button onClick={() => exitGame(gameInfo.pk)}>Exit game</Button></div>}
        <p style={{whiteSpace:'pre-line'}}>{formattedMessage}</p>
      </div>
      <div className="col-span-1">
        {selTile?.piece == null ? <></> : 
        <PieceView piece={selTile.piece}></PieceView>}
      </div>
    </div>
  </div>
}
