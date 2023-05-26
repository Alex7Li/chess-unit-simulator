import base64
from io import BytesIO
from PIL import Image
import json
import re
import requests
from typing import Dict, List, Tuple

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.core.files import File
from django.db.utils import IntegrityError
from rest_framework import serializers

import api.move

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
    if re.fullmatch("[a-zA-Z0-9_ ]", value):
        raise ValidationError(
            "Name must contain only english letters, numbers, spaces, and _",
            params={'value': value},
        )

class Move(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField("Move name", max_length=63, unique=True)
    class Category(models.TextChoices):
        UI = 'UI'
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices)
    # color and boarder_color are RGB 3-tuples stored as a string
    color = models.CharField("rgb color string", max_length=20, validators=[
        validate_color
    ])
    implementation = models.JSONField(blank=True)
    overview = models.CharField(max_length=127)
    description = models.TextField()
    symbol = models.CharField(blank=True, max_length=3)

    def __str__(self):
        return f"Move: {self.name} by {self.author}"

    class Meta:
        indexes = [models.Index(fields=['author'])]

class MoveSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField('username', read_only=True)

    def to_representation(self, obj):
        data = super().to_representation(obj)
        data['color'] =  list(map(int, data['color'][1:-1].split(',')))
        return data

    class Meta:
        model = Move
        fields = ['pk', 'cat', 'color', 'implementation', 'name', 'overview', 'description', 'symbol', 'author']

class Piece(models.Model):
    image_white = models.ImageField(upload_to="pieces/")
    image_black = models.ImageField(upload_to="pieces/")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author')
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
        # image is formated as 'data:image/png;base64,iVBOr==EGk'
        metadata, base64_data = image.split(',')
        content_type = re.search(r'(data:image\/)([a-z]*)(;base64)', metadata).group(2)
        img_white_fpath = f"{name}_white.{content_type}"
        img_black_fpath = f"{name}_black.{content_type}"
        piece = Piece(author=author, name=name, cat=cat)
        bytes_data = BytesIO(base64.b64decode(base64_data))
        with Image.open(bytes_data) as base_img:
            with Image.open('media/tile_white.png') as tile:
                resize_tile = tile.resize(base_img.size)
                comp = Image.alpha_composite(resize_tile, base_img)
                with BytesIO() as output:
                    comp.save(output, format=content_type)
                    image_white = File(output)
                    piece.image_white.save(img_white_fpath, image_white, True)
        with Image.open('media/tile_black.png') as tile:
                resize_tile = tile.resize(base_img.size)
                comp = Image.alpha_composite(resize_tile, base_img)
                with BytesIO() as output:
                    comp.save(output, format=content_type)
                    image_black = File(output)
                    piece.image_black.save(img_black_fpath, image_black, True)
        pieceMoves = []
        for moveInfo in moves:
            move = Move.objects.get(pk=moveInfo['move'])
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

class PieceMoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PieceMove
        fields = ['relative_row', 'relative_col', 'move']

class PieceSerializer(serializers.ModelSerializer):
    piece_moves = PieceMoveSerializer(many=True, read_only=True)
    author = serializers.SlugRelatedField('username', read_only=True)
    image_white = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)
    image_black = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Piece
        fields = ['pk', 'image_white', 'image_black', 'author', 'cat', 'name', 'piece_moves']


class BoardSetup(models.Model):
    name = models.CharField(max_length=64, unique=True, validators=[validate_simple_name])
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    class Category(models.TextChoices):
        OFFICIAL = 'official'
        CUSTOM = 'custom'
        GAME_IN_PROGRESS = 'game'
    cat = models.CharField(max_length=10, choices=Category.choices)

    def __str__(self):
        return f"Board Setup: {self.name} by {self.author}"
    
    @staticmethod
    def create_board(author: User, name: str, pieces: List[Dict[str, int]], cat: Category):
        pieceLocations = []
        board = BoardSetup(author=author, name=name, cat=cat)
        for pieceLocation in pieces:
            piece = Piece.objects.get(pk=pieceLocation['piece'])
            if pieceLocation['team'] == 'white':
                team = PieceLocation.Team.WHITE
            elif pieceLocation['team'] == 'black':
                team = PieceLocation.Team.BLACK
            else:
                raise ValidationError(f"Invalid team, expected 'white' or 'black' but got {pieceLocation['team']}")
            pieceLocations.append(PieceLocation(
                row=pieceLocation['row'],
                col=pieceLocation['col'],
                board_setup=board,
                piece=piece,
                team=team
            ))
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
    class Team(models.TextChoices):
        WHITE = 'white'
        BLACK = 'black'
    team = models.CharField(max_length=5, choices=Team.choices)
    board_setup = models.ForeignKey(BoardSetup, on_delete=models.CASCADE, related_name='piece_locations')

    class Meta:
        indexes = [
           models.Index(fields=['board_setup']),
       ]

class PieceLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PieceLocation
        fields = ['row', 'col', 'piece', 'team']

class BoardSetupSerializer(serializers.ModelSerializer):
    piece_locations = PieceLocationSerializer(many=True, read_only=True)
    author = serializers.SlugRelatedField('username', read_only=True)

    class Meta:
        model = BoardSetup
        fields = ['pk',  'author', 'cat', 'name', 'piece_locations']

class GameRequest(models.Model):
    requesting_user = models.ForeignKey(User, on_delete=models.CASCADE)
    board_setup = models.ForeignKey(BoardSetup, on_delete=models.CASCADE)

class GameRequestSerializer(serializers.ModelSerializer):
    requesting_user = serializers.SlugRelatedField('username', read_only=True)
    board_setup = BoardSetupSerializer(read_only=True)
    class Meta:
        model = GameRequest
        fields = ['pk', 'board_setup', 'requesting_user']

class Game(models.Model):
    white_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='white_user')
    black_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='black_user')
    white_to_move = models.BooleanField(default=True)
    game_state = models.JSONField()

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
                    'piece_moves': piece['piece_moves']
                }
            }
            for move in piece['piece_moves']:
                move_pk = move['move']
                if move_pk not in moves:
                    moves[move_pk] = MoveSerializer(Move.objects.get(('pk', move_pk))).data

        game_state_json = {
            'board': board,
            'moves': moves
        }

        game = Game(white_user=white_user, black_user=black_user, game_state=game_state_json)
        game.full_clean()
        game.save()
        return game

    def make_move(self, from_loc: Tuple[int, int], to_loc: Tuple[int, int]):
        board = {}
        for row in range(8):
            for col in range(8):
                board[(row, col)] = {'piece': None}

        # Convert keys from string to tuple and flip board for black
        for k, v in self.game_state['board'].items():
            row, col = k.split(',')
            if not self.white_to_move:
                row = 7 - int(row)
            board[(int(row), int(col))] = v
        if not self.white_to_move:
            from_loc = 7 - from_loc[0], from_loc[1]
            to_loc = 7 - to_loc[0], to_loc[1]

        # Get the move that we want to execute
        piece = board[from_loc]['piece']
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
        response = requests.post("http://127.0.0.1:3333", data, headers=headers)
        if response.status_code != 200:
            raise ValidationError(f"Code conversion server has failed with error code {response.status_code}")

        # Make the move!
        if not api.move.make_move(response.text, board, from_loc, to_loc):
            return False # This move is not a valid one

        # Convert keys from tuple back to a json-able string and flip board back for black
        new_board = {}
        for k, v in board.items():
            row, col = k
            if not self.white_to_move:
                row = 7 - row
            new_board[f"{row},{col}"] = v

        self.game_state['board'] = new_board
        self.white_to_move = not self.white_to_move
        self.save()
        return True

# class GameSerializer(serializers.ModelSerializer):
#     white_user = serializers.SlugRelatedField('username', read_only=True)
#     black_user = serializers.SlugRelatedField('username', read_only=True)

#     class Meta:
#         model = BoardSetup
#         fields = ['pk',  'white_to_move' 'white_user', 'black_user', 'game_state']
