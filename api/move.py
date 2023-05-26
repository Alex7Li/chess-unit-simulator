from typing import Tuple, Dict, Any

# Define examples for the compiler. The globals in this file will not be changed.
# The variables that will change are the ones in the __globals dict
# used in the exec call.
class MoveContext:
    def __init__(self, init_board, from_loc: Tuple[int, int], to_loc: Tuple[int, int]):
        """
        Initalize this move context with the given board state.
        
        init_board: Starting board. Example board:
        {
            (0, 0): {'piece': {'piece_id': 0, # unique id of each piece, (normal chess would have values in [0, 31])
                       'name': 'king', # name of each piece, mostly useless
                       'team': 'white', # or 'black'
                       'tile': (0, 0) # location of this piece
                       }
                     },
            (0, 1): {'piece': None}
        }
        """
        self.board = init_board
        # A flag, if it is true when the move ends, then the move cannot be performed
        # and it will not display as an option to the user.
        self.valid_move = True
        self.from_loc = from_loc
        self.targeted_tile = to_loc
        self.acting_piece = self.board[from_loc]['piece']

    def tile_of(self, piece):
        for k, v in self.board.items():
            if v['piece'] is not None and piece['piece_id'] == v['piece']['piece_id']:
                return k
        self.valid_move = False
        return None

    def out_of_bounds(self, loc: Tuple[int, int]):
        return not (0 <= loc[0] <= 7 and 0 <= loc[1] <= 7)


    def move_to(self, moving_piece, target_tile):
        if (moving_piece is None or self.out_of_bounds(target_tile) or
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

def make_move(code: str, board: Dict[Tuple[int, int], Any], from_loc: Tuple[int, int], to_loc: Tuple[int, int]):
    """Make a move with a piece at from_loc going towards to_loc.

    We assume that all moves are made with valid from and to locations,
    and that the board is always oriented upwards

    Args:
        code (_type_): python code for this move
        board (): Current state of the game
        from_loc (Tuple[int, int]): Starting position
        to_loc (Tuple[int, int]): Target position
    """
    move_context = MoveContext(board, from_loc, to_loc)
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

