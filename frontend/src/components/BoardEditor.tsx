import React, {FC, useState, useEffect} from 'react'
import { PIECES, PK_TO_PIECE } from './definitions';
import { BoardSetup, Move, Piece } from './types';
import _ from 'lodash'
import { api } from "../App"
import PieceView from './PieceView';
import {moveMapToGrid} from './utils'
import internal from 'stream';

interface BoardEditorProps {
  boardSetup: BoardSetup
  setBoardSetup: React.Dispatch<React.SetStateAction<BoardSetup>>
  selectedPiece: Piece | null,
  setSelectedPiece: React.Dispatch<React.SetStateAction<Piece | null>>
  pkToPiece: Map<Number, Piece>
}
interface PiecesViewProps {
  selectedPiece: Piece | null,
  setSelectedPiece: React.Dispatch<React.SetStateAction<Piece | null>>,
  pieces: Array<Piece>
}

const PiecesView: FC<PiecesViewProps> = ({selectedPiece, setSelectedPiece, pieces}) => {
  return <div className="grid grid-cols-8 grid-rows-8 gap-x-0 w-96 border-gray-900 border-2 p-0 m-0">
    {pieces.map((piece)=>{
      let className = "hover:bg-slate-300"
      if(piece.pk === selectedPiece?.pk) {
        className += " bg-slate-200"
      }
    return <button key={piece.pk} onClick={()=>{setSelectedPiece(piece)}}className={className}>
      <img draggable="false" src={piece.image}/></button>
  })}
  </div>
}

const BoardEditor: FC<BoardEditorProps> = ({boardSetup, selectedPiece, setBoardSetup, setSelectedPiece, pkToPiece}) => {
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
          if (boardCell != null) {
            inner_element = <img draggable="false" src={pkToPiece.get(boardCell)!.image}/>
          }
    const handler_func: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        // middle click or control click to view information
        if(boardSetup[row][col] != null &&  e.button == 1 || (e.button == 0 && e.ctrlKey)) {
          setSelectedPiece(pkToPiece.get(boardSetup[row][col]!)!);
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
          newGrid[row][col] = selectedPiece.pk;
        }
        setBoardSetup(newGrid);
          }
          return <button className={grid_style} key={row * 15 + col} onMouseDown={handler_func}>
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
    const [pieces, setPieces] = useState<Array<Piece>>(PIECES);
    const [pkToPiece, setPkToPiece] = useState<Map<Number, Piece>>(PK_TO_PIECE);
    const [pkToMove, setPkToMove] = useState<{[index: number]: Move} | null>(null);
    const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)
    const [boardSetup, setBoardSetup] = useState<BoardSetup>(initBoardSetup);
    useEffect(() => {
      api.get('/pieces', {
        params: {}
      }).then((response) => {
        const data = response.data;
        const newPieces: Array<Piece> = data['pieces'];
        newPieces.map(x => {
          // @ts-ignore
          x.moves = moveMapToGrid(x.piecemoves); 
          return x
        });
        let mergedPieces = _.uniqBy([...pieces, ...newPieces], (move) => move.pk)
        const new_pk_map = new Map<Number, Piece>(); //Lookup key by move name
        _.forEach(mergedPieces, function (p: Piece, ix: number) {
          new_pk_map.set(p.pk, p);
        });

        setPieces(mergedPieces);
        setPkToPiece(new_pk_map)

        const moves = data['move_map']
        setPkToMove(moves);
      })
    }, [])
    return <div className="grid md:grid-cols-2">
      <div className="col-span-1">
        <PiecesView setSelectedPiece={setSelectedPiece} selectedPiece={selectedPiece} pieces={pieces}></PiecesView>
        <BoardEditor boardSetup={boardSetup} setBoardSetup={setBoardSetup} selectedPiece={selectedPiece}
                    setSelectedPiece={setSelectedPiece} pkToPiece={pkToPiece}/>
      </div>
      <div className="col-span-1">
        {(selectedPiece == null || pkToMove == null) ? <div></div> : <PieceView piece={selectedPiece} pkToMove={pkToMove}></PieceView>}
      </div>
      </div>

}

export default BoardEditorView;
