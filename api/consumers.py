import json
import random
import requests

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.exceptions import ValidationError

from api.models import GameRequest, BoardSetup, GameRequestSerializer, PieceSerializer, PieceLocation, Game, GameSerializer, BoardSetupSerializer


# Related file: frontend/src/components/Lobby.tsc
class LobbyConsumer(WebsocketConsumer):
    def connect(self):
        self.group_name = 'lobby'
        async_to_sync(self.channel_layer.group_add)(
            self.group_name, self.channel_name
        )
        if str(self.scope['user']) == "AnonymousUser":
            return
        self.accept()

    def disconnect(self, close_code):
        current_user = self.scope["user"]
        if str(current_user) == "AnonymousUser":
            self.send(text_data=json.dumps({
                "message": "Not logged in, could not send request.",
                "event_type": "fail"
            }))
            return

        # Remove all pending requests
        open_requests = GameRequest.objects.filter(requesting_user=current_user)
        deleted_ids = []
        for request in open_requests:
            request.delete()
            deleted_ids.append(request.pk)

        # Let the world know about the deletions
        async_to_sync(self.channel_layer.group_send)(
            self.group_name, {
                "type": "send_to_socket",
                "event_type": "delete_game",
                "deleted_ids": deleted_ids,
                "accepted_by": ""}
        )

        # Leave the group
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        data_json = json.loads(text_data)
        type = data_json['event_type']
        requesting_user = self.scope["user"]
        if str(requesting_user) == "AnonymousUser":
            self.send(text_data=json.dumps({
                "message": "Not logged in, could not send request.",
                "event_type": "fail"
            }))
            return
        if type == 'request_game':
            board_pk = data_json["board_pk"]
            board_setup = BoardSetup.objects.get(('pk', board_pk))
            try:
                request = GameRequest(requesting_user=requesting_user, board_setup=board_setup)
                request.full_clean()
                request.save()
                board_piece_locs = PieceLocation.objects.filter(board_setup=request.board_setup)
                piece_set = set()
                for board_piece_loc in board_piece_locs:
                    piece_set.add(board_piece_loc.piece)
                piece_pk_map = {
                    # int is not allowed for map keys in json data sometimes
                    str(piece.pk): PieceSerializer(piece).data for piece in piece_set
                    }
                gameRequest = GameRequestSerializer(request).data
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name, {
                        "type": "send_to_socket",
                        "event_type": "new_game",
                        "request": gameRequest,
                        "pieces": piece_pk_map}
                )
            except ValidationError as e:
                self.send(text_data=json.dumps({
                    "message": "Could not send request" + str(e),
                    "event_type": "fail"
                    }))
        elif type == 'accept_game':
            pk = data_json['request_pk']
            try:
                accepted_request = GameRequest.objects.get(('pk', pk))
                accepted_request.delete()
                # Figure out who goes first
                coin_flip = random.random() < .5
                white = requesting_user if coin_flip else accepted_request.requesting_user
                black = requesting_user if not coin_flip else accepted_request.requesting_user
                # Create the game in the database
                new_game = Game.create_game(white, black, accepted_request.board_setup)
                # Let everyone know this request was taken
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name, {
                        "type": "send_to_socket",
                        "event_type": "begin_game",
                        "deleted_ids": [pk],
                        "game_data": GameSerializer(new_game).data,
                        "game_name": accepted_request.board_setup.name
                    }
                )
            except (ValueError, GameRequest.DoesNotExist):
                self.send(text_data=json.dumps({
                    "message": f"This request no longer exists",
                    "event_type": "fail",
                    }))

    # Receive message from room group
    def send_to_socket(self, event):
        event['whoami'] = self.scope['user'].username
        # Send message to WebSocket
        self.send(text_data=json.dumps(event))


class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.group_name = f'game_{self.game_id}'
        requesting_user = self.scope["user"]
        if str(requesting_user) == "AnonymousUser":
            return
        async_to_sync(self.channel_layer.group_add)(
            self.group_name, self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        if close_code == 1000:
            try:
                Game.objects.get(pk=self.game_id).delete()
            except Game.DoesNotExist:
                pass # already removed

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        requesting_user = self.scope["user"]
        if str(requesting_user) == "AnonymousUser":
            self.send(text_data=json.dumps({
                "message": "Not logged in, could not send request.",
                "event_type": "fail"
                }))
            return
        try:
            event_type = text_data_json['event_type']
            try:
                game = Game.objects.get(pk=self.game_id)
            except Game.DoesNotExist:
                self.send(text_data=json.dumps({
                    "message": "This game has already ended",
                    "event_type": "fail"
                    }))
                return
            user_color = None
            if game.white_user == requesting_user:
                if game.black_user == requesting_user:
                    user_color = 'white' if game.white_to_move else 'black'
                else:
                    user_color = 'white'
            elif game.black_user == requesting_user:
                    user_color = 'black'
            if user_color == None:
                self.send(text_data=json.dumps({
                    "message": "Not participating in game, could not send request.",
                    "event_type": "fail"
                    }))
            elif event_type == "resign":
                game.resign(user_color)
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    {
                    "type": "send_to_socket",
                    "event_type": "agreement",
                    "game_data": GameSerializer(game).data,
                    }
                )
            elif event_type == "draw":
                cur_offer = game.game_state['draw_offer']
                if game.black_user == game.white_user and cur_offer != 'none':
                    # If you are playing as both users, accept the draw for 
                    # the correct color.
                    if cur_offer == 'black':
                        game.draw('white')
                    elif cur_offer == 'white':
                        game.draw('black')
                else:
                    game.draw(user_color)
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    {
                        "type": "send_to_socket",
                        "event_type": "agreement",
                        "game_data": GameSerializer(game).data,
                    }
                )
            elif event_type == "move":
                from_loc = tuple(text_data_json['from_loc'])
                to_loc = tuple(text_data_json['to_loc'])
                try:
                    if game.make_move(from_loc, to_loc, requesting_user):
                     # Successful move
                     async_to_sync(self.channel_layer.group_send)(
                        self.group_name,
                            {
                            "type": "send_to_socket",
                            "event_type": "board_update",
                            "game_data": GameSerializer(game).data,
                            }
                        )
                    else:
                        # Move is not valid
                        self.send(text_data=json.dumps({
                            "event_type": "invalid_move",
                            "message": "You cannot move that piece to that location."
                            }))
                except (ValidationError, SyntaxError, NameError) as e:
                    if isinstance(e, SyntaxError) or isinstance(e, NameError):
                        message = "Failed to compile this code, see the error trace:\n" + repr(e)
                    else:
                        message = repr(e)
                    self.send(text_data=json.dumps({
                        "event_type": "invalid_move",
                        "message": message
                        }))
        except KeyError:
            self.send(text_data=json.dumps({
                "message": f"Invalid data, you sent {text_data_json}",
                "event_type": "fail"
                }))



    # Receive message from room group
    def send_to_socket(self, event):
        event['whoami'] = self.scope['user'].username
        # Send message to WebSocket
        self.send(text_data=json.dumps(event))
