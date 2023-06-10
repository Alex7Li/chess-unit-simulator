from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from django.utils.decorators import method_decorator
from django.db.utils import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions, status

from api.models import Move, Piece, to_color_string, PieceSerializer, MoveSerializer, \
    BoardSetup, BoardSetupSerializer, GameRequest, GameRequestSerializer, make_random_username, \
    GameSerializer, Game
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

def make_user(username, password, email, guest_account: bool):
    if not guest_account:
        if email == '':
            raise ValidationError("No email given")
        if '@' in username:
            raise ValidationError("@ character is reserved to distinguish guest usernames")
    else:
        if '@' not in username:
            raise ValidationError("@ character must be in guest usernames.")
    # This creates the user in the database, we still need to validate the information
    # though, so we may delete it later
    user = User.objects.create_user(username=username, email=email, password=password)
    try:
        user.full_clean()
        user.save()
        return user
    except (ValidationError, IntegrityError) as e:
        invalid_user = User.objects.get(username=username)
        invalid_user.delete()
        raise ValidationError(str(e))

class Users(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response(data={"username": request.user.username}, status=status.HTTP_200_OK)
        else:
            return Response(data={"username": ""}, status=status.HTTP_200_OK)

    def post(self, request):
        type = request.query_params.get('type')
        if type == "guest_signup":
            tries = 0
            while True:
                username = make_random_username(emoji_mode=False)
                if len(User.objects.filter(username=username)) == 0:
                    break # Found a new username
                tries += 1
                if tries > 10:
                    return ResponseWithMessage("Failed to generate a guest username!", status=status.HTTP_400_BAD_REQUEST)
            try:
                user = make_user(username, "", "", True)
                login(request, user)
                return Response(status=status.HTTP_200_OK)
            except (ValidationError, IntegrityError) as e:
                return ResponseWithMessage(str(e), status=status.HTTP_400_BAD_REQUEST)
        elif type == "signup":
            username = request.query_params.get('username')
            password = request.query_params.get('password')
            email = request.query_params.get('email')
            try:
                user = make_user(username, password, email, False)
                login(request, user)
                return Response(status=status.HTTP_200_OK)
            except (ValidationError, IntegrityError) as e:
                return ResponseWithMessage(str(e), status=status.HTTP_400_BAD_REQUEST)
        elif type == "login":
            username = request.query_params.get('username')
            password = request.query_params.get('password')
            if password == None or username == None:
                return ResponseWithMessage("No username or password given", status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(username=username)
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
        elif type == "logout":
            logout(request)
            return Response(status=status.HTTP_200_OK)
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
        moves = Move.objects.filter(cat=Move.Category.OFFICIAL)
        if request.user.is_authenticated:
            user_moves = Move.objects.filter(author=request.user)
            moves = moves.union(user_moves)
        all_moves = [MoveSerializer(move).data for move in moves]
        return JsonResponse(all_moves, safe=False)

    def post(self, request):
        move_query = json.loads(request.query_params.get('newMove'))
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to save", status=status.HTTP_401_UNAUTHORIZED)
        user = User.objects.get(id=request.user.id)
        try:
            move = Move.objects.get(pk=move_query['pk'])
            if user != move.author:
                return ResponseWithMessage("Cannot modify this move as someone else created it.", status=status.HTTP_401_UNAUTHORIZED)
            move.color = to_color_string(move_query['color'])
            move.overview = move_query['overview']
            move.description = move_query['description']
            move.symbol = move_query['symbol']
            move.implementation = move_query['implementation']
        except Move.DoesNotExist:
            move = Move(color=to_color_string(move_query['color']),
                        overview=move_query['overview'], description=move_query['description'],
                        symbol=move_query['symbol'], implementation=move_query['implementation'],
                        author=user)
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
        pieces = Piece.objects.filter(cat=Move.Category.OFFICIAL)
        if request.user.is_authenticated:
            user_pieces = Piece.objects.filter(author=request.user)
            pieces = pieces.union(user_pieces)
        serialized_pieces = []
        all_move_pks = set()
        for piece in pieces:
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
        pk_list_serialized = request.GET.get('pk_list')
        if pk_list_serialized:
            pk_list = pk_list_serialized.split(',')
            boards = []
            for pk in pk_list:
                boards.append(BoardSetup.objects.get(pk=int(pk)))
        else:
            boards = BoardSetup.objects.filter(cat=BoardSetup.Category.OFFICIAL)
            if request.user.is_authenticated:
                user_boards = BoardSetup.objects.filter(author=request.user)
                boards = boards.union(user_boards)
        serialized_boards = []
        all_piece_pks = set()
        for board in boards:
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
                                            pieces=board['piece_locations'], cat=BoardSetup.Category.CUSTOM,
                                            wincon_white=board['wincon_white'], wincon_black=board['wincon_black'])
            return Response({'new_board_setups': BoardSetupSerializer(boardSetup).data},
                            status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)

class GameRequests(APIView):
    def get(self, request, format=None):
        """
        Return a list of all current game requests
        """
        game_requests = GameRequest.objects.all()
        requests = []
        all_piece_pks = set()
        for request in game_requests:
            request_data = GameRequestSerializer(request).data
            requests.append(request_data)
            for piece_loc in request_data['board_setup']['piece_locations']:
                all_piece_pks.add(piece_loc['piece'])
        piece_pk_map = {
            piece_pk: PieceSerializer(Piece.objects.get(('pk', piece_pk))).data for piece_pk in all_piece_pks
        }
        return JsonResponse({
            'game_requests': requests,
            'pieces': piece_pk_map
        })

    def post(self, request):
        """Does things depending on the parameter 'type'.

        If the type is start_local_game: Request to start a new game against yourself.
        """
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to play. Sorry, implementing features for guests is currently low priority.", status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        type = request.data['type']
        if type == 'request_game':
            board_pk = request.data['board_pk']
            boardSetup = BoardSetup.objects.get(('pk', board_pk))
            request = GameRequest(user=user, board_setup=boardSetup)
            try:
                request.full_clean()
                request.save()
            except ValidationError as e:
                return ResponseWithMessage(e, status=status.HTTP_400_BAD_REQUEST)
            return Response({'new_request': GameRequestSerializer(request).data},
                                status=status.HTTP_201_CREATED)
        elif type == 'accept_game':
            pk = request.data['request_pk']
            accepted_request = GameRequest.objects.get(('pk', pk))
            accepted_request.delete()
            return Response(status=status.HTTP_200_OK)
        else:
            return ResponseWithMessage("unsupported type", status=status.HTTP_501_NOT_IMPLEMENTED)

class Games(APIView):
    def get(self, request, format=None):
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to play. Sorry, implementing features for guests is currently low priority.", status=status.HTTP_401_UNAUTHORIZED)
        white_games = Game.objects.filter(white_user=request.user)
        black_games = Game.objects.filter(black_user=request.user)
        played_games = white_games.union(black_games)
        result = []
        for game in played_games:
            result.append(GameSerializer(game).data)
        return Response(data={"games": result}, status=status.HTTP_200_OK)