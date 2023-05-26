import _, { merge, remove } from 'lodash'

import { Blockly, pythonGenerator} from './blockly';
import { BoardSetupMeta, Move, Piece, Game, LobbySetup } from './components/types'
import { api } from "./App"
import { chessStore } from "./store";

export const fetchMoves = async () => {
    const response = await api.get('/moves', {
      params: {}
    })
    // _.mapValues(response.data, (move: Move) => {
    //   console.log("CC")
    //   const moveBlocks = new Blockly.WorkspaceSvg(new Blockly.Options({readOnly: true}))
    //   console.log("BB")
    //   console.log(move['implementation'])
    //   Blockly.serialization.workspaces.load(
    //     move['implementation'], moveBlocks)
    //   console.log("AA")
    //   move['implementation'] = moveBlocks
    //   return move
    // });
    chessStore.setState((state) => {
      state.updateMoves(response.data);
      return {}
    });
    // const updateMoves = chessStore((state) => state.updateMoves);
    // chessStore.updateMoves(response.data)
}