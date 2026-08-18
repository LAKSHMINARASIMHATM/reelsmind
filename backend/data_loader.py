"""
Data loader for the AI Reel Recommendation Agent.
Loads and validates sample Reel data, user credentials, and suggested accounts.
"""

from __future__ import annotations
import json
import os
from typing import List, Optional, Dict, Any


DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_sample_reels() -> Dict[str, Any]:
    """Load the sample Reels dataset."""
    path = os.path.join(DATA_DIR, "sample_reels.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_users() -> List[dict]:
    """Return all registered users."""
    data = load_sample_reels()
    return data.get("users", [])


def authenticate_user(username_or_email: str, password: str) -> Optional[dict]:
    """Authenticate a user by username or email and password."""
    users = get_all_users()
    query = username_or_email.strip().lower()
    for user in users:
        if (user["username"].lower() == query or user["email"].lower() == query) and user["password"] == password:
            # Return user dict without plain password
            u = dict(user)
            u.pop("password", None)
            return u
    return None


def register_user(username: str, email: str, password: str, full_name: str) -> dict:
    """Register a new user."""
    data = load_sample_reels()
    users = data.get("users", [])
    
    # Check if username or email already exists
    for u in users:
        if u["username"].lower() == username.strip().lower():
            raise ValueError("Username already taken")
        if u["email"].lower() == email.strip().lower():
            raise ValueError("Email address already registered")
            
    new_user = {
        "user_id": f"u_{len(users) + 1:03d}",
        "username": username.strip().lower(),
        "email": email.strip().lower(),
        "password": password,
        "full_name": full_name.strip() or username.strip(),
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={username.strip()}",
        "bio": "💻 AI Tech Reel Explorer | Coding & Technology Enthusiast 🚀",
        "website": f"https://github.com/{username.strip().lower()}",
        "followers_count": 1,
        "following_count": 5,
        "posts_count": 0,
        "profile_id": "P004"
    }
    
    users.append(new_user)
    data["users"] = users
    path = os.path.join(DATA_DIR, "sample_reels.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    res = dict(new_user)
    res.pop("password", None)
    return res


def get_suggested_accounts() -> List[dict]:
    """Return suggested Instagram accounts to follow."""
    data = load_sample_reels()
    return data.get("suggested_accounts", [])


def get_profile_reels(profile_id: str) -> List[dict]:
    """Return Reels for a given student profile ID."""
    data = load_sample_reels()
    profiles = {p["profile_id"]: p for p in data.get("student_profiles", [])}
    if profile_id not in profiles:
        raise ValueError(f"Unknown profile: {profile_id}")
    
    reel_ids = profiles[profile_id]["reel_ids"]
    all_reels = {r["reel_id"]: r for r in data.get("reels", [])}
    
    return [all_reels[rid] for rid in reel_ids if rid in all_reels]


def get_all_profiles() -> List[dict]:
    """Return all available student profiles."""
    data = load_sample_reels()
    return data.get("student_profiles", [])


def get_hype_test_reels() -> List[dict]:
    """Return the hype test Reels for validation."""
    data = load_sample_reels()
    return data.get("hype_test_reels", [])


def validate_reel(reel: dict) -> tuple[bool, List[str]]:
    """
    Validate a Reel dict for required fields and data integrity.
    Returns (is_valid, error_messages).
    """
    errors = []
    required = ["reel_id", "title", "duration_seconds", "category", "topics"]
    for field in required:
        if field not in reel:
            errors.append(f"Missing required field: {field}")

    if reel.get("duration_seconds", 0) <= 0:
        errors.append("duration_seconds must be > 0")
    if not reel.get("title", "").strip():
        errors.append("title cannot be empty")
    if not isinstance(reel.get("topics", []), list):
        errors.append("topics must be a list")
    wp = reel.get("watch_percentage", 0)
    if not (0 <= wp <= 100):
        errors.append(f"watch_percentage must be 0-100, got {wp}")

    return len(errors) == 0, errors
