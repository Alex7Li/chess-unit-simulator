import math
from typing import Tuple, Dict, Any, NamedTuple, Optional, TypedDict, List, Union
from func_timeout import func_timeout


class Location(NamedTuple):
    row: int
    col: int
class PieceInstance(TypedDict):
    piece_id: int
    name: str
    team: str
    is_royal: bool
class BoardTile(TypedDict):
    piece: Optional[PieceInstance]
class TileList(TypedDict):
    tiles: List[PieceInstance]

class InvalidMoveError(Exception):
    def __init__(self, msg):
        self.msg = msg

    def __repr__(self):
        return self.msg


# Define examples for the compiler. The globals in this file will not be changed.
# The variables that will change are the ones in the __globals dict
# used in the exec call.
class MoveContext:
    def __init__(self, init_board: Dict[Location, BoardTile], from_loc: Location, to_loc: Location):
        """
        Initalize this move context with the given board state and intended action.
        """
        self.board = init_board
        self.from_loc = from_loc
        self.targeted_tile: Location = to_loc
        piece = self.board[from_loc]['piece']
        if piece == None:
            raise AssertionError("From location does not have a piece on it")
        self.acting_piece: PieceInstance = piece
        # If no action occurs, then this move is not considered valid.
        self.did_action = False

    def tile_of(self, piece: PieceInstance) -> Location:
        assert piece is not None
        for k, v in self.board.items():
            if v['piece'] is not None and piece['piece_id'] == v['piece']['piece_id']:
                return k
        # If this piece has already been taken or something
        raise InvalidMoveError(f"Trying to get the tile of a piece that is no longer on the board.")

    def out_of_bounds(self, loc: Location) -> bool:
        return not (0 <= loc.row <= 7 and 0 <= loc.col <= 7)

    def path(self, start_tile: Location, target_tile: Location,
             begin_exclusive: Union[bool, int] , end_exclusive: Union[bool, int]):
        """Get the path from one location to the other.
        The path consists of every tile who's center is on the center of the line
        drawn from the center of the start tile to the center of the target tile.
        (Like how the knightrider's path is defined.)
        For example, to move from a1 to d7 with both endpoints inclusive, the path would be
        [a1, b3, c5, d7]
        
        if begin_exclusive is false (or 0), then start_tile is on the path.
            if it is 1 (or higher), then start_tile is not on the path (or next few tiles)
            if it is -1 (or lower), then we also get tiles that would be before the start
        if end_exclusive is false (or 0), then target_tile is on the path.
            if it is 1 (or higher), then target_tile is not on the path (nor are the previous few tiles)
            if it is -1 (or lower), then we also get tiles that would be after the start
        """
        assert start_tile is not None and target_tile is not None
        if not (isinstance(start_tile.row, int) and isinstance(start_tile.col, int)
            and isinstance(target_tile.row, int) and isinstance(target_tile.col, int)):
            raise InvalidMoveError(f"Attempting to make a path with non-integer start or end locations.")
        begin_exclusive = int(begin_exclusive)
        end_exclusive = int(end_exclusive)
        if start_tile == target_tile:
            if begin_exclusive and end_exclusive:
                return []
            else:
                return [start_tile]
        gcd = math.gcd(start_tile.row - target_tile.row, start_tile.col - target_tile.col)
        drow = (target_tile.row - start_tile.row) // gcd
        dcol = (target_tile.col - start_tile.col) // gcd
        if drow != 0:
            path_length = abs((start_tile.row - target_tile.row) // drow) + 1
        else:
            path_length = abs((start_tile.col - target_tile.col) // dcol) + 1
        begin_exclusive = min(max(begin_exclusive, -8), path_length)
        end_exclusive = min(max(end_exclusive, -8), path_length - max(0, begin_exclusive + 1))
        
        cur_tile = Location(start_tile.row + drow * begin_exclusive,
                    start_tile.col + dcol * begin_exclusive)
        end_tile = Location(target_tile.row - drow * end_exclusive,
                    target_tile.col - dcol * end_exclusive)
        path = [cur_tile]
        while cur_tile != end_tile:
            cur_tile = Location(cur_tile.row + drow, cur_tile.col + dcol)
            path.append(cur_tile)
        return path

    #############################################################################
    #  ACTIONS
    #############################################################################
    def tele_to(self, moving_piece: PieceInstance, target_tile: Location) -> None:
        """Move this piece to target empty tile"""
        assert moving_piece is not None and target_tile is not None
        if self.out_of_bounds(target_tile):
            raise InvalidMoveError(f"Attempting a movement to an out-of-bounds tile.")
        if self.board[target_tile]['piece'] is not None:
            raise InvalidMoveError(f"Attempting a movement to a tile which already has a piece on it.")
        else:
            orig_tile = self.tile_of(moving_piece)
            # Move this piece to the target empty square via swap
            self.board[target_tile]['piece'], self.board[orig_tile]['piece'] = \
                self.board[orig_tile]['piece'], self.board[target_tile]['piece']
            self.did_action = True

    def take(self, target_piece: PieceInstance) -> None:
        """Remove the piece at the target location."""
        if target_piece is None:
            raise InvalidMoveError(f"Attempting to take a piece that does not exist.")
        else:
            try:
                # Remove the target piece
                tile = self.tile_of(target_piece)
                self.board[tile]['piece'] = None
                self.did_action = True
            except InvalidMoveError:
                # This piece is already dead, just don't take it.
                pass

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
                 'ctx': move_context
                 }
    __locals = {}
    exec(code, __globals, __locals)
    # Run the function we just defined with exec!
    max_runtime_seconds = 1
    func_timeout(max_runtime_seconds, __locals['action'])
    return move_context
