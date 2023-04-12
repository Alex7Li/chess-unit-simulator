import React, { FC, useState, useEffect } from 'react'
import { PIECES, PK_TO_PIECE } from './definitions';
import { BoardSetup, Move, Piece } from './types';
import _, { update } from 'lodash'
import { api } from "../App"
import PieceView from './PieceView';
import { boardSetupToMap, moveMapToGrid } from './utils'
import { SaveElement, SaveState } from "./utils";
import { Button, TextInput } from "flowbite-react"
import { chessStore } from '../store';

interface BoardEditorProps {
  boardSetup: BoardSetup;
  locToHandler: (row: number, col: number) => React.MouseEventHandler<HTMLButtonElement> 
}
interface PiecesViewProps {
  selectedPiece: Piece | null,
  setSelectedPiece: React.Dispatch<React.SetStateAction<Piece | null>>,
  pieces: Array<Piece>
  swapColors: () => void
  placingWhite: boolean
}

const PiecesView: FC<PiecesViewProps> = ({ selectedPiece, setSelectedPiece, pieces, swapColors, placingWhite }) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-96 border-gray-900 border-2 p-0 m-0">
    {pieces.map((piece) => {
      let className = "hover:bg-slate-300"
      if (piece.pk === selectedPiece?.pk) {
        className += " bg-slate-200"
      }
      let action;
      if (piece.pk == -1) {
        action = () => { swapColors() }
      } else {
        action = () => { setSelectedPiece(piece) }
      }
      return <button key={piece.pk} onClick={action} className={className}>
        <img draggable="false" src={placingWhite ? piece.image_white : piece.image_black} /></button>
    })}
  </div>
}

export const BoardEditor: FC<BoardEditorProps> = ({ locToHandler, boardSetup }) => {
  const pkToPiece = chessStore((state) => state.pkToPiece)
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-96 border-gray-900 border-2 p-0 m-0"
    onContextMenu={(e) => e.preventDefault()}>
    {boardSetup.map((boardLine, row) => {
      return boardLine.map((boardCell, col) => {
        const parity = (row + col) % 2 === 0 ? 'dark' : 'light';
        // Note: we need to include all class names in the code so that tailwind
        // sees that we are using them (can't do bg-grid_{parity})
        let grid_style = "h-12 w-12 m-0 b-0 min-w-full"
        if (parity === 'light') {
          grid_style += " bg-grid_light hover:bg-blue-100 focus:bg-blue-300"
        } else {
          grid_style += " bg-grid_dark hover:bg-green-100 focus:bg-green-300"
        }
        let inner_element = <></>
        if (boardCell != null) {
          let image_url = ''
          const piece: Piece = pkToPiece.get(boardCell.piece_pk)!
          if (boardCell.is_white) {
            image_url = piece.image_white
          } else {
            image_url = piece.image_black
          }
          inner_element = <img draggable="false" src={image_url} />
        }
        return <button className={grid_style} key={row * 15 + col} onMouseDown={locToHandler(row, col)}>
          {inner_element}
        </button>
      })
    })
    }
  </div>
}
const initBoardSetup: BoardSetup = Array.from({ length: 8 }).map(() => {
  return Array.from({ length: 8 }).map(() => {
    return null
  });
});

interface BoardEditorViewProps {
}

const BoardEditorView: FC<BoardEditorViewProps> = () => {
  const pieces_orig = chessStore(state => state.pieces)
  const pieces = [
    {
      "name": "Delete", 
      "image_white": "data:image/png;base64,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fOK/R72ve7neCVSbD7HA2qtnizZ+Kpw4Ia711t0FabzAlCjsJsacNnlp8Fkcn0Cgq+sK77/uNdrCNJo0Z3H3+jxEgSDpaOL6YMwnEAhlLd0IwfFZqXCjC3U1UjDRntWbx5GD9+XEKH3ntaP4rF1PIRANzhdYVxBuJAe9OvVHadMFRpSWibbSTQg8iUC1e4n2oEeJ97xcmC5pj4yy84nmjGszZg9Az78/iUClmyC2ZPtJ4krdeg6SKD0UgScRCBFDIkaiUrhIHDXceIgeqtNTm/00Ak0FVy/zj4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABP4LJsAG/ndmmjgAAAAASUVORK5CYII=",
      "image_black": "data:image/png;base64,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fOK/R72ve7neCVSbD7HA2qtnizZ+Kpw4Ia711t0FabzAlCjsJsacNnlp8Fkcn0Cgq+sK77/uNdrCNJo0Z3H3+jxEgSDpaOL6YMwnEAhlLd0IwfFZqXCjC3U1UjDRntWbx5GD9+XEKH3ntaP4rF1PIRANzhdYVxBuJAe9OvVHadMFRpSWibbSTQg8iUC1e4n2oEeJ97xcmC5pj4yy84nmjGszZg9Az78/iUClmyC2ZPtJ4krdeg6SKD0UgScRCBFDIkaiUrhIHDXceIgeqtNTm/00Ak0FVy/zj4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABESggeCqaP8IiED+ZawWDkRABBoIror2j4AI5F/GauFABP4LJsAG/ndmmjgAAAAASUVORK5CYII=",
      "moves": [ [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ] ],
      "pk": -2
    },
    {
      "name": "Color switch", 
      "image_white": 'media/color-switch.png',
      "image_black": 'media/color-switch.png',
      "moves": [ [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ], [ null, null, null, null, null, null, null, null, null, null, null, null, null, null, null ] ],
      "pk": -1
   }, ...pieces_orig
  ]
  const updatePieces = chessStore(state => state.updatePieces)
  const pkToPiece = chessStore(state => state.pkToPiece)
  pkToPiece.set(-2, pieces[0]);
  pkToPiece.set(-1, pieces[1]);
  const updatePkToMove = chessStore((state) => state.updatePkToMove)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)
  const [boardSetup, setBoardSetup] = useState<BoardSetup>(initBoardSetup);
  const [placingWhite, setPlacingWhite] = useState<boolean>(true);
  const [boardName, setBoardName] = useState<string>("");
  const updateBoardSetups = chessStore((state) => state.updateBoardSetups)
  useEffect(() => {
    api.get('/pieces', {
      params: {}
    }).then((response) => {
      const data = response.data;
      // Add the pieces to our storage.
      updatePieces(data['pieces'])
      // Also add tany moves that those pieces may use.
      const moves = data['move_map']
      updatePkToMove(moves);
    })
  }, [])
  const swapColors = () => {
    setPlacingWhite(!placingWhite);
  }
  const saveBoard: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setSaveStatus("saving");
    const pieces = boardSetupToMap(boardSetup)
    api.post('/boardSetups',
      {
        params: {
          name: boardName,
          piece_locations: pieces,
        }
      }
    ).then((response) => {
      updateBoardSetups(response.data['new_board_setups'])
      setSaveStatus('ok');
    }).catch(() => {
      setSaveStatus('fail');
    })
  }
  const [saveStatus, setSaveStatus] = useState<SaveState>("ok")
  const locToHandler  = (row: number, col: number) => {
      const handlerFunc: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      // middle click or control click to view information
      if (boardSetup[row][col] != null && e.button == 1 || (e.button == 0 && e.ctrlKey)) {
        setSelectedPiece(pkToPiece.get(boardSetup[row][col]?.piece_pk!)!);
        return;
      }
      if (selectedPiece == null) {
        return;
      }
      const newGrid = _.cloneDeep(boardSetup);
      // Erase if the mouse is holding down the right click button.
      if ((e.button == 2 || selectedPiece.pk == -2)) {
        newGrid[row][col] = null;
      } else {
        newGrid[row][col] = {
          'piece_pk': selectedPiece.pk,
          'is_white': placingWhite
        }
      }
      setBoardSetup(newGrid);
    }
    return handlerFunc
  }
  return <div className="grid md:grid-cols-2">
    <div className="col-span-1">
      <PiecesView setSelectedPiece={setSelectedPiece} selectedPiece={selectedPiece} pieces={pieces} swapColors={swapColors} placingWhite={placingWhite} />
      <BoardEditor boardSetup={boardSetup} pkToPiece={pkToPiece} locToHandler={locToHandler}/>
    <div className='inline-flex'>
        <TextInput
          id="boardName"
          type="text"
          placeholder="Board Name"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          maxLength={63}
        />
      <Button onClick={saveBoard}>Save</Button>
      <SaveElement savingState={saveStatus} />
    </div>
    </div>
    <div className="col-span-1">
      {(selectedPiece == null) ? <div></div> : <PieceView piece={selectedPiece}></PieceView>}
    </div>
  </div>
}

export default BoardEditorView;
