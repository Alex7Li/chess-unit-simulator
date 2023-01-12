import React, { useState } from 'react';
import PieceEditor from './components/PieceEditor';
import { Tabs } from 'flowbite-react';
import BoardEditorView from './components/BoardEditor';
import { BoardSetup } from './components/types';
import { PIECES } from './components/definitions';
import { HelpModal } from './components/HelpModal'
function App() {
  const [mouseDownState, setMouseDownState] = useState(0);
  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
      setMouseDownState(e.button)
  }
  return (
    <div className="App" onMouseDown={onMouseDown} onMouseUp={() => setMouseDownState(-1)}>
      <Tabs.Group
  aria-label="Tabs with underline"
  style="underline"
  className='m-0 p-0'
>
  <Tabs.Item
    active={true}
    title={<div className='inline-flex'>Board Editor<HelpModal text="Welcome to the Board Editor! Here you can add pieces to a board to create a setup. To add a piece to the board, select it in the top menu and then select where you want to place it. To delete a piece, use the delete piece tool from the menu or right-click on the piece to delete. To inspect a piece that has been placed on the board, Ctrl+click or middle click on it."/></div>}
  >
    <BoardEditorView/>
  </Tabs.Item>
  <Tabs.Item title={<div className='inline-flex'>Piece Editor<HelpModal text="Create pieces to put on your boards here. You can draw a custom image with the tools, create custom move sets, and even create custom moves!"/></div>}>
      <PieceEditor mouseDownState={mouseDownState}></PieceEditor>
  </Tabs.Item>
  <Tabs.Item title={<div className='inline-flex'>Game<HelpModal 
  text="Play chess! The rules for how each piece move can be seen by clicking on it.
  The game ends when any one of your royal pieces are taken.
  If a player cannot move, they lose.
  There is no 3 fold repetition rule, players must agree to a draw.
  "/></div>}>
    Game simulation content
  </Tabs.Item>
</Tabs.Group>
    </div>
  );
}

export default App;
