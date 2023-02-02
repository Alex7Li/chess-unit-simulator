from django.contrib import admin

# Register your models here.
from .models import Move, Piece, BoardSetup

admin.site.register(Move)
admin.site.register(Piece)
admin.site.register(BoardSetup)