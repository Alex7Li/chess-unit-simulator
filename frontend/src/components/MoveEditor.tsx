import React, { FC, useRef, useState, useEffect } from "react";
import { Tabs, Modal, Tooltip, Card, Textarea, Button, Label, TextInput } from "flowbite-react"
import _, { update } from 'lodash'
import { MoveGrid, Move, Piece } from './types'
import MoveIcon from './MoveIcon'
import { IntegerInput } from "./NumericInput"
import { SaveElement, SaveState } from "./utils";
import { api } from "../App"
import { ImplementationSandbox } from "./ImplementationSandbox";
import { MoveSelect } from './PieceEditor'
import { Blockly, pythonGenerator } from '../blockly';

import { chessStore, updateMoves } from "../store";

interface MoveEditorProps {

}

const newMoveTemplate: Move = {
  "cat": "unmade",
  "overview": "",
  "description": "",
  "color": [_.random(0, 255), _.random(0, 255), _.random(0, 255)],
  "implementation": null,
  "symbol": "",
  "pk": -2,
}
interface MoveSelectModalProps {
  setSelectedMove: (move: Move) => void
}

interface ViewCodeModalProps {
  pythonCode: string
}
const MoveSelectModal: FC<MoveSelectModalProps> = ({setSelectedMove}) => {
  const [isShown, setShown] = useState<boolean>(false);
  const moves = chessStore(state => state.userMoves)
  return <div>
  <Button onClick={() => setShown(true)} className="h-3 w-30">
    Manage created moves
  </Button>
  <Modal
    show={isShown}
    onClose={() => setShown(false)}
    className="z-[200]"
  >
    <Modal.Header>
      Select move to edit, or create a new move
    </Modal.Header>
    <Modal.Body>
      Select a move to edit:
      <MoveSelect moves={moves} onClick={(move)=>{setShown(false); setSelectedMove(move);}}/>
      Create a new move:
      <MoveSelect moves={[newMoveTemplate]} onClick={(move)=>{setShown(false); setSelectedMove(move);}}/>
      Selecting will discard unsaved changes to your current move
    </Modal.Body>
  </Modal>
</div>
}
const ViewCodeModal: FC<ViewCodeModalProps> = ({pythonCode}) => {
  const [isShown, setShown] = useState<boolean>(false);
  return <div>
  <Button onClick={() => setShown(true)} className="h-3 w-30">
    View generated code
  </Button>
  <Modal
    show={isShown}
    onClose={() => setShown(false)}
  >
    <Modal.Header>
      Generated python code (<a style={{"textDecoration":"underline", "color":"blue"}} href="https://github.com/Alex7Li/chess-unit-simulator/blob/main/api/game_logic.py">View context</a>)
    </Modal.Header>
    <Modal.Body>
      <pre lang="python">
        {pythonCode?pythonCode:"No code was generated"}
      </pre>
    </Modal.Body>
  </Modal>
</div>
}

export const MoveEditor: FC<MoveEditorProps> = ({ }) => {
  const [move, setMove] = useState(newMoveTemplate);
  const [saveStatus, setSaveStatus] = useState<SaveState>("ok")
  const [pythonCode, setPythonCode] = useState<string>("")
  const [initialState, setInitialState] = useState<null | {[key: string]: any}>(null)
  const setSelectedMove = (move: Move) => {
    setMove(move);
    setInitialState(move.implementation)
  }

  const saveMove = (edit: boolean) => {
    if(move['implementation'] == null) {
      setSaveStatus('fail')
      console.error("No move implementation given")
      return
    }
    setSaveStatus('saving')
    if(edit == false) {
      move.pk = -2
    }
    api.post("/moves", {}, {
      params: {
        newMove: move,
      }
    }).then((response) => {
      updateMoves([response.data['new_move']])
      setSaveStatus('ok')
    }).catch((error) => {
      setSaveStatus('fail')
    })
  }
  /**
   * input: a function.
   * output: a function that takes a value and applies the given function to the currently selected move.
   */
  function immutableUpdateMove(update: (value: any, m: Move) => void): (value: any) => void {
    return (v) => {
      const move_copy = _.clone(move)
      update(v, move_copy)
      setMove(move_copy);
    }
  }
  function immutableUpdateMoveFromHandler(update: (value: string, m: Move) => void): React.ChangeEventHandler {
    const upd = immutableUpdateMove(update);
    return (e) => {
      // @ts-ignore
      upd(e.target.value); 
    }
  }
  
  const updateMoveDescription = immutableUpdateMoveFromHandler((v, m) => m.description = v);
  const updateMoveOverview = immutableUpdateMoveFromHandler((v, m) => m.overview = v);
  const updateMoveSymbol = immutableUpdateMoveFromHandler((v, m) => m.symbol = v);
  const updateMoveImplementation = immutableUpdateMove((v, m) => m.implementation = v);

  const updateMoveColor = (color_index: number, new_value: number) => {
    const move_copy = _.clone(move)
    move_copy.color[color_index] = new_value
    setMove(move_copy);
  }

  return <div>
    <Card>
    <div className="grid grid-cols-12">
      <div className='col-span-1'>
        <MoveIcon move={move} />
      </div>
      <Textarea value={move.overview} onChange={updateMoveOverview} placeholder="Concise reminder of the ability" className="px-r mx-0.5 col-span-3 text-m bg-slate-100 h-18" />
      <Textarea value={move.description} onChange={updateMoveDescription} placeholder="A detailed description of what this move does." className="px-2 mx-0.5 col-span-8 text-m bg-slate-100 h-18" />
    </div>
    <div className='inline-flex'>
      Color
      {_.zip([0, 1, 2], ['R', 'G', 'B']).map((v) => {
        const i: number = v[0]!;
        const c: string = v[1]!;
        return <IntegerInput min={0} max={255} labelClass="block h-2 mb-2 w-4 pl-2 pr-3 text-sm font-medium text-gray-900 dark:text-white"
          inputClass="h-2 w-20 bg-gray-100 rounded-lg cursor-pointer dark:bg-gray-900"
          formValue={move.color[i]} setFormValue={(x) => updateMoveColor(i, x)} label={c} key={i} />;
      })}
    </div>
    <div className='inline-flex'>
      Inner Symbol
      <TextInput
        id="innerSymbol"
        type="text"
        placeholder="Symbol"
        value={move.symbol}
        onChange={updateMoveSymbol}
        maxLength={3}
      />
    </div>
    <div id="blocklyArea" style={{"height": '30rem'}}>
      <ImplementationSandbox
      onCodeChange={(workspace) => {
        const code = pythonGenerator.workspaceToCode(workspace)
        console.log(code)
        const workspace_json = Blockly.serialization.workspaces.save(workspace);
        updateMoveImplementation(workspace_json)
        setPythonCode(code)
      }}
      divId="blocklyArea"
      readOnly={false}
      initialState={initialState}/>
    </div>
    <div className='inline-flex'>
      <Button onClick={()=>saveMove(false)}>Save as new move</Button>
      {move.pk == -2 ? <></> : <Button onClick={()=>saveMove(true)}>Overwrite existing move</Button>}
      <SaveElement savingState={saveStatus} />
      <MoveSelectModal setSelectedMove={setSelectedMove}/>
      <ViewCodeModal pythonCode={pythonCode}/>
    </div>
  </Card>
  </div>
}