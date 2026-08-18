import sys
import os

# Add backend directory to Python module search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app

class VercelMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        # Extract true original path from Vercel headers before internal rewrite
        raw_uri = environ.get("RAW_URI") or environ.get("REQUEST_URI") or environ.get("HTTP_X_MATCHED_PATH") or ""
        path = raw_uri.split("?")[0] if raw_uri else environ.get("PATH_INFO", "")
        
        if path.startswith("/api/index.py"):
            path = path[len("/api/index.py"):]
        if not path.startswith("/api"):
            path = "/api" + (path if path and path != "/" else "")
            
        environ["PATH_INFO"] = path
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelMiddleware(app.wsgi_app)
