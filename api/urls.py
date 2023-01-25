from django.urls import path
from .views import Pieces, Moves, Users, documentation

urlpatterns = [
    path('users', Users.as_view()),
    path('pieces', Pieces.as_view()),
    path('moves', Moves.as_view()),
    path('', documentation),
]
