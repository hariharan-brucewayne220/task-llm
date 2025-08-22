"""Flask application factory."""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from config import config

# Initialize extensions
db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, async_mode='threading')
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Register blueprints
    from app.api.assessments import bp as assessments_bp
    from app.api.results import bp as results_bp
    from app.api.export import bp as export_bp
    from app.api.connection_test import bp as connection_test_bp
    from app.api.model_comparisons import model_comparisons_bp
    
    app.register_blueprint(assessments_bp, url_prefix='/api')
    app.register_blueprint(results_bp, url_prefix='/api')
    app.register_blueprint(export_bp, url_prefix='/api')
    app.register_blueprint(connection_test_bp, url_prefix='/api')
    app.register_blueprint(model_comparisons_bp)
    
    # Register WebSocket events
    from app.websocket import events
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app