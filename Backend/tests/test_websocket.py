import os
from contextlib import contextmanager

from fastapi.testclient import TestClient


@contextmanager
def configure_env():
    original_db = os.environ.get('PAIR_DATABASE_URL')
    original_origin = os.environ.get('PAIR_FRONTEND_ORIGIN')
    os.environ['PAIR_DATABASE_URL'] = 'sqlite+aiosqlite:///./test_realtime.db'
    os.environ['PAIR_FRONTEND_ORIGIN'] = 'http://testserver'
    try:
        yield
    finally:
        if original_db is None:
            os.environ.pop('PAIR_DATABASE_URL', None)
        else:
            os.environ['PAIR_DATABASE_URL'] = original_db
        if original_origin is None:
            os.environ.pop('PAIR_FRONTEND_ORIGIN', None)
        else:
            os.environ['PAIR_FRONTEND_ORIGIN'] = original_origin


def test_websocket_broadcast():
    with configure_env():
        from app.main import app

        with TestClient(app) as client:
            # Create a room first
            response = client.post('/rooms')
            assert response.status_code == 200
            room_id = response.json()['roomId']

            with client.websocket_connect(f'/ws/{room_id}') as ws_a, client.websocket_connect(
                f'/ws/{room_id}'
            ) as ws_b:
                # Drain initial participant + sync messages
                for _ in range(2):
                    ws_a.receive_json()
                    ws_b.receive_json()

                ws_a.send_json({'code': 'print("hi")', 'username': 'alice'})
                payload = ws_b.receive_json()
                if 'participants' in payload:
                    payload = ws_b.receive_json()
                assert payload['code'] == 'print("hi")'
                assert payload['author'] == 'alice'
