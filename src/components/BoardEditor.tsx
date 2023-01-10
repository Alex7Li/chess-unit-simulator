import React, {FC, useState} from 'react'
import { NAME_TO_PIECE, PIECES } from './definitions';
import { BoardSetup, Piece } from './types';
import _ from 'lodash'
import PieceView from './PieceView';
import HelpModal from './HelpModal';
interface BoardEditorProps {
  boardSetup: BoardSetup
  setBoardSetup: React.Dispatch<React.SetStateAction<BoardSetup>>
  selectedPiece: Piece,
  setSelectedPiece: React.Dispatch<React.SetStateAction<Piece>>
}
interface PiecesViewProps {
  selectedPiece: Piece,
  setSelectedPiece: React.Dispatch<React.SetStateAction<Piece>>
}

const PiecesView: FC<PiecesViewProps> = ({selectedPiece, setSelectedPiece}) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-96 border-gray-900 border-2 p-0 m-0">
    {PIECES.map((piece)=>{
      let className = "hover:bg-slate-300"
      if(piece.name === selectedPiece?.name) {
        className += " bg-slate-200"
      }
    return <button key={piece.name} onClick={()=>{setSelectedPiece(piece)}}className={className}>
      <img draggable="false" src={piece.image}/></button>
  })}
  </div>
}

const BoardEditor: FC<BoardEditorProps> = ({boardSetup, selectedPiece, setBoardSetup, setSelectedPiece}) => {
  return  <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-96 border-gray-900 border-2 p-0 m-0"
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
          if(boardCell != null) {
            inner_element = <img draggable="false" src={NAME_TO_PIECE.get(boardCell)!.image}/>
          }
    const handler_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        // middle click or control click to view information
        if(boardSetup[row][col] != null &&  e.button == 1 || (e.button == 0 && e.ctrlKey)) {
          setSelectedPiece(NAME_TO_PIECE.get(boardSetup[row][col]!)!);
          return;
        }
        const newGrid = _.cloneDeep(boardSetup);
        // Erase if the mouse is holding down the right click button.
        if ((e.button == 2 || selectedPiece.name == "Delete")) {
          newGrid[row][col] = null;
        } else {
          newGrid[row][col] = selectedPiece.name;
        }
        setBoardSetup(newGrid);
          }
          return <button className={grid_style} key={row * 17 + col} onMouseDown={handler_func}>
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

initBoardSetup[0][0] = 'Rook'
initBoardSetup[0][1] = 'Rook'

interface BoardEditorViewProps {
}

const BoardEditorView: FC<BoardEditorViewProps> = () => {
    const [selectedPiece, setSelectedPiece] = useState<Piece>(NAME_TO_PIECE.get('Delete')!)
    const [boardSetup, setBoardSetup] = useState<BoardSetup>(initBoardSetup);
    return <div className="grid md:grid-cols-2">
      <div className="col-span-1">
        <PiecesView setSelectedPiece={setSelectedPiece} selectedPiece={selectedPiece}></PiecesView>
        <BoardEditor boardSetup={boardSetup} setBoardSetup={setBoardSetup} selectedPiece={selectedPiece} setSelectedPiece={setSelectedPiece}/>
      </div>
      <div className="col-span-1">
        {selectedPiece == null ? <div></div> : <PieceView piece={selectedPiece}></PieceView>}
      </div>
      </div>

}

export default BoardEditorView;