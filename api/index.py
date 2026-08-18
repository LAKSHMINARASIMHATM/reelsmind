import sys
import os

# Add backend directory to Python module search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app

class VercelMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        # Normalize Vercel path rewrites
        if path.startswith("/api/index.py"):
            path = path[len("/api/index.py"):]
        if not path.startswith("/api"):
            path = "/api" + (path if path != "/" else "")
        environ["PATH_INFO"] = path
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelMiddleware(app.wsgi_app)
