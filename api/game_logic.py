import math
from typing import Tuple, Dict, Any, NamedTuple, Optional, TypedDict

class Location(NamedTuple):
    row: int
    col: int
class Piece(TypedDict):
    piece_id: int
    name: str
    team: str
    tile: Location
    is_royal: bool
class BoardTile(TypedDict):
    piece: Optional[Piece]

# Define examples for the compiler. The globals in this file will not be changed.
# The variables that will change are the ones in the __globals dict
# used in the exec call.
class MoveContext:
    def __init__(self, init_board: Dict[Location, BoardTile], from_loc: Location, to_loc: Location):
        """
        Initalize this move context with the given board state and intended action.
        """
        self.board = init_board
        # A flag, if it is true when the move ends, then the move cannot be performed
        # and it will not display as an option to the user.
        self.valid_move = True
        self.from_loc = from_loc
        self.targeted_tile = to_loc
        self.acting_piece = self.board[from_loc]['piece']

    def tile_of(self, piece: Optional[Piece]):
        if piece is None:
            return None
        for k, v in self.board.items():
            if v['piece'] is not None and piece['piece_id'] == v['piece']['piece_id']:
                return k
        self.valid_move = False
        return None

    def out_of_bounds(self, loc: Location):
        return not (0 <= loc.row <= 7 and 0 <= loc.col <= 7)

    def tele_to(self, moving_piece: Optional[Piece], target_tile: Optional[Location]):
        """Move this piece to target empty tile"""
        if (target_tile is None or moving_piece is None or self.out_of_bounds(target_tile) or
            self.board[target_tile]['piece'] is not None):
            self.valid_move = False
        else:
            orig_tile = self.tile_of(moving_piece)
            if orig_tile is None:
                self.valid_move = False
            else:
                # Move this piece to the target empty square via swap
                self.board[target_tile]['piece'], self.board[orig_tile]['piece'] = \
                    self.board[orig_tile]['piece'], self.board[target_tile]['piece']

    def take(self, target_piece: Optional[Piece]):
        """Remove the piece at the target location."""
        if target_piece is None:
            self.valid_move = False
        else:
            # Remove the target piece
            self.board[target_piece['tile']]['piece'] = None
    
    def path(self, start_tile: Optional[Location], target_tile: Optional[Location]):
        """Get the path from one location to the other.
        The path consists of every tile who's center is on the center of the line
        drawn from the center of the start tile to the center of the target tile.
        (Like a knightrider.)
        For example, to move from a1 to d7, the path would be
        [a1, b3, c5, d7]
        """
        if start_tile is None or target_tile is None:
            return None
        drow = start_tile.row - target_tile.row
        dcol = start_tile.col - target_tile.col
        gcd = math.gcd(start_tile.row - target_tile.row, start_tile.col - target_tile.col)
        cur_tile = start_tile
        path = [cur_tile]
        while cur_tile != target_tile:
            cur_tile = Location(cur_tile.row + drow // gcd, cur_tile.col + dcol // gcd)
            path.append(cur_tile)
        return path

def make_move(code: str, board: Dict[Location, BoardTile], from_loc: Location, to_loc: Location):
    """Make a move with a piece at from_loc going towards to_loc.

    We assume that all moves are made with valid from and to locations,
    and that the board is always oriented upwards

    Args:
        code (_type_): python code for this move
        board (): Current state of the game
        from_loc (Tuple[int, int]): Starting position
        to_loc (Tuple[int, int]): Target position
    """
    move_context = MoveContext(board, Location(*from_loc), Location(*to_loc))
    # dict with the tiles of each piece
    __globals = {'__builtins__' : {},
                 'board': board,
                 'context': move_context
                 }
    __locals = {}
    exec(code, __globals, __locals)
    # This function has just been defined by exec!
    __locals['action']()
    return move_context.valid_move
