import React, { FC, useEffect } from 'react'
import _ from 'lodash'
import { api } from "../App"
import { chessStore, updatePkToPiece } from '../store';
import { BoardSetupMeta, Game, LobbySetup } from './types';
import { makeGameSocket } from './GameView';
import { pieceMapToBoardSetup } from './utils'

interface SimpleBoardViewProps {
  boardSetup: BoardSetupMeta
}

const SimpleBoardView: FC<SimpleBoardViewProps> = ({ boardSetup }) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-50 border-gray-900 border-2 p-0 m-0">
    {boardSetup.board_setup.map((boardLine, row) => {
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

const addToLobby = (newLobbySetups: Array<LobbySetup>, merge: boolean=true) => chessStore.setState((state) => {
  newLobbySetups.map(x => {
    //@ts-ignore
    x.board_setup_meta = x.board_setup
    //@ts-ignore
    x.board_setup_meta.board_setup = pieceMapToBoardSetup(x.board_setup.piece_locations)
  })
  if (merge) {
    const mergedLobby = _.uniqBy([...state.lobbySetups, ...newLobbySetups], (board) => board.pk)
    return {
      lobbySetups: mergedLobby
    }
  } else {
    return {
      lobbySetups: newLobbySetups
    }
  } 
});

const removeFromLobby = (removeIds: Array<number>) => chessStore.setState((state) => {
  const filterLobby = state.lobbySetups.filter((setup) => removeIds.indexOf(setup.pk) == -1)
  return {
    lobbySetups: filterLobby
  }
});

const enterLobby = () => chessStore.setState(() => {
    // Make a POST request to get all existing game requests
    api.get('/games').then((response) => {
      const data = response.data;
      updatePkToPiece(data['pieces'])
      addToLobby(data['game_requests'], false)
    });

  // Join socket to listen to incoming game requests
  // Join socket to listen to incoming game requests
  const lobbySocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/lobby/'
  );

  lobbySocket.onmessage = function (m) {
    const data = JSON.parse(m.data);
    if (data['event_type'] == 'delete_game') {
      // This game is being deleted because it was accepted.
      console.log(data)
      if (data['accepted_by'] != '') {
        // Were we one of the players?
        const is_white = data['whoami'] == data['white_player']
        const is_black = data['whoami'] == data['black_player']
        if (is_white || is_black) {
          chessStore.setState((state) => {
            let boardSetup = null
            // Get the id of the game we are removing from the lobby
            // to play now (there is only 1)
            const game_request_pk = data['deleted_ids'][0]
            const game_pk = data['game_id']
            for (let setup of state.lobbySetups) {
              if (setup.pk == game_request_pk) {
                boardSetup = setup
              }
            }
            const newGame: Game = {
              websocket: makeGameSocket(game_pk,
                boardSetup!.board_setup_meta.pk),
              is_playing_white: is_white,
              is_playing_black: is_black,
              board_setup_meta: boardSetup!.board_setup_meta
            }
            return {games: [...state.games, newGame]}
            }
          )
        }
      }
      removeFromLobby(data['deleted_ids'])
    } else if (data['event_type'] == 'fail') {
      chessStore.setState(() => { return { errorMessage: data['message'] } });
    } else if (data['event_type'] == 'new_game') {
      addToLobby([data['request']])
      chessStore.setState((state) => {
        updatePkToPiece(data['pieces'])
        return {}
      });
    }
  };

  lobbySocket.onclose = function (m) {
    console.log('Lobby socket closed with message: ');
    console.log(m)
  };

  return { lobby: lobbySocket }
});

interface LobbyProps {
}
export const Lobby: FC<LobbyProps> = () => {
  const boardSetups = chessStore((state) => state.boardSetups)
  const updateBoardSetups = chessStore((state) => state.updateBoardSetups)
  const lobby = chessStore((state) => state.lobby)
  const lobbySetups = chessStore((state) => state.lobbySetups)
  const setErrorMessage = chessStore((state) => state.setErrorMessage)
  useEffect(() => {
    api.get('/boardSetups', {
      params: {}
    }).then((response) => {
      const data = response.data;
      updatePkToPiece(data['pieces'])
      updateBoardSetups(data['boards'])
    });
    enterLobby()
  }, [])
  return <div>
    <p>Join an existing game</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
        return <button key={lobbySetup.pk.toString()} className="col-span-1 bg-neutral-200" onClick={requestGameClicked}>
          <SimpleBoardView boardSetup={lobbySetup.board_setup_meta}></SimpleBoardView>
          <p>{lobbySetup.board_setup_meta.name}</p>
          {/* <p className='text-xs'>by {lobbySetup.board_setup.author}</p> */}
          <p className='text-m'>vs {lobbySetup.requesting_user}</p>
        </button>
      })}
    </div>
    <p>Or create a new game</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
        return <button key={boardSetup.pk.toString()} className="col-span-1 bg-neutral-200" onClick={requestGameClicked}>
          <SimpleBoardView boardSetup={boardSetup}></SimpleBoardView>
          <p>{boardSetup.name}</p><p className='text-xs'>by {boardSetup.author}</p>
        </button>
      })}
    </div>
  </div>
}
