import _ from 'lodash'
import { LobbySetup, DjangoLobbySetup, DjangoGameData} from '../components/types';
import { pieceMapToBoardSetup, startGame} from "../networking"
import { chessStore, updatePkToPiece, setErrorMessage } from "../store";


// Related file: api/consumers.py
export const addToLobby = (newLobbySetups: Array<DjangoLobbySetup>, merge: boolean=true) => chessStore.setState((state) => {
  const fixedLobbySetups: Array<LobbySetup> = newLobbySetups.map(x => {
    return {
      requestingUser: x.requesting_user,
      pk: x.pk,
      boardSetupMeta: {
        ...x.board_setup,
        boardSetup: pieceMapToBoardSetup(x.board_setup.piece_locations),
      }
    }
  })
  if (merge) {
    const mergedLobby = _.uniqBy([...fixedLobbySetups, ...state.lobbySetups], (board) => board.pk)
    return {
      lobbySetups: mergedLobby
    }
  } else {
    return {
      lobbySetups: fixedLobbySetups
    }
  } 
});

export const removeFromLobby = (removeIds: Array<string>) => chessStore.setState((state) => {
  const filterLobby = state.lobbySetups.filter((setup) => removeIds.indexOf(setup.pk) == -1)
  return {
    lobbySetups: filterLobby
  }
});
export const setupLobbySocket = (lobbySocket: WebSocket) => {
  lobbySocket.onmessage = function (m) { const data = JSON.parse(m.data);
    if (data['event_type'] == 'begin_game') {
      // Were we one of the players?
      const game_data: DjangoGameData = data['game_data']
      const is_white = data['whoami'] == game_data['white_user']
      const is_black = data['whoami'] == game_data['black_user']
      if (is_white || is_black) {
        startGame(game_data)
      }
      removeFromLobby(data['deleted_ids'])
    } else if (data['event_type'] == 'delete_game') {
      removeFromLobby(data['deleted_ids'])
    } else if (data['event_type'] == 'fail') {
      chessStore.setState(() => { return { errorMessage: data['message'] } });
    } else if (data['event_type'] == 'new_game') {
      addToLobby([data['request']])
      updatePkToPiece(data['pieces'])
    }
  };
  lobbySocket.onerror = function (e) {
    console.log('Lobby socket error:');
    console.error(e)
  }

  lobbySocket.onclose = function (m) {
    setErrorMessage("Lobby socket closed unexpectedly, you need to restart to join a new game.")
    console.log(m)
  };
  return lobbySocket
};

export const createLobbySocket = () => {
  const lobbySocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/lobby/'
  );
  return setupLobbySocket(lobbySocket)
}