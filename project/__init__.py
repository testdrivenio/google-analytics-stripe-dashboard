import os

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix


def create_app(script_info=None):

    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    app_settings = os.getenv("APP_SETTINGS")

    from project.views import api
    app.register_blueprint(api)

    @app.shell_context_processor
    def ctx():
        return {"app": app}

    return app
