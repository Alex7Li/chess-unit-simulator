from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from json import JSONEncoder
from typing import Dict, Tuple
from django.core.files import File
from pathlib import Path
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

import base64

def to_color_string(color_array):
    return '[' + ','.join(map(str, color_array)) + ']'

def from_color_string(color_array):
    return list(map(int, color_array[1:-1].split(',')))

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
    def make_serializable(self):
        return {
            'author': self.author.username,
            'uid': self.pk,
            'cat': self.cat,
            'color': from_color_string(self.color),
            'implementation': self.implementation,
            'name': self.name,
            'overview': self.overview,
            'description': self.description,
            'symbol': self.symbol,
        }
        
    class Meta:
        indexes = [models.Index(fields=['name', 'author'])]


class ImageModel(models.Model):
    image = models.ImageField(upload_to="pieces/")


class Piece(models.Model):
    image = models.ForeignKey(ImageModel, on_delete=models.RESTRICT)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    class Category(models.TextChoices):
        OFFICIAL = 'official'
        CUSTOM = 'custom'
    cat = models.CharField(max_length=10, choices=Category.choices, default=Category.CUSTOM)
    name = models.CharField(max_length=31, unique=True)
    def make_serializable(self):
        return {
            'author': self.author.username,
            'uid': self.pk,
            'cat': self.cat,
            'name': self.name,
        }

    def __str__(self):
        return f"Piece: {self.name} by {self.author}"

    @staticmethod
    def create_piece(image: str, author: User,
                     name: str, moves: Dict[Tuple[int, int], Move],
                     cat: Category):
        # image is formated as 'data:image/png;base64,iVBOr==EGk'
        content_type, base64_data = image.split(',')
        content_type = content_type.split(':')[1].split(';')[0]
        pil_im = Image.open(BytesIO(base64.b64decode(base64_data)))
        img_fpath = f"media/pieces/{name}.png"
        pil_im.save(img_fpath)
        with open(img_fpath, 'r') as f:
            image_db = ImageModel(image=f)
        image_db.full_clean()
        piece = Piece(author=author, name=name, cat=cat, image=image_db)
        piece.full_clean()
        pieceMoves = []
        for (drow, dcol), move in moves.items():
            pieceMoves.append(PieceMove(
                relative_row=drow,
                relative_col=dcol,
                move=move,
                piece=piece,
            ))
            pieceMoves[-1].full_clean()
        
        image_db.save()
        piece.save()
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
    piece = models.ForeignKey(Piece, on_delete=models.CASCADE)

    class Meta:
        indexes = [models.Index(fields=['piece'])]


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
