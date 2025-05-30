from flask import Flask

from .database import init_db


def create_flask_app():
    app = Flask(__name__)
    app.config.from_pyfile('../config.py', silent=True)
    with app.app_context():
        init_db()
    from .routes import init_routes
    init_routes(app)
    return app

flask_app = create_flask_app()