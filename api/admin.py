from django.contrib import admin
from .models import Move, Piece, BoardSetup, PieceMove, PieceLocation, GameRequest, Game

admin.site.register(BoardSetup)
admin.site.register(Move)
admin.site.register(Piece)
# admin.site.register(PieceLocation)
# admin.site.register(PieceMove)
admin.site.register(GameRequest)
admin.site.register(Game)
