import React, { FC, useEffect, useState, createContext, useReducer } from 'react';
import { Tabs, Alert } from 'flowbite-react';
import BoardEditorView from './components/BoardEditor';
import { HelpModal } from './components/HelpModal'
import { MoveEditor } from './components/MoveEditor'
import axios from 'axios';
import { API_URL } from './components/definitions';
import PieceEditor from './components/PieceEditor';
import { Lobby } from './components/Lobby';
import Login from './components/Login'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { chessStore } from './store';
import { GameView } from './components/GameView';

  // @ts-ignore
const csrf_token: String = document.querySelector('[name=csrfmiddlewaretoken]')!.value;
export const api = axios.create({
  baseURL: API_URL,
  timeout: 1000,
  headers: {'X-CSRFToken': csrf_token}
});
// expose the data for debugging
window.chessStore = chessStore
const App: FC = () => {
  const setMouseDownState = chessStore((state) => state.setMouseDownState)
  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setMouseDownState(e.button)
  }
  const message = chessStore((state) => state.errorMessage);
  const setMessage = chessStore((state) => state.setErrorMessage);
  const games = chessStore((state) => state.games);

  //https://reactjs.org/docs/code-splitting.html#reactlazy
  useEffect(() => {
    api.interceptors.response.use((response) => {
      // console.info(response)
      return response
    },
      (error) => {
        console.error(error)
        const message = error?.response?.data?.message
        if (message) {
          setMessage(JSON.stringify(message))
        }
        throw error;
      });
  }, [])

  const message_jsx = <Alert
    color="failure"
    icon={ExclamationCircleIcon}
  >
    <div className="mt-2 mb-4 text-sm text-blue-700 dark:text-blue-800">
      {message}
    </div>
    <div className="flex">
      <button type="button" onClick={() =>
        setMessage("")
      } className="rounded-lg border border-blue-700 bg-transparent px-3 py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-800 hover:text-white focus:ring-4 focus:ring-blue-300 dark:border-blue-800 dark:text-blue-800 dark:hover:text-white">
        Dismiss
      </button>
    </div>
  </Alert>

  return (
    <div className="App" onMouseDown={onMouseDown} onMouseUp={() => setMouseDownState(-1)}>
      <div>
        {message ? message_jsx : <></>}
      </div>
      <Login />
      <Tabs.Group
        aria-label="Tabs with underline"
        style="underline"
        className='m-0 p-0'
      >
        <Tabs.Item  active={false} title={<div className='inline-flex'>Lobby<HelpModal
          text="Lobby to create games and join games made by other players."/></div>}><Lobby></Lobby></Tabs.Item>
        {
          games.map((game, idx) => {
            return <Tabs.Item key={'game_' + idx} active={false} title={game.board_name}><GameView game_info={game}></GameView></Tabs.Item>
          })
        }
        <Tabs.Item title={<div className='inline-flex'>Move Editor<HelpModal text="Create custom moves to add to your pieces!" /></div>}>
          <MoveEditor/>
        </Tabs.Item>
        <Tabs.Item title={<div className='inline-flex'>Piece Editor<HelpModal text="Create pieces to put on your boards here. You can draw a custom image with the tools and create custom move sets" /></div>}>
          <PieceEditor></PieceEditor>
        </Tabs.Item>
        <Tabs.Item active={false}
          title={<div className='inline-flex'>Board Editor<HelpModal text="Welcome to the Board Editor! Here you can add pieces to a board to create a setup. To add a piece to the board, select it in the top menu and then select where you want to place it. To delete a piece, use the delete piece tool from the menu or right-click on the piece to delete. To inspect a piece that has been placed on the board, Ctrl+click or middle click on it." /></div>}
        >
          <BoardEditorView />
        </Tabs.Item>
      </Tabs.Group>
    </div>
  );
}

export default App;
