"""Application entry point."""
import os
from app import create_app, socketio

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    socketio.run(
        app,
        debug=app.config['DEBUG'],
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 5000)),
        allow_unsafe_werkzeug=True
    )