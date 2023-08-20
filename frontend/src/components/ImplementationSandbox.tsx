/*
Sandbox with the code implementation
Example usage:
<div id="SOME_STRING" style={{"height": '30rem'}}>
  <ImplementationSandbox onCodeChange={()=>{}} divId="SOME_STRING"/>
</div>
*/
import 'blockly/blocks_compressed'


import React, {FC, useEffect} from "react";
import {Blockly, chessTheme} from '../blockly';
// @ts-ignore
import { TypedVariableModal } from '@blockly/plugin-typed-variable-modal';


interface ImplementationSandboxProps {
  onCodeChange : null | ((workspace: Blockly.WorkspaceSvg) => void)
  divId: string
  readOnly: boolean
  initialState: {[key: string]: any} | null
}
const toolbox = {
  "kind": "categoryToolbox",
  "contents": [
    {
      "kind": "category",
      "name": "Chess",
      "contents": [
        {
          "kind": "block",
          "type": "chess_action"
        },
        {
          "kind": "block",
          "type": "acting_unit"
        },
        {
          "kind": "block",
          "type": "teleport",
          "inputs": {
            "FROM_UNIT": {
              "block": {
                "type": "acting_unit",
              }
            },
          }
        },
        {
          "kind": "block",
          "type": "take"
        },
        {
          "kind": "block",
          "type": "unit_on_tile"
        },
        {
          "kind": "block",
          "type": "unit_is_on_tile"
        },
        {
          "kind": "block",
          "type": "tile_of_unit"
        },
        {
          "kind": "block",
          "type": "targeted_tile"
        }
      ]
    },
    {
      "kind": "category",
      "name": "Lists",
      "contents": [
        {
          "kind": "block",
          "type": "path",
          "inputs": {
            "BEGIN_EXCLUSIVE": {
              "block": {
                "type": "math_number",
                "fields": {
                  "NUM": 1
                }
              }
            },
            "END_EXCLUSIVE": {
              "block": {
                "type": "math_number",
                "fields": {
                  "NUM": 1
                }
              }
            },
          }
        },
        {
          "kind": "block",
          "type": "for_all_tiles"
        }
      ]
    },
    {
      "kind": "category",
      "name": "Control",
      "contents": [
        {
          "kind": "block",
          "type": "controls_if"
        },
        {
          "kind": "block",
          "type": "controls_for",
          "inputs": {
            "FROM": {
              "block": {
                "type": "math_number",
                "fields": {
                  "NUM": 0
                }
              }
            },
            "BY": {
              "block": {
                "type": "math_number",
                "fields": {
                  "NUM": 1
                }
              }
            },
          }
        },
      ]
    },
    {
      "kind": "category",
      "name": "Variables",
      "custom": "CREATE_TYPED_VARIABLE"
    },
    {
      "kind": "category",
      "name": "Math",
      "contents": [
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
          "type": "math_single"
        },
      ]
    },
    {
      "kind": "category",
      "name": "Logic",
      "contents": [
        {
          "kind": "block",
          "type": "logic_compare"
        },
        {
          "kind": "block",
          "type": "logic_operation"
        },
        {
          "kind": "block",
          "type": "logic_negate"
        },
        {
          "kind": "block",
          "type": "logic_boolean"
        }
      ]
    }
  ]
}

export const ImplementationSandbox: FC<ImplementationSandboxProps> = ({onCodeChange, divId, readOnly, initialState}) => {
  let workspace: undefined | Blockly.WorkspaceSvg = undefined
  let blocklyDivId = 'blocklyDiv_' + divId
  function onVisible(element: any, callback: any) {
    new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.intersectionRatio > 0) {
          callback(element);
          observer.disconnect();
        }
      });
    }).observe(element);
  };

  useEffect(() => {
    const blocklyArea = document.getElementById(divId)!
    const blocklyDiv = document.createElement('div')
    blocklyDiv.id = blocklyDivId
    blocklyDiv.style.position = 'absolute'
    blocklyArea.appendChild(blocklyDiv)
    workspace = Blockly.inject(blocklyDiv.id, {toolbox: toolbox, 
      theme: chessTheme, readOnly: readOnly});
    if(onCodeChange != null) {
      workspace.addChangeListener(() => 
        onCodeChange(workspace!)
      );
    }
    if (initialState != null) {
      Blockly.serialization.workspaces.load(initialState, workspace)
    }

    const onResize = function() {
      // Compute the absolute coordinates and dimensions of blocklyArea.
      let element = blocklyArea;
      let x = 0;
      let y = 0;
      do {
        x += element.offsetLeft;
        y += element.offsetTop;
        // @ts-ignore
        element = element.offsetParent;
      } while (element);
      // Position blocklyDiv over blocklyArea.
      blocklyDiv.style.left = x + 'px';
      blocklyDiv.style.top = y + 'px';
      blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
      blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
      // @ts-ignore
      Blockly.svgResize(workspace);
    };
    window.addEventListener('resize', onResize, false);
    // We must wait for the move editor tab to be selected before doing the first resize.
    // Otherwise, our code will fire immediately and the size will be 0, since
    // tab is hidden.
    onVisible(blocklyDiv, onResize);

    const createFlyout = function(workspace: Blockly.WorkspaceSvg) {
      let xmlList: HTMLButtonElement[] = [];
      // Add your button and give it a callback name.
      const button = document.createElement('button');
      button.setAttribute('text', 'Create Typed Variable');
      button.setAttribute('callbackKey', 'callbackName');
  
      xmlList.push(button);
  
      // This gets all the variables that the user creates and adds them to the
      // flyout.
      // @ts-ignore
      const blockList: HTMLButtonElement[] = Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace);
      xmlList = xmlList.concat(blockList);
      return xmlList;
    };

    workspace.registerToolboxCategoryCallback('CREATE_TYPED_VARIABLE', createFlyout);
    const typedVarModal = new TypedVariableModal(workspace, 'callbackName', 
    [["TileList", "TileList"], ["Tile", "Tile"], ["Unit", "Unit"], ['Boolean','Boolean'], ['Number', 'Number']]);
    typedVarModal.init();

    return () => {
      document.getElementById(blocklyDivId)?.remove()
    }
  }, [initialState])
  return <></>
}