from django.test import TestCase
from django.test import Client
from api.models import Move
from django.contrib.auth.models import User
import json
# Create your tests here.

from django.test.runner import DiscoverRunner as BaseRunner

class TestCaseWithMockData(TestCase):
    def setUp(self):
        wb_user = User.objects.create_user('wolfblue', "7alex7li@gmail.com", "password")
        dan_user = User.objects.create_user('dan', "dan@gmail.com", "password")
        move_official = Move.objects.create(author=wb_user, name="a_move", cat=Move.Category.OFFICIAL, color='[123,123,123]',implementation='', description='its the move', symbol='')
        dan_move = Move.objects.create(author=dan_user, name="b_move", cat=Move.Category.CUSTOM, color='[0,0,255]',implementation='', description='its the other move', symbol='XD')

class MovesTest(TestCaseWithMockData):
    def test_can_get_official_moves(self):
        client = Client()
        client.force_login(User.objects.get(('username', 'wolfblue')))
        response = client.get('/api/moves')
        moves = response.json()
        self.assertEqual(len(moves), 1)
        self.assertEqual(moves[0]['color'], [123, 123, 123])

    def test_can_get_custom_moves(self):
        client = Client()
        client.force_login(User.objects.get(('username', 'dan')))
        response = client.get('/api/moves')
        moves = response.json()
        self.assertEqual(len(moves), 2)

class PiecesTest(TestCaseWithMockData):
    def test_create_rook(self):
        dan_move = Move.objects.get(('name', "b_move"))
        client = Client()
        client.force_login(User.objects.get(('username', 'dan')))
        move_map = {
            dan_move: [[0, 1], [0, -1], [1, 0], [-1, 0]]
        }
        client.post('/api/pieces', {
                'name': 'rook',
                'passives': '',
                'image': 'data:image/png;base64,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',
                'moves': move_map
        })
