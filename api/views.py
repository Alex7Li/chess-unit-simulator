from django.shortcuts import render
from django.http.response import JsonResponse
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions, status
from api.models import Move, Piece, ImageModel, to_color_string, from_color_string
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
        all_moves = []
        move_names = set()
        for move in official_moves:
            all_moves.append(move.make_serializable())
            move_names.add(move.name)
        for move in user_moves:
            if move.name not in move_names:
                all_moves.append(move.make_serializable())
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
            return Response(status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return ResponseWithMessage(e, status=status.HTTP_401_UNAUTHORIZED)

class Pieces(APIView):
    """
    Fairy chess pieces
    """
    def get(self, request, format=None):
        """
        Return a list of all pieces.
        TODO: and the moves that they use
        """
        official_moves = Piece.objects.filter(cat=Move.Category.OFFICIAL)
        user_moves = []
        if request.user.is_authenticated:
            user_moves = Piece.objects.filter(author=request.user)
        all_pieces = []
        move_names = set()
        for move in official_moves:
            all_pieces.append(move.make_serializable())
            move_names.add(move.name)
        for move in user_moves:
            if move.name not in move_names:
                all_pieces.append(move.make_serializable())
        return JsonResponse(all_pieces, safe=False)

    def post(self, request):
        """Create a new piece
        """
        piece = request.data
        if not request.user.is_authenticated:
            return ResponseWithMessage("You must be logged in to save", status=status.HTTP_401_UNAUTHORIZED)
        user = User.objects.get(('id', request.user.id))
        saved_piece = Piece.create_piece(image=piece['image'], author=user, name=piece['name'],
                           moves=piece['moves'], cat=Piece.Category.CUSTOM)
        return Response(status=status.HTTP_201_CREATED)

if __name__ == "__main__":
    ...