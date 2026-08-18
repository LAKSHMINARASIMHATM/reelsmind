import sys
import os
import urllib.parse

# Add backend directory to Python module search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from flask import request, jsonify
from main import app

class VercelMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        query_string = environ.get("QUERY_STRING", "")
        subpath = None
        if "__path__=" in query_string:
            for item in query_string.split("&"):
                if item.startswith("__path__="):
                    raw_val = item.split("=", 1)[1]
                    subpath = urllib.parse.unquote(raw_val)
                    break
        
        if subpath is not None:
            environ["PATH_INFO"] = "/api/" + subpath.lstrip("/")
        else:
            path = environ.get("PATH_INFO", "")
            if path.startswith("/api/index.py"):
                path = path[len("/api/index.py"):]
            if not path.startswith("/api"):
                path = "/api" + (path if path and path != "/" else "")
            environ["PATH_INFO"] = path
            
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelMiddleware(app.wsgi_app)
