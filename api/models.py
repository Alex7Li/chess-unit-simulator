from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MaxValueValidator, MinValueValidator


class User(models.Model):
    name = models.CharField(max_length=31, unique=True)
    # passwords are for losers


class Move(models.Model):
    name = models.CharField("Move name", max_length=63, unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Category(models.TextChoices):
        UI = 'U', _('UI')
        OFFICIAL = 'O', _('Official')
        CUSTOM = 'C', _('Custom')
    cat = models.CharField(max_length=10, choices=Category.choices)
    # color and boarder_color are RGB 3-tuples stored as a string
    color = models.CharField("rgb color string", max_length=20)
    border_color = models.CharField("rgb boarder color string",
                                    max_length=20, blank=True)
    implementation = models.TextField(blank=True)
    overview = models.CharField(max_length=127)
    description = models.TextField()
    symbol = models.CharField(blank=True, max_length=3)

    def __str__(self):
        return f"Move: {self.name} by {self.author}"

    class Meta:
        indexes = [models.Index(fields=['name', 'author'])]


class Image(models.Model):
    image = models.ImageField(upload_to="images/")


class Piece(models.Model):
    image = models.ForeignKey(Image, on_delete=models.RESTRICT)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=31, unique=True)

    def __str__(self):
        return f"Piece: {self.name} by {self.author}"


class PieceMove(models.Model):
    relative_row = models.SmallIntegerField(validators=[
        # MinValueValidator(-7),
        # MaxValueValidator(7)
    ])
    relative_col = models.SmallIntegerField(validators=[
        # MinValueValidator(-7),
        # MaxValueValidator(7)
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
    row = models.SmallIntegerField(
        # MinValueValidator(0),
        # MaxValueValidator(7)
    )
    col = models.SmallIntegerField(
        # MinValueValidator(0),
        # MaxValueValidator(7)
    )
    piece = models.ForeignKey(Piece, on_delete=models.RESTRICT)
    board = models.ForeignKey(BoardSetup, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        indexes = [models.Index(fields=['board'])]
