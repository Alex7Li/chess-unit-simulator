from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from typing import Dict, Tuple, List
from PIL import Image
from io import BytesIO
from django.core.files import File
from rest_framework import serializers

import base64

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
    implementation = models.TextField(blank=True)
    overview = models.CharField(max_length=127)
    description = models.TextField()
    symbol = models.CharField(blank=True, max_length=3)

    def __str__(self):
        return f"Move: {self.name} by {self.author}"

    class Meta:
        indexes = [models.Index(fields=['name', 'author'])]

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
    image = models.ImageField(upload_to="pieces/")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author')
    class Category(models.TextChoices):
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices, default=Category.CUSTOM)
    name = models.CharField(max_length=31, unique=True)

    def __str__(self):
        return f"Piece: {self.name} by {self.author}"

    @staticmethod
    def create_piece(image: str, author: User,
                     name: str, moves: Dict[int, List[Tuple[int, int]]],
                     cat: Category):
        # image is formated as 'data:image/png;base64,iVBOr==EGk'
        content_type, base64_data = image.split(',')
        content_type = content_type.split(':')[1].split(';')[0]
        img_fpath = f"{name}.png"
        piece = Piece(author=author, name=name, cat=cat)
        image_data = File(BytesIO(base64.b64decode(base64_data)))
        piece.image.save(img_fpath, image_data, True)
        piece.full_clean()
        piece.save()
        pieceMoves = []
        for move_pk, move_locs in moves.items():
            move = Move.objects.get(pk=move_pk)
            for drow, dcol in move_locs:
                pieceMoves.append(PieceMove(
                    relative_row=drow,
                    relative_col=dcol,
                    move=move,
                    piece=piece,
                ))
                pieceMoves[-1].full_clean()
        
        for move in pieceMoves:
            move.save()
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
    piece = models.ForeignKey(Piece, on_delete=models.CASCADE, related_name='piecemoves')

    class Meta:
        indexes = [models.Index(fields=['piece'])]

class PieceMoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PieceMove
        fields = ['relative_row', 'relative_col', 'move']

class PieceSerializer(serializers.ModelSerializer):
    piecemoves = PieceMoveSerializer(many=True, read_only=True)
    author = serializers.SlugRelatedField('username', read_only=True)
    class Meta:
        model = Piece
        fields = ['image', 'author', 'cat', 'name', 'piecemoves']

class BoardSetup(models.Model):
    name = models.CharField(max_length=31, unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Board Setup: {self.name} by {self.author}"


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
    board = models.ForeignKey(BoardSetup, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        indexes = [models.Index(fields=['board'])]
