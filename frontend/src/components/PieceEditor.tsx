import React, { FC, useRef, useState, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Tabs, Tooltip, Card, Textarea, Button, Label, TextInput } from "flowbite-react"
import _ from 'lodash'
import { MoveGrid, Move, Piece } from './types'
import { MovesView } from './PieceView'
import MoveIcon from './MoveIcon'
import { IntegerInput } from "./NumericInput"
import { SaveElement, SaveState } from "./utils";
import { api } from "../App"

const initMoveGrid: MoveGrid = Array.from({ length: 15 }).map(() => {
  return Array.from({ length: 15 }).map(() => {
    return null
  });
});

export const moveOrder = (a: Move) => {
  switch (a.cat) {
    case "UI": return 0;
    case "official": return 1;
    case "custom": return 2;
    case "unmade": return 3;
    default: console.error("Got bad move category: " + a.cat); return 3;
  }
}

interface MoveSelectProps {
  onClick: (move: Move) => void;
  moves: Array<Move>;
  highlightedMove?: Move,
}
export const MoveSelect: FC<MoveSelectProps> = ({moves, onClick, highlightedMove}) => {
  return <div className="grid grid-cols-10 w-80">
    <>
      {moves.map((move: Move, idx) => {
        let buttonClassName = 'h-6 w-6';
        if (move === highlightedMove) {
          buttonClassName += " bg-stone-600"
        }
        return <Tooltip animation={false} content={move.name + ": " + move.overview} key={idx}>
          <button onClick={(e) => { onClick(move) }} className={buttonClassName}><MoveIcon move={move} />
          </button></Tooltip>
      })}
    </>
  </div>

}
interface PieceEditorProps {
  mouseDownState: number
}

const PieceEditor: FC<PieceEditorProps> = ({ mouseDownState }) => {
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraseWidth, setEraseWidth] = useState(20);
  // const [color, setColor] = useState("black");
  const canvas = useRef<ReactSketchCanvasRef>(null);
  const [pieceName, setPieceName] = useState<string>('');
  const [moveGrid, changeMoveGrid] = useState<MoveGrid>(initMoveGrid);

  // const [moves, updateMoves] = useState(MOVES);
  const [moves, updateMoves] = useState<Array<Move>>([{
    "cat": "UI",
    "name": "cancel",
    "overview": "Use to delete an action. ",
    "description": "Delete an action you added before. Left click works as well.",
    "color": [255, 255, 255],
    "implementation": "",
    "symbol": "\u232B",
    "pk": -1,
  }]);
  const [selectedMove, selectMove] = useState<Move>(moves[0]);
  const [saveStatus, setSaveStatus] = useState<SaveState>("ok")
  useEffect(() => {
    api.get('/moves', {
      params: {}
    }).then((response) => {
      let new_moves = [...moves, ...response.data];
      new_moves = _.uniqBy(new_moves, (move) => move.pk)
      new_moves.sort((a, b) => {
        return moveOrder(a) - moveOrder(b);
      })
      updateMoves(new_moves)
    })
  }, [saveStatus])
  const pk_to_move = new Map<Number, Move>(); //Lookup key by move name
  _.forEach(moves, function (m: Move, ix: number) {
    pk_to_move.set(m.pk, m);
  });

  const toolChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.id === "Eraser") {
      canvas.current?.eraseMode(true);
    } else if (e.target.id === "Pen") {
      canvas.current?.eraseMode(false);
    }
  };
  const savePiece: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setSaveStatus("saving");
    canvas.current?.exportImage('png').then(data => {
      console.log(data)
      const creation: Piece = {
        name: pieceName,
        passives: "",
        image: data,
        moves: moveGrid,
      }
      api.post('/pieces',
        {params: {creation}}
      ).then((response) => {
        setSaveStatus('ok');
      }).catch(() => {
        setSaveStatus('fail');
      })
    }).catch(e => {
      setSaveStatus('fail');
      console.error(e);
    })
  }
  return (
    <div className="grid sm:grid-cols-2">
      {/* Unit view */}
      <div className="col-span-1">
        <form className="flex flex-col w-60 place-items-center">
          <TextInput
            id="pieceName"
            type="text"
            placeholder="Piece Name"
            value={pieceName}
            onChange={(e) => setPieceName(e.target.value)}
            maxLength={31}
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
          <MovesView moveGrid={moveGrid} changeMoveGrid={changeMoveGrid} selectedMove={selectedMove} mouseDownState={mouseDownState} pkToMove={pk_to_move} />
        </div>
        <div className='container mx-auto p-1'>
          {
            _.uniq(_.flatMap(moveGrid)).filter((x) => { return x != null }).map((moveName, idx) => {
              const move = pk_to_move.get(moveName!)!;
              return <div className='inline-flex' key={idx}> <MoveIcon move={move}></MoveIcon>{move.overview}</div>;
            })
          }
        </div>
      </div>
      <div className="col-span-1">
        <Tabs.Group aria-label="Default tabs">
          {/* Action Tools */}
          <Tabs.Item title="Actions">
            <MoveSelect onClick={(move: Move) => selectMove(move)} moves={moves} highlightedMove={selectedMove}/>
            <Card>
              <div className="grid grid-cols-12">
                <div className='col-span-1'>
                  <MoveIcon move={selectedMove} />
                </div>
                <p className="px-1 mx-0.5 col-span-4 text-m h-18">{selectedMove.overview}</p>
                <p className="px-2 mx-0.5 col-span-7 text-m h-18">{selectedMove.description}</p>
                <div>
                  {selectedMove.implementation ?
                    <>
                      <div className="inline-flex">
                        <label className='flex'>
                          <p className='h-0 w-fit whitespace-nowrap'>{selectedMove.name}(source, target):</p>
                        </label>
                      </div>
                      <p>{selectedMove.implementation}</p>
                    </>
                    : <></>}
                </div>
              </div>
            </Card>
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
              <IntegerInput min={0} max={20} formValue={strokeWidth} setFormValue={setStrokeWidth} label="Pen Size" barStyle />
              <IntegerInput min={0} max={30} formValue={eraseWidth} setFormValue={setEraseWidth} label="Eraser Size" barStyle />
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" onClick={() => { canvas.current?.undo() }} className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                  Undo
                </button>
                <button type="button" onClick={() => { canvas.current?.redo() }} className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white">
                  Redo
                </button>
              </div>
            </fieldset >
          </Tabs.Item>
          <Tabs.Item title="Admin">
            <div className='inline-flex'>
              <Button onClick={savePiece}>Save</Button>
              <SaveElement savingState={saveStatus} />
            </div>
          </Tabs.Item>
        </Tabs.Group>
      </div>
    </div>
  );
};
export default PieceEditor;
