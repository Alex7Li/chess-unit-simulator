import base64
from io import BytesIO
from PIL import Image
import json
import re
import requests
from random import randint
from typing import Dict, List, Tuple, Literal

from wonderwords import RandomWord

from api.emoji import emoji
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from func_timeout import FunctionTimedOut
from rest_framework import serializers
from core.settings import CODE_CONVERT_HOST, CODE_CONVERT_PORT

import api.game_logic
class BaseModelSerializer(serializers.ModelSerializer):
    def to_representation(self, obj):
        data = super().to_representation(obj)
        # pks must be serialized as strings because the db doesn't start at 1 and rounding error happens 
        # when you cast it to json
        if 'pk' in data:
            data['pk'] = str(data['pk'])
        return data


def to_color_string(color_array):
    return '[' + ','.join(map(str, color_array)) + ']'

def validate_color(color_string):
    valid_color = color_string[0] == '[' and color_string[-1] == ']'
    rgb = color_string[1:-1].split(',')
    valid_color &= len(rgb) == 3
    for i in range(3):
        try:
            valid_color &= 0 <= int(rgb[i]) <= 255
        except ValueError:
            valid_color = False
    if not valid_color:
        raise ValidationError(f'Color is not valid, got "{color_string}" but want something of format "[0,17,255]"')

def validate_simple_name(value):
    if not re.fullmatch("[a-zA-Z0-9_ ]*", value):
        raise ValidationError(
            "Name must contain only english letters, numbers, spaces, and _",
            params={'value': value},
        )

random_word_gen = RandomWord()
def make_random_username(emoji_mode=False):
    """Generate a random username
    """
    # about 910 adjectives
    adjective = random_word_gen.word(include_parts_of_speech=["adjectives"])
    # about 6800 nouns
    noun = random_word_gen.word(include_parts_of_speech=["nouns"])
    if emoji_mode:
        # about 650 emojis (emojis usernames can't be validated lol)
        prefix = emoji[randint(0, len(emoji) - 1)]
        middle = emoji[randint(0, len(emoji) - 1)]
        suffix = emoji[randint(0, len(emoji) - 1)]
        username = f"{prefix}{adjective}{middle}{noun}{suffix}"
    else:
        valid_letters = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789"
        rand_suffix = ''.join([valid_letters[randint(0, len(valid_letters) - 1)] for _ in range(4)])
        username = f"{adjective}_{noun}@{rand_suffix}"
    return username

class Move(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    class Category(models.TextChoices):
        UI = 'UI'
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices, default=Category.CUSTOM)
    # color and boarder_color are RGB 3-tuples stored as a string
    color = models.CharField("rgb color string", max_length=20, validators=[
        validate_color
    ])
    implementation = models.JSONField(blank=True)
    overview = models.CharField(max_length=127)
    description = models.TextField()
    symbol = models.CharField(blank=True, max_length=3)

    def __str__(self):
        return f"Move {self.pk}: {self.overview} by {self.author}"

    class Meta:
        indexes = [models.Index(fields=['author'])]

class MoveSerializer(BaseModelSerializer):
    author = serializers.SlugRelatedField('username', read_only=True)

    def to_representation(self, obj):
        data = super().to_representation(obj)
        data['color'] =  list(map(int, data['color'][1:-1].split(',')))
        return data

    class Meta:
        model = Move
        fields = ['pk', 'cat', 'color', 'implementation', 'overview', 'description', 'symbol', 'author']

class BinarySeralizer(serializers.Field):
    def to_representation(self, value):
        return "data:image/png;base64," + str(value, 'ascii') #remove b' and trailing '

class Piece(models.Model):
    image_white = models.BinaryField(blank=True)
    image_black = models.BinaryField(blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author')
    class Meta:
        indexes = [models.Index(fields=['author', 'cat'])]

    class Category(models.TextChoices):
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices)
    name = models.CharField(max_length=31)

    def __str__(self):
        return f"Piece: {self.name} by {self.author}"

    @staticmethod
    def create_piece(image: str, author: User,
                     name: str, moves: List[Dict[str, int]],
                     cat: Category):
        # image is formated as 'data:image/png;base64,iVBOr== EGk'
        metadata, base64_data = image.split(',')
        content_type = re.search(r'(data:image\/)([a-z]*)(;base64)', metadata).group(2)
        piece = Piece(author=author, name=name, cat=cat)
        bytes_data = BytesIO(base64.b64decode(base64_data))
        def make_image_bytes(bg_file):
            with Image.open(bytes_data) as base_img:
                with Image.open(bg_file) as tile:
                    resize_tile = tile.resize(base_img.size)
                    comp = Image.alpha_composite(resize_tile, base_img)
                    with BytesIO() as output:
                        comp.save(output, format=content_type)
                        return base64.b64encode(output.getvalue())
        byte_data = make_image_bytes('static/tile-white.png')
        piece.image_white = byte_data
        piece.image_black = make_image_bytes('static/tile-black.png')
        pieceMoves = []
        for moveInfo in moves:
            move = Move.objects.get(pk=int(moveInfo['move']))
            pieceMoves.append(PieceMove(
                relative_row=moveInfo['relative_row'],
                relative_col=moveInfo['relative_col'],
                move=move,
                piece=piece,
            ))
        try:
            piece.save()
            for move in pieceMoves:
                move.save()
            piece.full_clean()
            for i in range(len(pieceMoves)):
                pieceMoves[i].full_clean()
        except (ValidationError, IntegrityError) as e:
            try:
                piece.delete()
            except ValueError:
                pass # was not saved
            raise ValidationError(e)
        return piece


class PieceMove(models.Model):
    relative_row = models.SmallIntegerField(validators=[
        MinValueValidator(-7),
        MaxValueValidator(7)
    ])
    relative_col = models.SmallIntegerField(validators=[
        MinValueValidator(-7),
        MaxValueValidator(7)
    ])
    move = models.ForeignKey(Move, on_delete=models.RESTRICT)
    piece = models.ForeignKey(Piece, on_delete=models.CASCADE, related_name='piece_moves')

    class Meta:
        indexes = [models.Index(fields=['piece'])]

class PieceMoveSerializer(BaseModelSerializer):
    def to_representation(self, obj):
        data = super().to_representation(obj)
        data['move'] = str(data['move'])
        return data

    class Meta:
        model = PieceMove
        fields = ['relative_row', 'relative_col', 'move']

class PieceSerializer(BaseModelSerializer):
    piece_moves = PieceMoveSerializer(many=True, read_only=True)
    author = serializers.SlugRelatedField('username', read_only=True)
    image_white = BinarySeralizer()
    image_black = BinarySeralizer()

    class Meta:
        model = Piece
        fields = ['pk', 'image_white', 'image_black', 'author', 'cat', 'name', 'piece_moves']


class BoardSetup(models.Model):
    name = models.CharField(max_length=64, unique=True, validators=[validate_simple_name])
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    class Category(models.TextChoices):
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices)
    class WinCon(models.TextChoices):
        KILL_ANY_ROYAL = 'anyR'
        KILL_ALL_ROYALS = 'allR'
        KILL_ALL = 'all'
    wincon_white = models.CharField(max_length=4, choices=WinCon.choices, default=WinCon.KILL_ALL)
    wincon_black = models.CharField(max_length=4, choices=WinCon.choices, default=WinCon.KILL_ALL)

    def __str__(self):
        return f"Board Setup {self.pk}: {self.name} by {self.author}"
    
    @property
    def info_short(self):
        return {'pk': str(self.pk), 'name': self.name}

    @staticmethod
    def create_board(author: User, name: str, pieces: List[Dict[str, int]],
                     cat: Category, wincon_white: WinCon, wincon_black: WinCon):
        pieceLocations = []
        board = BoardSetup(author=author, name=name, cat=cat,
                           wincon_black=wincon_black,
                           wincon_white=wincon_white)
        white_has_piece = False
        black_has_piece = False
        white_has_royal = False
        black_has_royal = False
        for pieceLocation in pieces:
            piece = Piece.objects.get(pk=int(pieceLocation['piece']))
            if pieceLocation['team'] == 'white':
                team = PieceLocation.Team.WHITE
                white_has_piece = True
                if pieceLocation['is_royal']:
                    white_has_royal = True
            elif pieceLocation['team'] == 'black':
                team = PieceLocation.Team.BLACK
                black_has_piece = True
                if pieceLocation['is_royal']:
                    black_has_royal = True
            else:
                raise ValidationError(f"Invalid team, expected 'white' or 'black' but got {pieceLocation['team']}")
            pieceLocations.append(PieceLocation(
                row=pieceLocation['row'],
                col=pieceLocation['col'],
                board_setup=board,
                piece=piece,
                team=team,
                is_royal=pieceLocation['is_royal']
            ))
        if not black_has_piece or not white_has_piece:
            raise ValidationError("Invalid team, both black and white need to have at least 1 piece!")
        if wincon_white == BoardSetup.WinCon.KILL_ANY_ROYAL or wincon_white == BoardSetup.WinCon.KILL_ALL_ROYALS:
            if not black_has_royal:
                raise ValidationError("Black has no royal pieces")
        if wincon_black == BoardSetup.WinCon.KILL_ANY_ROYAL or wincon_black == BoardSetup.WinCon.KILL_ALL_ROYALS:
            if not white_has_royal:
                raise ValidationError("White has no royal pieces")
        try:
            board.save()
            for pieceLoc in pieceLocations:
                pieceLoc.save()
            board.full_clean()
            for pieceLoc in pieceLocations:
                pieceLoc.full_clean()
        except (ValidationError, IntegrityError) as e:
            try:
                board.delete()
            except ValueError:
                pass # was not saved
            raise ValidationError(e)
        return board

    class Meta:
        indexes = [
           models.Index(fields=['cat', 'author']),
       ]

class PieceLocation(models.Model):
    row = models.SmallIntegerField(validators=[
        MinValueValidator(0),
        MaxValueValidator(7)
    ])
    col = models.SmallIntegerField(validators=[
        MinValueValidator(0),
        MaxValueValidator(7)
    ])
    piece = models.ForeignKey(Piece, on_delete=models.RESTRICT)
    is_royal = models.BooleanField(default=False)

    class Team(models.TextChoices):
        WHITE = 'white'
        BLACK = 'black'

    team = models.CharField(max_length=5, choices=Team.choices)
    board_setup = models.ForeignKey(BoardSetup, on_delete=models.CASCADE, related_name='piece_locations')

    class Meta:
        indexes = [
           models.Index(fields=['board_setup']),
       ]

class PieceLocationSerializer(BaseModelSerializer):

    def to_representation(self, obj):
        data = super().to_representation(obj)
        data['piece'] = str(data['piece'])
        return data
    class Meta:
        model = PieceLocation
        fields = ['row', 'col', 'piece', 'team', 'is_royal']

class BoardSetupSerializer(BaseModelSerializer):
    piece_locations = PieceLocationSerializer(many=True, read_only=True)
    author = serializers.SlugRelatedField('username', read_only=True)
    class Meta:
        model = BoardSetup
        fields = ['pk',  'author', 'cat', 'name', 'piece_locations']

class GameRequest(models.Model):
    requesting_user = models.ForeignKey(User, on_delete=models.CASCADE)
    board_setup = models.ForeignKey(BoardSetup, on_delete=models.CASCADE)

class GameRequestSerializer(BaseModelSerializer):
    requesting_user = serializers.SlugRelatedField('username', read_only=True)
    board_setup = BoardSetupSerializer(read_only=True)
    class Meta:
        model = GameRequest
        fields = ['pk', 'board_setup', 'requesting_user']

#############################################
######### Game helper functions #############
#############################################

class Game(models.Model):
    white_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='white_user')
    black_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='black_user')
    white_to_move = models.BooleanField(default=True)
    setup = models.ForeignKey(BoardSetup, on_delete=models.DO_NOTHING)
    game_state = models.JSONField()

    class Meta:
        indexes = [models.Index(fields=['white_user', 'black_user'])]

    class Result(models.TextChoices):
        WHITE_WIN = 'W'
        WHITE_WIN_RESIGN = 'Y'
        BLACK_WIN = 'B'
        BLACK_WIN_RESIGN = 'C'
        DRAW = 'D'
        DRAW_AGREED = 'E'
        IN_PROGRESS = "P"
    result = models.CharField(max_length=1, choices=Result.choices, default=Result.IN_PROGRESS)
        
    def resign(self, requesting_color: Literal['black', 'white']):
        if requesting_color == "white":
            self.result = self.Result.BLACK_WIN_RESIGN
        elif requesting_color == "black":
            self.result = self.Result.WHITE_WIN_RESIGN
        self.save()
        return True

    def draw(self, requesting_color: Literal['black', 'white']):
        if self.game_state['draw_offer'] == 'none':
            self.game_state['draw_offer'] = requesting_color
        elif self.game_state['draw_offer'] != requesting_color:
            self.result = self.Result.DRAW_AGREED
        self.save()
        return True
        
    @staticmethod
    def create_game(white_user: User, black_user: User, orig_board_setup: BoardSetup):
        initial_piece_locations = PieceLocation.objects.filter(('board_setup', orig_board_setup))
        # Store all of the pieces and their moves in this object.
        # Even if the original data gets modified or deleted during play,
        # we won't need to worry about it.
        board = {}
        for row in range(8):
            for col in range(8):
                board[f"{row},{col}"] = {'piece': None}
        moves = {}
        for pieceId, pieceLoc in enumerate(initial_piece_locations, 0):
            piece = PieceSerializer(pieceLoc.piece).data
            piece['team'] = pieceLoc.team
            board[f"{pieceLoc.row},{pieceLoc.col}"] = {
                'piece': {
                    'team': pieceLoc.team,
                    'name': piece['name'],
                    'piece_id': pieceId,
                    'piece_pk': str(piece['pk']),
                    'piece_moves': piece['piece_moves'],
                    'is_royal': pieceLoc.is_royal
                }
            }
            for move in piece['piece_moves']:
                move_pk = move['move']
                if move_pk not in moves:
                    moves[str(move_pk)] = MoveSerializer(Move.objects.get(('pk', move_pk))).data

        game_state_json = {
            'board': board,
            'moves': moves,
            'wincon_white': orig_board_setup.wincon_white,
            'wincon_black': orig_board_setup.wincon_black,
            'draw_offer': 'none'
        }

        game = Game(white_user=white_user, black_user=black_user,
                    game_state=game_state_json,
                    setup=orig_board_setup)
        game.full_clean()
        game.save()
        return game

    def make_move(self, from_loc: Tuple[int, int], to_loc: Tuple[int, int], user):
        board = {}
        for row in range(8):
            for col in range(8):
                board[api.game_logic.Location(row, col)] = {'piece': None}
        # Convert keys from string to tuple and flip board for black
        for k, v in self.game_state['board'].items():
            row, col = k.split(',')
            if not self.white_to_move:
                row = 7 - int(row)
            board[api.game_logic.Location(int(row), int(col))] = v

        if not self.white_to_move:
            from_loc = 7 - from_loc[0], from_loc[1]
            to_loc = 7 - to_loc[0], to_loc[1]

        # Get the move that we want to execute
        piece = board[from_loc]['piece']
        if piece == None:
            raise ValidationError("Could not find a piece to move")
        if piece['team'] == 'white':
            if not self.white_to_move:
                raise ValidationError(f"It's not currently {piece['team']}'s turn to move")
            if user != self.white_user:
                raise ValidationError(f"You are not playing as white")
        if piece['team'] == 'black':
            if self.white_to_move:
                raise ValidationError(f"It's not currently {piece['team']}'s turn to move")
            if user != self.black_user:
                raise ValidationError(f"You are not playing as black")

        rel_row = to_loc[0] - from_loc[0]
        rel_col = to_loc[1] - from_loc[1]
        move = None
        for piece_move in piece['piece_moves']:
            if piece_move['relative_row'] == rel_row and piece_move['relative_col'] == rel_col:
                move = self.game_state['moves'][str(piece_move['move'])]
                break
        if move == None:
            raise ValidationError("Could not find a move at the specified location")

        # Get the implementation of the move from the XML representation
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        data = json.dumps(move['implementation'])
        response = requests.post(f"http://{CODE_CONVERT_HOST}:{CODE_CONVERT_PORT}", data, headers=headers)
        if response.status_code != 200:
            raise ValidationError(f"Code conversion server has failed with error code {response.status_code}")

        start_pieces = count_surviving_pieces(board)

        # Make the move!
        try:
            result = api.game_logic.make_move(response.text,
                board, api.game_logic.Location(*from_loc), api.game_logic.Location(*to_loc))
        except AttributeError:
            raise ValidationError("This move could not be executed. Try another move instead.")
        except api.game_logic.InvalidMoveError:
            raise ValidationError("You cannot play this move from this position.")
        except FunctionTimedOut:
            raise ValidationError("It took too long to execute this move (>1 sec), there may be an infinite loop. Try another move instead.")
        if not result.did_action:
            raise ValidationError(f"You cannot play this move as it would do nothing.")

        end_pieces = count_surviving_pieces(board)
        self.result = get_game_result(
            start_pieces, end_pieces, self.game_state['wincon_white'], self.game_state['wincon_black'])

        # Convert keys from tuple back to a json-able string and flip board back for black
        new_board = {}
        for k, v in board.items():
            row, col = k
            if not self.white_to_move:
                row = 7 - row
            new_board[f"{row},{col}"] = v

        self.game_state['board'] = new_board
        if (((self.game_state['draw_offer'] == 'black') and self.white_to_move) or
            ((self.game_state['draw_offer'] == 'white') and not self.white_to_move)):
            self.game_state['draw_offer'] = 'none'
        self.white_to_move = not self.white_to_move
        self.save()
        return True

def count_surviving_pieces(board: Dict[api.game_logic.Location, api.game_logic.BoardTile]):
    counts = {
        'white_total': 0,
        'black_total': 0,
        'white_royal': 0,
        'black_royal': 0
    }
    for tile in board.values():
        piece = tile['piece']
        if piece != None:
            if piece['team'] == 'white':
                counts['white_total'] += 1
                if piece['is_royal']:
                    counts['white_royal'] += 1
            if piece['team'] == 'black':
                counts['black_total'] += 1
                if piece['is_royal']:
                    counts['black_royal'] += 1
    return counts

def get_game_result(start_pieces, end_pieces, wincon_white: BoardSetup.WinCon, wincon_black: BoardSetup.WinCon):
    results = []
    for team, other_team, wincon in zip(['white', 'black'], ['black', 'white'], [wincon_white, wincon_black]):
        team_won = False
        if wincon == BoardSetup.WinCon.KILL_ALL and end_pieces[f"{other_team}_total"] == 0:
            team_won = True
        elif wincon == BoardSetup.WinCon.KILL_ALL_ROYALS and end_pieces[f"{other_team}_royal"] == 0:
            team_won = True
        elif wincon == BoardSetup.WinCon.KILL_ANY_ROYAL and end_pieces[f"{other_team}_royal"] < start_pieces[f"{other_team}_royal"]:
            team_won = True
        results.append(team_won)
    if not results[0] and not results[1]:
        return Game.Result.IN_PROGRESS
    elif results[0] and not results[1]:
        return Game.Result.WHITE_WIN
    elif not results[0] and results[1]:
        return Game.Result.BLACK_WIN
    elif not results[0] and results[1]:
        return Game.Result.DRAW

class GameSerializer(BaseModelSerializer):
    white_user = serializers.SlugRelatedField('username', read_only=True)
    black_user = serializers.SlugRelatedField('username', read_only=True)
    setup = serializers.SlugRelatedField("info_short", read_only=True)

    class Meta:
        model = Game
        fields = ['pk',  'white_user', 'black_user', 'white_to_move', 'game_state', 'result', 'setup']
