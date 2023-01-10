import React, { FC, useRef, useState } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Tabs, Tooltip, Card, Textarea, Button, Label, TextInput } from "flowbite-react"
import { MOVES, NAME_TO_MOVE } from './definitions'
import _ from 'lodash'
import { MoveGrid, Move, Piece} from './types'
import { MovesView } from './PieceView'
import MoveIcon from './MoveIcon'
import {HelpModal, ImplementationHelpModal } from "./HelpModal";

interface PieceEditorProps {
  mouseDownState: number
}

const initMoveGrid: MoveGrid = Array.from({ length: 17 }).map(() => {
  return Array.from({ length: 17 }).map(() => {
    return null
  });
});

const PieceEditor: FC<PieceEditorProps> = ({ mouseDownState }) => {
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraseWidth, setEraseWidth] = useState(20);
  // const [color, setColor] = useState("black");
  const canvas = useRef<ReactSketchCanvasRef>(null);
  const [selectedMoveName, selectMove] = useState<string>('cancel');
  const [pieceName, setPieceName] = useState<string>('');
  const selectedMove = NAME_TO_MOVE.get(selectedMoveName)!;
  const [moveGrid, changeMoveGrid] = useState<MoveGrid>(initMoveGrid);
  const [implementationValue, setImplementationValue] = useState<string>('');

  const toolChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.id === "Eraser") {
      canvas.current?.eraseMode(true);
    } else if (e.target.id === "Pen") {
      canvas.current?.eraseMode(false);
    }
  };
  const savePiece: React.ChangeEventHandler<HTMLButtonElement> = (e) => {
    canvas.current?.exportImage('png').then(data => {
      const creation: Piece = {
        name: pieceName,
        passives: [],
        image: data,
        moves: moveGrid,
      }
      console.log(creation);
    }).catch(e => {
      window.alert(e)
    })
  }
  return (
    <div className="grid sm:grid-cols-2">
      {/* Unit view */}
      <div className="col-span-1">
        <form className="flex flex-col w-68 place-items-center">
            <TextInput
              id="pieceName"
              type="text"
              placeholder="Piece Name"
              value={pieceName}
              onChange={(e) => setPieceName(e.target.value)}
            />
        </form>
        <div className='py-1 place-items-center'>
          <ReactSketchCanvas
            width="13rem"
            height="13rem"
            strokeWidth={strokeWidth}
            eraserWidth={eraseWidth}
            canvasColor="white"
            strokeColor="black"
            backgroundImage="src/assets/transparent.png"
            exportWithBackgroundImage={true}
            ref={canvas}
          />
        </div>
        <div className='container mx-auto p-1' onContextMenu={(e) => e.preventDefault()}>
          <MovesView moveGrid={moveGrid} changeMoveGrid={changeMoveGrid} selectedMoveName={selectedMoveName} mouseDownState={mouseDownState} />
        </div>
        <div className='container mx-auto p-1'>
          {
            _.uniq(_.flatMap(moveGrid)).filter((x) => { return x != null }).map((moveName) => {
              const move = NAME_TO_MOVE.get(moveName!)!;
              return <div className='inline-flex'> <MoveIcon move={move}></MoveIcon>{move.text}</div>;
            })
          }
        </div>
      </div>
      <div className="col-span-1">
        <Tabs.Group aria-label="Default tabs">
          {/* Action Tools */}
          <Tabs.Item title="Actions">
            <div className="grid grid-cols-10 w-80">
              <>
                {MOVES.map((move: Move) => {
                  let buttonClassName = 'h-6 w-6';
                  if (move.name == selectedMoveName) {
                    buttonClassName += " bg-stone-600"
                  }
                  return <Tooltip animation={false} content={move.name + ": " + move.text} key={move.name}>
                    <button onClick={
                    () => {selectMove(move.name); setImplementationValue(move.implementation); }
                    } className={buttonClassName}><MoveIcon move={move} />
                  </button></Tooltip>
                })}
              </>
            </div>
            {selectedMoveName === 'cancel'? <></>:
                <Card>
                  {
                    <div>
                      <div className="grid grid-cols-12">
                        <div className='col-span-1'>
                      <MoveIcon move={selectedMove}/>
                       </div>
                      <p className='px-1 col-span-3 text-m'>{selectedMove.text}</p>
                      <p className='px-2 col-span-6 text-m'>{selectedMove.long}</p>
                      </div>
                      <div>
                      <div className="inline-flex">
                      <label>{selectedMove.name}(source, target)</label>
                      <ImplementationHelpModal/>
        </div>
                      <Textarea readOnly={selectedMove.cat !== 'custom'} autoCorrect="off" 
                        style={{whiteSpace:"pre-wrap"}} className="h-96"
                        spellCheck={false} wrap="soft" value={implementationValue} onChange={(e)=>{
                          setImplementationValue(e.target.value);
                          selectedMove.implementation = e.target.value;
                          }}/>
                      <div className="inline-flex">
                      <label>Trigger Implementation</label>
                      <HelpModal text="[Optional, not yet implemented]: Create a square that automatically triggers when a specified condition is met."/>
                      </div>
                      Triggered from: 
                      [
                        Unit dies, 
                        Targed by Melee Attack from here,
                        Targeted by Ranged attack from here,
                        Targeted by Magic from here,
                        Targeted by Enemy from here,
                        Targeted by Ally from here,
                        Your turn begins
                      ]
                      <Textarea readOnly={selectedMove.cat !== 'custom'} autoCorrect="off" 
                        style={{whiteSpace:"pre-wrap"}} className="h-96 z-0"
                        spellCheck={false} wrap="soft" value='TBD'/>
                      </div>
                    </div>
                  }
                </Card>
            }
          </Tabs.Item>
          {/* Drawing Tools */}
          <Tabs.Item title="Drawing">
            <fieldset>
              <legend>Select Tool</legend>
              {["Pen", "Eraser"].map((toolName) => (
                <div className="flex items-center mb-4" key={toolName}>
                  <input type={"radio"} id={toolName} name="tool-select"
                    className="w-4 h-4 border-gray-300 focus:ring-2 focus :ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600"
                    onChange={toolChange} defaultChecked={toolName === "Pen"}
                  />

                  <label htmlFor={toolName}
                    className="block ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  > {toolName} </label>
                </div>
              ))}
              <div className="flex items-center" key='pen'>
                <label htmlFor="strokeSize" key='penSizelabel'
                  className="block mb-2 w-12 pr-4 text-sm font-medium text-gray-900 dark:text-white"
                > Pen Width </label>
                <input type="range" id="strokeSize" name="strokeSize" min="0" max="30" value={strokeWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val) {
                      setStrokeWidth(val)
                    }
                  }
                  }
                  key='penSize'
                  className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="eraseSize" key='eraserSizelabel'
                  className="block mb-2 w-12 pr-4 text-sm font-medium text-gray-900 dark:text-white"
                > Eraser Width </label>
                <input type="range" id="eraseSize" name="eraseSize" min="0" max="20" value={eraseWidth}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val) {
                      setEraseWidth(val)
                    }
                  }
                  }
                  key='eraserSize'
                  className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" onClick={() => { canvas.current?.undo() }} className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                  Undo
                </button>
                <button type="button" onClick={() => { canvas.current?.redo() }} className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                  Redo
                </button>
                <Button onClick={savePiece}>Save</Button>
              </div>
            </fieldset >
          </Tabs.Item>
        </Tabs.Group>
      </div>
    </div>
  );
};
export default PieceEditor;
