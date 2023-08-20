#python3 manage.py test
#or f5 if you set it up your .vscode/launch.json right
# Make sure you start redis and the convert_code_server.ts first. (See README.md)
import tempfile
import itertools
import json
import shutil
from typing import Dict

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from django.test import TestCase, Client, override_settings
from django.test import Client

from api.consumers import LobbyConsumer, GameConsumer
from api.game_logic import make_move, Location, BoardTile, PieceInstance, MoveContext, InvalidMoveError
from api.models import User, Move, Piece, PieceMove, BoardSetup,  Game, PieceLocation
from api.routing import websocket_urlpatterns
# Create your tests here.

image_bytes = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAADQCAYAAAB2pO90AAAAAXNSR0IArs4c6QAACn1JREFUeF7tnTGSFTcURS9lB87AqQMDqRNgBUCVqxw4AK8AvAJgBcAGDKwAyJwZclcBKwASp4ZyOccrwHVr5ttN0//PTD/pq/vpdBUBMyPp67x3RmpJ3XNKXBCAwGwCp2aXpCAEICAEIgkgECCAQAF4FIUAApEDEAgQQKAAPIpCAIHIAQgECCBQAB5FIYBA5AAEAgQQKACPohBAIHIAAgECCBSAR1EIIBA5AIEAAQQKwKMoBBCIHIBAgAACBeBRFAIIRA5AIEAAgQLwKAoBBCIHIBAggEABeBSFAAKRAxAIEECgADyKQgCByAEIBAggUAAeRSGAQOQABAIEECgAj6IQQCByAAIBAggUgEdRCCAQOQCBAAEECsCjKAQQiByAQIAAAgXgURQCCEQOQCBAAIEC8CgKAQQiByAQIIBAAXgUhQACkQMQCBBAoAA8ikIAgfrIgXOSrkl6JelNH13eTy8RaD+cW7ZyUdLrwQc4L+ldyw+UqW0EyhTN6b7ck3R38K07kh7m7/Z+eohA++HcspWxQPcl+WtcBQggUAGIC68CgSoGCIEqwl1I1QhUMRAIVBHuQqpGoIqBQKCKcBdSNQJVDAQCVYS7kKoRqGIgehDopqSPkp5L+lCR5VKrRqCKkcku0LPDHXgjfCrJMvV2IVDFiGcXyCPO6QG/7P2dShUEQqDZBHxk5eyg9KUOz4Ih0Oz0Obpg9t/ILyVdHmC4Kslf6+lCoIrRzi6Qz3zdGvDr8RgLAiHQbALj5Hkk6fbs2tZZ0Asnjwcf3auR19fZleV96uwj0BVJLwbY/TyMv9bTBYOK0e5NID9M5oWEni4Eqhjt7AIZnTdRh1cPfR72F4EQKESgd4H4JRJKn92Fe/htPN5M7fGRZn6JVJKoB4HYC2IaW0kfCYGqoV1UxV48uTD4RD1uKFcJCAJVwbq4ShmFK4UEgSqBXVi1CFQpID0IxFEW6YmkG4Mc4tVWhYRCoEIgF14Nv0QqBagHgXz27cGAX4/n4RAIgWYTYCf+4EWKw7eT9ngqfXYC7SrYwwg0FojzcAcvme/tUC0CBQj0vhPPKBxInt5HIM6CHYw2vT/WUUWhHqZwBtf7Tvz4T5z0OI1FoAABNhI5DxdIn+1FexmBxu9G6HEjcXwf+HWnL5osKlIvArGMe/A2ot7fUFRUHleGQMWRLrbC8XEe9oIKhAqBCkBcSRXjExm8nadA4BCoAMSVVDFeyvZbW/10LleAAAIF4K2waO8bysVDhkDFkS66QgQqHB4EKgx04dUhUOEAIVBhoAuvbvjXKt5K8gkFrgCBXgTiicyDJPE7sb0ndubwHeH+A2RcAQK9CDR+N1yPfycokCYU3UagF4GGU5f3ks6REhAoQaAXgbwH4mmcpy7+cx9MXUpkD3V0c5SHUEOgCoFeRqAq8KgUAghEDkAgQACBAvAoCgEEIgcgECCAQAF4FIUAApEDEAgQQKAAPIpCAIHIAQgECCBQAB5FIYBA5AAEAgQQKACPohBAIHIAAgECCBSAR1EIIBA5AIEAAQQKwKMoBBCIHIBAgAACBeBRFAIIRA5AIEAAgQLwKAoBBCIHIBAggEABeBSFAAKRAxAIEECgADyKQgCByAEIBAggUAAeRSGAQOQABAIEECgAj6IQQCByAAIBAggUgEdRCCAQOQCBAAEECsCjKAQQiByAQIAAAgXgURQCCEQOQCBAAIEC8CgKAQQiByAQIIBAAXgUhQACkQMQCBBAoAC8BEXPSbom6ZWkNwn6s/curEmg7yR9L+l3SX/snVS+Bi9Kej3o1nlJ7/J1s26P1iLQj5J+lfSFpI+S/P+XddGkr/2epLuDXt6R9DB9rwt3cC0C/S3pm0Hf/5L0bWEWvVVnWW4NOn1fkqXiOgGBtQr0j6TrjEIniPSnP2p2v41KI9AMnGsRaDOF+1LSV4N+XkWiE0fd9z4vJJ0ZlbzEQsKJWWotArlnXkT4RdIPg25+kGSJWEE6XuwtjRcOvPo2vH6W9OR4VfBTQwJrEsif24H/cxRCy2OJLBPXbgIeea4gT7k0WZtA7vltSQ9GCLwiZ4m4thOY4vZU0k2gzSewRoHcW083boy6/ehQrvk08pacuu/x5ul4NMpLoFLP1iqQcXjqdoHpyJGZ4fseT90s0ebyKqanw0x7j8S3+wfWLJATwzvnp5Foa5Cn5PEP/yTpWTB3KC6tahVuKmD+rer7HySaTmfv9XjPZ3hx31NQ/TWPQBsMvgl+PMGk96VZMxkvEHDfU1AeV5VBIPcDiT5NjCl53h4uGnDfU1CiLAIh0f9JMT4k6u8gT0FphlVlEmiXRF729pQu+zU1EnvFzfeKPKpQIfrZBDKibQsL2SXaJo/3ejjqVEGeTPdAYzy7JPJzL9nuA5CnkiBHVZtxBNr0eZtE2c7OIc9RWV7x+5kF2kznPHUbn1jIItG21UceTagoTeZFhCls3o33ZutYIt9Ue0d+rfcHLN3vSZJdzWQfgTZ93yaR74Us0drer4A8C5An8yLCtpHI7wEYn+L2z3rvxI80r+FCngVFqZcRaIh86lEIf9+jkPeKlrxfgjwLkqe3EWiIflsiekrn0cjPFi3tQp6lRSTRWbg5aL3B6CP945PcSxyNkGdOhPdQpscp3BCrFxcs0eUJ1h6N/Bi0j/+3vPzyw6n3tfV+2rxlTP5ru3eBNiAsipN022jk0wv7Xu623D5VPX6ex58ZeRahT57HGUrg9CPOXmCYGo1cv7+3r2NAlsYvThm/fgp5SkS6YB2MQJ/D3DUaeVrnpXAvMtQ4T2dhLM7UqONT1RwMLZj8JapCoGmKTmSL4j/9MXVZHt87+Z+f8ozKZDG8P2Vxxm8Mdfs8z1Mi2yvUgUC7oTqxPXU7ewR73x9ZuOcnkMlTRR949Yg3NVXbNOkNXtcdlbRC+lAlAh0vB3ZN68Y1WCb/G2/IWhaPLv43fMXUtk/gkc3L10ve2D0evcQ/hUDHD64T3wltmY4akY5f6+c/+f5wRZB3VUco7qksAs0D7RHEMnmKNz7lPa/Gg/0mS7O2g61z+5uiHALFw+j7F9/8W6iTyOSFgc10z+JwjxOPxd5rQKCyyDf3N5ZqvDBgWTaSMMqU5d6sNgRqhp6GMxBAoAxRpA/NCCBQM/Q0nIEAAmWIIn1oRgCBmqGn4QwEEChDFOlDMwII1Aw9DWcggEAZokgfmhFAoGboaTgDAQTKEEX60IwAAjVDT8MZCCBQhijSh2YEEKgZehrOQACBMkSRPjQjgEDN0NNwBgIIlCGK9KEZAQRqhp6GMxBAoAxRpA/NCCBQM/Q0nIEAAmWIIn1oRgCBmqGn4QwEEChDFOlDMwII1Aw9DWcggEAZokgfmhFAoGboaTgDAQTKEEX60IwAAjVDT8MZCCBQhijSh2YEEKgZehrOQACBMkSRPjQjgEDN0NNwBgIIlCGK9KEZAQRqhp6GMxBAoAxRpA/NCCBQM/Q0nIEAAmWIIn1oRgCBmqGn4QwEEChDFOlDMwII1Aw9DWcggEAZokgfmhFAoGboaTgDAQTKEEX60IwAAjVDT8MZCCBQhijSh2YEEKgZehrOQACBMkSRPjQj8C89Jk/gQeC1iAAAAABJRU5ErkJggg=='
move_implementation = {"blocks": {"languageVersion": 0, "blocks": [{"type": "chess_action", "id": "`8DRg_aD7uEOo{L?xIXd", "x": 137, "y": 52, "inputs": {"ACTION": {"block": {"type": "teleport", "id": "S5kX9!cc`[Weq+@;23GT", "inputs": {"FROM_UNIT": {"block": {"type": "acting_unit", "id": "8IZ.zuq_o3fB_EYrd|r5"}}, "TO_TILE": {"block": {"type": "targeted_tile", "id": "^!!!^cr){Mn?=xSH#6Ao"}}}}}}}]}}
MOCK_MEDIA_ROOT = tempfile.mkdtemp()
TIMEOUT_SEC = 1

class AuthWebsocketCommunicator(WebsocketCommunicator):
    def __init__(self, path, headers=None, subprotocols=None, user=None):
        super(AuthWebsocketCommunicator, self).__init__(URLRouter(websocket_urlpatterns), path, headers, subprotocols)
        if user is not None:
            self.scope['user'] = user

@override_settings(MEDIA_ROOT=MOCK_MEDIA_ROOT)
class TestCaseWithMockData(TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MOCK_MEDIA_ROOT, ignore_errors=True)  # delete the temp dir
        super().tearDownClass()

    def setUp(self):
        self.wolf_user = User.objects.create_user('wolfblue', "7alex7li@gmail.com", "password")
        self.dan_user = User.objects.create_user('dan', "dan@gmail.com", "password")
        self.move_official = Move.objects.create(author=self.wolf_user, cat=Move.Category.OFFICIAL, color='[123,123,123]',implementation=move_implementation, description='its the move', symbol='')
        self.dan_move = Move.objects.create(author=self.dan_user, cat=Move.Category.CUSTOM, color='[0,0,255]',implementation=move_implementation, description='its the other move', symbol='XD')
        sample_moves = [
            {
            'relative_row': 1,
            'relative_col': 0,
            'move': self.move_official.pk
            }
        ]
        sample_moves_2 = [
            {
            'relative_row': 1,
            'relative_col': 0,
            'move': self.move_official.pk
            },
            {
            'relative_row': -1,
            'relative_col': 0,
            'move': self.dan_move.pk
            }
        ]
        self.piece_official = Piece.create_piece(image_bytes, self.wolf_user, "king", sample_moves, Piece.Category.OFFICIAL)
        self.piece_official_2 = Piece.create_piece(image_bytes, self.dan_user, "mover", sample_moves_2, Piece.Category.CUSTOM)
        piece_locations = [
            {
                'row': 0,
                'col': 0,
                'piece': self.piece_official.pk,
                'team': 'white',
                'is_royal': True
            },
            {
                'row': 3,
                'col': 0,
                'piece': self.piece_official_2.pk,
                'team': 'black',
                'is_royal': True
            }
        ]
        self.sample_board = BoardSetup.create_board(self.wolf_user, "sample", piece_locations, BoardSetup.Category.OFFICIAL, wincon_white=BoardSetup.WinCon.KILL_ANY_ROYAL, wincon_black=BoardSetup.WinCon.KILL_ANY_ROYAL)
        self.sample_game = Game.create_game(self.wolf_user, self.dan_user, self.sample_board)

class MovesTest(TestCaseWithMockData):
    def test_can_get_official_moves(self):
        client = Client()
        client.force_login(self.wolf_user)
        response = client.get('/api/moves')
        moves = response.json()
        self.assertEqual(len(moves), 1)
        self.assertEqual(moves[0]['implementation'], move_implementation)
        self.assertEqual(moves[0]['color'], [123, 123, 123])
        self.assertEqual(response.status_code, 200)

    def test_can_get_custom_moves(self):
        client = Client()
        client.force_login(self.dan_user)
        response = client.get('/api/moves')
        moves = response.json()
        self.assertEqual(len(moves), 2)
        self.assertEqual(response.status_code, 200)

class PiecesTest(TestCaseWithMockData):
    def test_get_piece(self):
        client = Client()
        client.force_login(self.dan_user)
        response = client.get('/api/pieces', {})
        data = response.json()
        assert len(data['pieces']) == 2
        for piece in data['pieces']:
            if piece['name'] == 'king':
                assert len(piece['piece_moves']) == 1
            if piece['name'] == 'mover':
                assert len(piece['piece_moves']) == 2
        assert len(data['move_map']) == 2
        self.assertEqual(response.status_code, 200)


    def test_create_piece(self):
        client = Client()
        client.force_login(self.dan_user)
        sample_moves = [
            {
            'relative_row': 0,
            'relative_col': 1,
            'move': self.dan_move.pk
            },
            {
            'relative_row': -1,
            'relative_col': 0,
            'move': self.dan_move.pk
            }
        ]
        result = client.post('/api/pieces', {
            'params': {
                'name': 'rook',
                'image': image_bytes,
                'moves': sample_moves
        }}, content_type='application/json')
        self.assertEqual(result.status_code, 201)
        piece = Piece.objects.get(('name', "rook"))
        pieceMove = PieceMove.objects.filter(('piece', piece.pk))
        assert len(pieceMove) == 2
        assert pieceMove[0].move == self.dan_move

class BoardSetupTest(TestCaseWithMockData):
    def test_get_board(self):
        client = Client()
        client.force_login(self.dan_user)
        response = client.get('/api/pieces', {})
        data = response.json()
        assert len(data['pieces']) == 2
        for piece in data['pieces']:
            if piece['name'] == 'king':
                assert len(piece['piece_moves']) == 1
            if piece['name'] == 'mover':
                assert len(piece['piece_moves']) == 2
        assert len(data['move_map']) == 2
        self.assertEqual(response.status_code, 200)


    def test_create_board(self):
        piece = self.piece_official_2
        client = Client()
        client.force_login(self.dan_user)
        piece_locations = [
            {
                'row': 0,
                'col': 0,
                'piece': piece.pk,
                'team': 'white',
                'is_royal': False
            },
            {
                'row': 0,
                'col': 3,
                'piece': piece.pk,
                'team': 'black',
                'is_royal': True
            }
        ]
        result = client.post('/api/boardSetups', {
            'params': {
                'name': 'sampleSetup',
                'piece_locations': piece_locations,
                'wincon_white': BoardSetup.WinCon.KILL_ANY_ROYAL,
                'wincon_black': BoardSetup.WinCon.KILL_ALL,
        }}, content_type='application/json')
        self.assertEqual(result.status_code, 201)
        boards = BoardSetup.objects.filter(('name', 'sampleSetup'))
        assert len(boards) == 1
        board = boards[0]
        pieceLoc = PieceLocation.objects.filter(('board_setup', board))
        assert len(pieceLoc) == len(piece_locations)
        assert board.wincon_black == BoardSetup.WinCon.KILL_ALL
        assert board.wincon_white == BoardSetup.WinCon.KILL_ANY_ROYAL

class LobbyConsumerTest(TestCaseWithMockData):
    async def test_lobby_consumer(self):
        communicator_wolf = AuthWebsocketCommunicator("/ws/lobby/", user=self.wolf_user)
        communicator_dan = AuthWebsocketCommunicator("/ws/lobby/", user=self.dan_user)
        connected, _ = await communicator_dan.connect(TIMEOUT_SEC)
        assert connected
        connected, _ = await communicator_wolf.connect(TIMEOUT_SEC)
        assert connected
        # 1) Dan requests a new game
        await communicator_dan.send_json_to({
            'event_type': 'request_game',
            'board_pk': self.sample_board.pk
        })
        response = await communicator_dan.receive_from(TIMEOUT_SEC)
        response_json = json.loads(response)
        request_pk = response_json['request']['pk']
        assert response_json['event_type'] == 'new_game'
        assert response_json['request']['requesting_user'] == 'dan'
        assert response_json['request']['board_setup']['name'] == self.sample_board.name
        assert response_json['request']['board_setup']['pk'] == self.sample_board.pk
        assert len(response_json['pieces']) == 2
        # 2) wolf sees that the game is posted
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        assert response_json['event_type'] == 'new_game'
        assert response_json['request']['requesting_user'] == 'dan'
        assert response_json['request']['board_setup']['name'] == self.sample_board.name
        assert response_json['request']['board_setup']['pk'] == self.sample_board.pk
        assert len(response_json['pieces']) == 2
        # 3) wolf joins the game!
        await communicator_wolf.send_json_to({
            'event_type': 'accept_game',
            'request_pk':  request_pk
        })
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        assert response_json['event_type'] == 'begin_game'
        assert response_json['deleted_ids'] == [request_pk]
        orig_white = response_json['game_data']['white_user']
        # 4) If wolf sends the request twice, it only accepts once
        await communicator_wolf.send_json_to({
            'event_type': 'accept_game',
            'request_pk':  request_pk
        })
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        assert response_json['event_type'] == 'fail'
        assert response_json['message'] != ""
        # 5) Dan learns that wolf has joined the game
        dan_alert = await communicator_dan.receive_from(TIMEOUT_SEC)
        response_json = json.loads(dan_alert)
        assert response_json['event_type'] == 'begin_game'
        assert response_json['deleted_ids'] == [request_pk]
        next_white = response_json['game_data']['white_user']
        assert next_white == orig_white # same white player
        await communicator_wolf.send_json_to({
            'event_type': 'accept_game',
            'request_pk':  request_pk
        })
        await communicator_wolf.disconnect()
        await communicator_dan.disconnect()

class GameConsumerTest(TestCaseWithMockData):
    async def test_move_forwards(self):
        game_pk = self.sample_game.pk
        communicator_wolf = AuthWebsocketCommunicator(f"/ws/game/{game_pk}/", user=self.wolf_user)
        communicator_dan = AuthWebsocketCommunicator(f"/ws/game/{game_pk}/", user=self.dan_user)
        connected, _ = await communicator_dan.connect(TIMEOUT_SEC)
        assert connected
        connected, _ = await communicator_wolf.connect(TIMEOUT_SEC)
        
        await communicator_wolf.send_json_to({
            'from_loc': [0, 0],
            'to_loc': [1, 0],
            'event_type': 'move'
        })
        # One move as white
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        response_json['whoami'] = 'dan'
        assert response_json['event_type'] == 'board_update'
        dan_alert = await communicator_dan.receive_from(TIMEOUT_SEC)
        assert json.loads(dan_alert) == response_json
        board = response_json['game_data']['game_state']['board']
        assert len(board) == 64
        assert board["0,0"]['piece'] is None
        assert board["1,0"]['piece'] is not None
        
        # One move as black
        assert board["3,0"]['piece'] is not None
        assert board["2,0"]['piece'] is None

        await communicator_dan.send_json_to({
            'from_loc': [3, 0],
            'to_loc': [2, 0]
        })
        dan_alert = await communicator_dan.receive_from(TIMEOUT_SEC)
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        response_json['whoami'] = 'dan'
        assert json.loads(dan_alert) == response_json
        board = response_json['game_data']['game_state']['board']
        assert board["3,0"]['piece'] is None
        assert board["2,0"]['piece'] is not None

        # One invalid move as white
        await communicator_wolf.send_json_to({
            'from_loc': [1, 0],
            'to_loc': [2, 0]
        })
        wolf_alert = await communicator_wolf.receive_from(TIMEOUT_SEC)
        response_json = json.loads(wolf_alert)
        assert response_json['event_type'] == "invalid_move"

        await communicator_wolf.disconnect()
        await communicator_dan.disconnect()

class GameTest(TestCaseWithMockData):
    @staticmethod
    def init_empty_board()-> Dict[Location, BoardTile]:
        return {Location(r, c): {'piece': None} for r, c in itertools.product(range(8), range(8))}
    def test_move(self):
        board = self.init_empty_board()
        board[Location(0,0)]['piece'] = PieceInstance({
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        })
        ctx = MoveContext(board, Location(0,0), Location(0,1))
        def action():
          ctx.tele_to(ctx.acting_piece, ctx.targeted_tile)
        action()
        assert board[Location(0, 0)]['piece'] == None
        assert board[Location(0, 1)]['piece'] == {
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        }

    def test_take_and_move(self):
        board = self.init_empty_board()
        board[Location(0,0)]['piece'] = PieceInstance({
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        })
        board[Location(0,1)]['piece'] = PieceInstance({
            'piece_id': 1,
            'name': 'piece_b',
            'team': 'black',
            'is_royal': False,
        })
        ctx = MoveContext(board, Location(0,0), Location(0,1))
        def action():
          ctx.take(ctx.board[ctx.targeted_tile]['piece'])
          ctx.tele_to(ctx.acting_piece, ctx.targeted_tile)
        action()
        assert board[Location(0, 0)]['piece'] == None
        assert board[Location(0, 1)]['piece'] == {
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        }

    def test_take_path_blocked(self):
        board = self.init_empty_board()
        board[Location(0,0)]['piece'] = PieceInstance({
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        })
        board[Location(0,1)]['piece'] = PieceInstance({
            'piece_id': 1,
            'name': 'piece_b',
            'team': 'black',
            'is_royal': False,
        })
        ctx = MoveContext(board, Location(0,0), Location(0,1))
        def action():
          ctx.take(ctx.board[ctx.targeted_tile]['piece'])
          ctx.tele_to(ctx.acting_piece, ctx.targeted_tile)
        action()
        assert board[Location(0, 0)]['piece'] == None
        assert board[Location(0, 1)]['piece'] == {
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        }

    def test_move_blockable(self):
        board = self.init_empty_board()
        board[Location(0,0)]['piece'] = PieceInstance({
            'piece_id': 0,
            'name': 'piece_a',
            'team': 'white',
            'is_royal': False,
        })
        board[Location(0,1)]['piece'] = PieceInstance({
            'piece_id': 1,
            'name': 'piece_b',
            'team': 'black',
            'is_royal': False,
        })
        ctx = MoveContext(board, Location(0,0), Location(0,2))

        def action():
          has_path = True
          for tile in ctx.path(ctx.tile_of(ctx.acting_piece), ctx.targeted_tile, 1, 1):
            has_path = has_path and not ctx.board[tile]['piece'] is not None
          if has_path:
            ctx.tele_to(ctx.acting_piece, ctx.targeted_tile)

        action()
        assert not ctx.did_action

        ctx = MoveContext(board, Location(0,0), Location(5,0))
        def action():
          has_path = True
          for tile in ctx.path(ctx.tile_of(ctx.acting_piece), ctx.targeted_tile, 1, 1):
            has_path = has_path and not ctx.board[tile]['piece'] is not None
          if has_path:
            ctx.tele_to(ctx.acting_piece, ctx.targeted_tile)

        action()
        assert ctx.did_action
        assert board[Location(0, 0)]['piece'] == None
        assert board[Location(5, 0)]['piece']['piece_id'] == 0
