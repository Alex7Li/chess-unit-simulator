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

Blockly.Blocks['attack'] = {
  init: function() {
    this.jsonInit({
      "colour": 200,
      "message0": "Attack %1",
      "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Unit"
          }
      ],
      "nextStatement": null,
      "previousStatement": null,
    })
    this.setTooltip('Destroy the specified unit and move to its square. [If there is no specified unit, or the movement is impossible, this action cannot be performed]');
  }
};

Blockly.Blocks['move'] = {
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

pyGen['move'] = (block: Blockly.Block) => {
  const code = 'context.move_to(' +
    pyGen.valueToCode(block, 'FROM_UNIT', pyGen.ORDER_NONE) + ", " + 
    pyGen.valueToCode(block, 'TO_TILE', pyGen.ORDER_NONE) + ")\r\n"

  return code
}

Blockly.Blocks['move_or_attack'] = {
  init: function() {
    this.jsonInit({
      "colour": 200,
      "message0": "Move or Attack %1",
      "args0": [
          {
            "type": "input_value",
            "name": "VALUE",
            "check": "Tile"
          }
      ],
      "nextStatement": null,
      "previousStatement": null,
    })
    this.setTooltip('Move to the specified square. If there is a unit on that square, destroy the unit first.');
  }
};

export {chessTheme, Blockly, pyGen as pythonGenerator}
