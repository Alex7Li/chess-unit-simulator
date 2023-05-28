import React, { FC, useRef, useState, useEffect } from "react";
import _ from 'lodash'
import { api } from "../App"
import { chessStore, updateGame } from "../store";
import { Game, GameState, GameTile, GamePiece } from "./types";
import PieceView from "./PieceView";
import MoveIcon from "./MoveIcon";
import { GameStateFromDjango } from "../networking";

// Related file: api/consumers
export const makeGameSocket = (gamePk: number) => {
  const gameSocket = new WebSocket(
    'ws://' + window.location.host
    + '/ws/game/' + gamePk.toString() + '/'
  );
  
  gameSocket.onmessage = function (m) {
    const data = JSON.parse(m.data);
    if(data['event_type'] == 'invalid_move') {
      chessStore.setState(() => {
        return {errorMessage: data['message']}
      })
    } else if (data['event_type'] == "board_update") {
      const newState = GameStateFromDjango(data['game_data']['game_state'])
      updateGame(gamePk, newState)
    }
  }

  gameSocket.onclose = function (m) {
    console.error('Game socket closed with message: ');
    console.error(m)
      chessStore.setState(() => {
        return {errorMessage: "Game socket has closed, the dev is bad! Todo: a way to reset connection"}
      })
  }
  return gameSocket
}

interface PlayBoardViewProps {
  gameState: GameState
  locToHandler: (row: number, col: number) => React.MouseEventHandler<HTMLButtonElement> 
  selectedTile: GameTile | null
}

const PlayBoardView: FC<PlayBoardViewProps> = ({ locToHandler, gameState, selectedTile }) => {
  const pkToPiece = chessStore((state) => state.pkToPiece)
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
        let inner_element = <></>
        let image_url = null
        if (boardCell.piece != null) {
          if (boardCell.piece.team == "white") {
            image_url = boardCell.piece.image_white
          } else {
            image_url = boardCell.piece.image_black
          }
          inner_element = <img draggable="false" src={image_url} />
        }
        if(selectedTile?.piece) {
          let d_row = row - selectedTile.row
          if(selectedTile.piece.team == 'black') {
            d_row *= -1
          }
          d_row += 7
          const movePk = selectedTile.piece.moves[d_row][col - selectedTile.col + 7]
          if (movePk != null) {
            const move = pkToMove.get(movePk)!
            if (image_url != null) {
              inner_element = <div className='relative'>
                <img draggable="false" src={image_url} className="top-0 left-0"/>
                <MoveIcon move={move} className="absolute top-0 left-0 h-6 w-6 my-3 mx-3 rounded-md border-2 drop-shadow-md"/>
              </div>
            } else {
              inner_element = <MoveIcon move={move} transparency={.5} className="h-6 w-6 my-3 mx-3 rounded-md border-2 drop-shadow-md"></MoveIcon>
            }
          }
        }
        return <button className={grid_style} key={row * 15 + col} onMouseDown={locToHandler(row, col)}>
          {inner_element}
        </button>
      })
    })
    }
  </div>
}


interface GameProps {
  game_info: Game
}

export const GameView: FC<GameProps> = ({game_info}) => {
  const [selTile, setSelectedTile] = useState<GameTile | null>(null)
  const locToHandler = (row: number, col: number) => {
      const handlerFunc: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      let selectedPiece: null | GamePiece = game_info.game_state[row][col].piece
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
              game_info.websocket.send(JSON.stringify(
                {
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
  return <div>
    <p>{game_info.is_playing_white ? "White: you" : "White: someone else"} </p>
    <p>{game_info.is_playing_black ? "Black: you" : "Black: someone else"} </p>
    <div className="grid md:grid-cols-2">
      <div className="col-span-1">
        <PlayBoardView locToHandler={locToHandler} gameState={game_info.game_state} selectedTile={selTile}/>
      </div>
      <div className="col-span-1">
        {selTile?.piece == null ? <></> : 
        <PieceView piece={selTile.piece}></PieceView>}
      </div>
    </div>
  </div>
}
