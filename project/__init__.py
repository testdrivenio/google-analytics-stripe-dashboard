from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix

db = SQLAlchemy()


def create_app(script_info=None):

    app = Flask(__name__)
    app.config.from_object("project.config.Config")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    db.init_app(app)

    from project.views import api

    app.register_blueprint(api)

    @app.shell_context_processor
    def ctx():
        return {"app": app}

    return app
