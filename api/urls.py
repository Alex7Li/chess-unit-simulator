from django.urls import path
from .views import Pieces, Moves, Users, documentation, BoardSetups, GameRequests, Games

urlpatterns = [
    path('users', Users.as_view()),
    path('boardSetups', BoardSetups.as_view()),
    path('pieces', Pieces.as_view()),
    path('moves', Moves.as_view()),
    path('gameRequests', GameRequests.as_view()),
    path('games', Games.as_view()),
    path('', documentation),
]