import React, {FC, useEffect} from "react";
import Blockly from 'blockly';
import {pythonGenerator} from 'blockly/python';

interface ImplementationSandboxProps {
}
const toolbox = {
  "kind": "flyoutToolbox",
  "contents": [
    {
      "kind": "block",
      "type": "controls_if"
    },
    {
      "kind": "block",
      "type": "controls_repeat_ext"
    },
    {
      "kind": "block",
      "type": "logic_compare"
    },
    {
      "kind": "block",
      "type": "math_number"
    },
    {
      "kind": "block",
      "type": "math_arithmetic"
    },
    {
      "kind": "block",
      "type": "text"
    },
    {
      "kind": "block",
      "type": "text_print"
    },
  ]
}
let workspace: undefined | Blockly.WorkspaceSvg = undefined

export const ImplementationSandbox: FC<ImplementationSandboxProps> = ({}) => {
  function onCodeChange() {
    const pythonCode = pythonGenerator.workspaceToCode(workspace);
  }
  useEffect(() => {
    const container = document.getElementById('blocklyContainer')!
    const div = document.createElement('div')
    div.id = 'blocklyDiv'
    div.className = "h-96 w-96"
    container.appendChild(div)
    workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
    workspace.addChangeListener(onCodeChange);
    return () => {
      document.getElementById('blocklyDiv')?.remove()
    }
  }, [])
  return <div id="blocklyContainer"></div>
}