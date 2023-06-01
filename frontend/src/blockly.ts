import Blockly from 'blockly';
// Imported in a weird way because the convert_code_server was getting angsty
import pkg from 'blockly/python';
const {pythonGenerator: pyGen} = pkg;

const chessTheme = Blockly.Theme.defineTheme('chessTheme', {
  'base': Blockly.Themes.Classic,
  'name': "chessTheme",
  'startHats': true
});

/*
 ****************************************************
 *****                   VALUES                 *****
/****************************************************
 */
Blockly.Blocks['acting_unit'] = {
  init: function() {
    this.jsonInit({
      "message0": "me",
      "colour": 190,
      "output": "Unit",
      "tooltip": 'Represents the unit that is making its action'
    })
  }
};

pyGen['acting_unit'] = (block: Blockly.Block) => {
  return ['context.acting_piece', pyGen.ORDER_MEMBER]
}

Blockly.Blocks['unit_on_tile'] = {
  init: function() {
    this.jsonInit({
      "colour": 190,
      "output": "Unit",
      "tooltip": 'Get the unit that is standing on this tile',
      "message0": "unit on %1",
      "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Tile"
          }
      ],
    })
  }
};

pyGen['unit_on_tile'] = (block: Blockly.Block) => {
  const code = pyGen.valueToCode(block, 'VALUE', pyGen.ORDER_MEMBER)['piece']
  return [code, pyGen.ORDER_MEMBER]
}

Blockly.Blocks['tile_of_unit'] = {
  init: function() {
    this.jsonInit({
      "colour": 90,
      "output": "Tile",
      "tooltip": 'Get the tile that this unit is on',
      "message0": "tile of %1",
      "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Unit"
          }
      ],
    })
  }
};

pyGen['tile_of_unit'] = (block: Blockly.Block) => {
  const code = 'tile_of(' + pyGen.valueToCode(block, 'VALUE', pyGen.ORDER_NONE) + ')'
  return [code, pyGen.ORDER_FUNCTION_CALL]
}

Blockly.Blocks['targeted_tile'] = {
  init: function() {
    this.jsonInit({
      "message0": "targeted tile",
      "colour": 90,
      "output": "Tile",
      "tooltip": 'Get the tile that is being targeted in this attack',
    })
  }
};

pyGen['targeted_tile'] = (block: Blockly.Block) => {
  return ['context.targeted_tile', pyGen.ORDER_MEMBER]
}

Blockly.Blocks['path'] = {
  init: function() {
    this.jsonInit({
      "colour": 100,
      "message0": "Path from %1 to %2",
      "args0": [
          {
            "type": "input_value",
            "name": "FROM_TILE",
            "check": "Tile"
          },
          {
            "type": "input_value",
            "name": "TO_TILE",
            "check": "Tile"
          },
      ],
      "output": "Tile_Array",
      "inputsInline": true,
    })
    this.setTooltip('Get every tile on the path between two tiles. Moving from [0,0] to [3,6], the path would be {(0,0), (1, 2), (2, 4), (3, 6)]');
  }
}

pyGen['path'] = (block: Blockly.Block) => {
  const code = 'context.path(' +
    pyGen.valueToCode(block, 'FROM_TILE', pyGen.ORDER_NONE) + ", " + 
    pyGen.valueToCode(block, 'TO_TILE', pyGen.ORDER_NONE) + ")\r\n"

  return [code, pyGen.ORDER_MEMBER]
}

/*
 ****************************************************
 *****                  ACTIONS                 *****
/****************************************************
 */
Blockly.Blocks['chess_action'] = {
  init: function() {
    this.jsonInit({
      "message0": "Act %1",
      "colour": 60,
      "tooltip": 'When you perform this move',
      'args0': [
        {
          'type': 'input_statement',
          'name': 'ACTION',
        },
      ],
    })
  }
};
pyGen['chess_action'] = (block: Blockly.Block) => {
  const code = 'def action():\r\n' + pyGen.statementToCode(block, 'ACTION')
  return code
}

Blockly.Blocks['teleport'] = {
  init: function() {
    this.jsonInit({
      "colour": 200,
      "message0": "Move %1 to %2",
      "args0": [
          {
            "type": "input_value",
            "name": "FROM_UNIT",
            "check": "Unit"
          },
          {
            "type": "input_value",
            "name": "TO_TILE",
            "check": "Tile"
          }
      ],
      "inputsInline": true,
      "nextStatement": null,
      "previousStatement": null,
    })
    this.setTooltip('Move to the specified empty square. [If the square is not empty, this action cannot be performed]');
  }
}

pyGen['teleport'] = (block: Blockly.Block) => {
  const code = 'context.tele_to(' +
    pyGen.valueToCode(block, 'FROM_UNIT', pyGen.ORDER_NONE) + ", " + 
    pyGen.valueToCode(block, 'TO_TILE', pyGen.ORDER_NONE) + ")\r\n"

  return code
}

Blockly.Blocks['take'] = {
  init: function() {
    this.jsonInit({
      "colour": 200,
      "message0": "take %1",
      "args0": [
          {
            "type": "input_value",
            "name": "TARGET_UNIT",
            "check": "Unit"
          }
      ],
      "inputsInline": true,
      "nextStatement": null,
      "previousStatement": null,
    })
    this.setTooltip('Remove this piece from the board.');
  }
}

pyGen['take'] = (block: Blockly.Block) => {
  const code = 'context.take(' +
    pyGen.valueToCode(block, 'TARGET_UNIT', pyGen.ORDER_NONE) + ")\r\n"
  return code
}

export {chessTheme, Blockly, pyGen as pythonGenerator}
