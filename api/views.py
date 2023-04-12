from django.shortcuts import render
from django.http.response import JsonResponse
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions, status
from api.models import Move, Piece, to_color_string, PieceSerializer, MoveSerializer, BoardSetup, BoardSetupSerializer, Game
import random
import string
import json
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
# Create your views here.
from django.http import HttpResponse
from django.core.exceptions import ValidationError

def documentation(request):
    return HttpResponse("Yo! Welcome to the API.")

# https://www.django-rest-framework.org/api-guide/views/
def ResponseWithMessage(message, status):
    return Response(data={"message": str(message)}, status=status)

class Users(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response(data={"username": request.user.username}, status=status.HTTP_200_OK)
        else:
            return Response(data={"username": ""}, status=status.HTTP_200_OK)

    def delete(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)

    def post(self, request):
        type = request.query_params.get('type')
        if type == "signup":
            username = request.query_params.get('username')
            password = request.query_params.get('password')
            email = request.query_params.get('email')
            user = User(username=username, email=email, password=password)
            try:
                if email == '':
                    raise ValidationError("No email given")
                user.full_clean()
                User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                )
                return Response(status=status.HTTP_200_OK)
            except ValidationError as e:
                return ResponseWithMessage(str(e), status=status.HTTP_400_BAD_REQUEST)
        elif type == "login":
            username = request.query_params.get('username')
            password = request.query_params.get('password')
            if password == None or username == None:
                return ResponseWithMessage("No username or password given", status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(('username', username))
            except User.DoesNotExist:
                return ResponseWithMessage("Username not found", status=status.HTTP_401_UNAUTHORIZED)
            correct_password = user.check_password(password)
            if not correct_password:
                return ResponseWithMessage("Incorrect password", status=status.HTTP_401_UNAUTHORIZED)
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return Response(status=status.HTTP_200_OK)
            else:
                # should never happen
                return ResponseWithMessage("Invalid credentials", status=status.HTTP_401_UNAUTHORIZED)
        return ResponseWithMessage("Invalid post request type", status=status.HTTP_400_BAD_REQUEST)

class Moves(APIView):
    """
    User developed chess moves
    """
    def get(self, request, format=None):
        """
        Return a list of all the default moves, plus
        any moves this user has made
        """
        official_moves = Move.objects.filter(cat=Move.Category.OFFICIAL)
        user_moves = []
        if request.user.is_authenticated:
            user_moves = Move.objects.filter(author=request.user)
        all_moves = [MoveSerializer(move).data for move in official_moves.union(user_moves)]
        return JsonResponse(all_moves, safe=False)

    def post(self, request):
        move_query = json.loads(request.query_params.get('newMove'))
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to save", status=status.HTTP_401_UNAUTHORIZED)
        user = User.objects.get(('id', request.user.id))
        move = Move(author=user, name=move_query['name'], cat=Move.Category.CUSTOM,
             color=to_color_string(move_query['color']), implementation=move_query['implementation'],
             overview=move_query['overview'],
             description=move_query['description'], symbol=move_query['symbol'])
        try:
            move.full_clean()
            move.save()
            return Response({'new_move': MoveSerializer(move).data}, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)

class Pieces(APIView):
    """
    Fairy chess pieces
    """
    def get(self, request, format=None):
        """
        Return a list of all pieces, and the moves that they use.
        """
        official_pieces = Piece.objects.filter(cat=Move.Category.OFFICIAL)
        user_pieces = []
        if request.user.is_authenticated:
            user_pieces = Piece.objects.filter(author=request.user)
        all_pieces = official_pieces.union(user_pieces)
        serialized_pieces = []
        all_move_pks = set()
        for piece in all_pieces:
            piece_data = PieceSerializer(piece).data
            serialized_pieces.append(piece_data)
            for move_pk in piece_data['piece_moves']:
                all_move_pks.add(move_pk['move'])
        move_pk_map = {
            move_pk: MoveSerializer(Move.objects.get(('pk', move_pk))).data for move_pk in all_move_pks
        }
        return JsonResponse({
            'pieces': serialized_pieces,
            'move_map': move_pk_map
        })

    def post(self, request):
        """Create a new piece
        """
        piece = request.data['params']
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to save", status=status.HTTP_401_UNAUTHORIZED)
        moves_dict = piece['moves']
        try:
            piece = Piece.create_piece(image=piece['image'], author=request.user, name=piece['name'],
                       moves=moves_dict, cat=Piece.Category.CUSTOM)
            return Response({'new_piece': PieceSerializer(piece).data}, status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)
        
class BoardSetups(APIView):
    """
    Initial board setups
    """
    def get(self, request, format=None):
        """
        Return a list of all boards.
        """
        official_boards = BoardSetup.objects.filter(cat=BoardSetup.Category.OFFICIAL)
        user_boards = []
        if request.user.is_authenticated:
            user_boards = BoardSetup.objects.filter(author=request.user)
        all_boards = official_boards.union(user_boards)
        serialized_boards = []
        all_piece_pks = set()
        for board in all_boards:
            board_data = BoardSetupSerializer(board).data
            serialized_boards.append(board_data)
            for piece_loc in board_data['piece_locations']:
                all_piece_pks.add(piece_loc['piece'])
        piece_pk_map = {
            piece_pk: PieceSerializer(Piece.objects.get(('pk', piece_pk))).data for piece_pk in all_piece_pks
        }
        return JsonResponse({
            'boards': serialized_boards,
            'pieces': piece_pk_map
        })

    def post(self, request):
        """Create a new board setup
        """
        board = request.data['params']
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to save", status=status.HTTP_401_UNAUTHORIZED)
        try:
            boardSetup = BoardSetup.create_board(author=request.user, name=board['name'],
                                            pieces=board['piece_locations'], cat=BoardSetup.Category.CUSTOM)
            return Response({'new_board_setups': BoardSetupSerializer(boardSetup).data},
                            status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)

class Games(APIView):
    def post(self, request):
        """Does things depending on the parameter 'type'.

        If the type is start_local_game: Request to start a new game against yourself.
        """
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to play. Sorry, implementing features for guests is currently low priority.", status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        type = request.query_params.get('type')
        if type == "start_local_game":
            # Start a game against yourself
            initial_piece_locations = request.query_params.get('piece_locations')
            try:
                boardSetup = BoardSetup.create_board(author=user, name=random_name,
                                                pieces=initial_piece_locations, cat=BoardSetup.Category.GAME_IN_PROGRESS)
                # game = 
                return Response({'new_game': BoardSetupSerializer(boardSetup).data},
                                status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)
        elif type == "make_move":
            game = Game.objects.get('pk', request.query_params.get('game_pk'))
            if game == None:
                return ResponseWithMessage("Game does not exist", status=status.HTTP_404_NOT_FOUND)
            from_piece_row = request.query_params.get('from_row')
            from_piece_col = request.query_params.get('from_col')
            to_piece_row = request.query_params.get('to_row')
            to_piece_col = request.query_params.get('to_col')
            game.make_move((from_piece_row, from_piece_col), (to_piece_row, to_piece_col))
        else:
            return ResponseWithMessage("Only local matches are supported right now", status=status.HTTP_501_NOT_IMPLEMENTED)
