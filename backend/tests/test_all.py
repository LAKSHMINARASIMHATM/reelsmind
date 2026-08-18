"""
Automated tests for the AI Reel Recommendation Agent (Flask version).
Run with: pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import json
import pytest

from main import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ─── Test 1: Java Trap ────────────────────────────────────────────────────────
def test_java_trap(client):
    """Primary interest must NOT be 'Java' for the Java Trap profile."""
    r = client.get("/api/analyze/P001")
    assert r.status_code == 200
    data = json.loads(r.data)
    primary = data["interest_profile"]["primary_interest"]["interest_name"].lower()
    assert primary != "java", f"FAIL: Narrowly inferred 'Java'. Got: {primary}"
    assert any(kw in primary for kw in ["software", "engineering", "career", "backend", "technical"]), \
        f"FAIL: Expected broader Software Engineering theme. Got: {primary}"
    print(f"\n✅ Java Trap PASS — Primary: {primary}")


# ─── Test 2: AI Learner ───────────────────────────────────────────────────────
def test_ai_learner(client):
    r = client.get("/api/analyze/P002")
    assert r.status_code == 200
    data = json.loads(r.data)
    primary    = data["interest_profile"]["primary_interest"]["interest_name"].lower()
    secondaries = [s["interest_name"].lower() for s in data["interest_profile"]["secondary_interests"]]
    has_ai = ("ai" in primary or "generative" in primary or "machine" in primary or
              any("ai" in s or "generative" in s for s in secondaries))
    assert has_ai, f"FAIL: No AI interest. Primary: {primary}, Secondaries: {secondaries}"
    print(f"\n✅ AI Learner PASS — Primary: {primary}")


# ─── Test 3: Entertainment — No False Tech ────────────────────────────────────
def test_entertainment_no_false_tech(client):
    r = client.get("/api/analyze/P003")
    assert r.status_code == 200
    data   = json.loads(r.data)
    profile = data["interest_profile"]
    ent_ratio = profile["entertainment_ratio"]
    conf_num  = profile["primary_interest"]["confidence_numeric"]
    recs      = data["recommendations"]
    valid = ent_ratio >= 0.25 or conf_num < 70 or len(recs) <= 3
    assert valid, f"FAIL: Hallucinated tech interest. ent={ent_ratio:.2f}, conf={conf_num}"
    print(f"\n✅ Entertainment PASS — ent_ratio={ent_ratio:.2f}, conf={conf_num}")


# ─── Test 4: Hype Rejection ───────────────────────────────────────────────────
def test_hype_rejection(client):
    r = client.get("/api/candidates")
    assert r.status_code == 200
    data = json.loads(r.data)
    rejected = data["rejected"]
    assert len(rejected) > 0, "FAIL: No hype content was rejected"
    rejected_titles = [rv["candidate"]["title"].lower() for rv in rejected]
    assert any(
        any(kw in t for kw in ["guaranteed", "secret", "get rich", "lakh", "overnight"])
        for t in rejected_titles
    ), "FAIL: Known hype content was not rejected"
    print(f"\n✅ Hype Rejection PASS — {len(rejected)} rejected")


# ─── Test 5: Educational Value ────────────────────────────────────────────────
def test_educational_value(client):
    r = client.get("/api/candidates")
    assert r.status_code == 200
    data = json.loads(r.data)
    for c in data["approved"]:
        assert c.get("educational_value", 0) >= 0.40, f"FAIL low edu: {c['title']}"
        assert len(c.get("learning_outcomes", [])) > 0, f"FAIL missing outcomes: {c['title']}"
    print(f"\n✅ Educational Value PASS — {len(data['approved'])} candidates valid")


# ─── Test 6: Validation Report ───────────────────────────────────────────────
def test_validation_report(client):
    r = client.post("/api/validate")
    assert r.status_code == 200
    report = json.loads(r.data)
    assert report["hype_rejection_rate"] == 1.0, f"FAIL hype rate: {report['hype_rejection_rate']}"
    assert report["trap_success_rate"] == 1.0, f"FAIL trap rate: {report['trap_success_rate']}"
    assert report["average_processing_time_seconds"] < 30, "FAIL: > 30s"
    print(f"\n✅ Validation PASS — trap={report['trap_success_rate']}, hype={report['hype_rejection_rate']:.2f}, time={report['average_processing_time_seconds']:.2f}s")


# ─── Test 7: Profiles endpoint ───────────────────────────────────────────────
def test_profiles(client):
    r = client.get("/api/profiles")
    assert r.status_code == 200
    assert len(json.loads(r.data)["profiles"]) >= 3


def test_invalid_profile(client):
    r = client.get("/api/analyze/INVALID")
    assert r.status_code == 404


def test_custom_analyze(client):
    payload = {"reels": [{
        "reel_id": "TEST1", "title": "Docker Internals", "description": "Docker",
        "duration_seconds": 55, "category": "Cloud", "topics": ["docker","cloud","devops"],
        "watch_duration_seconds": 53, "watch_percentage": 96, "liked": True,
        "shared": False, "saved": True, "commented": False, "comment_sentiment": "neutral",
        "rewatched": True, "engagement_score": 0.88, "educational_value": 0.90, "hype_score": 0.03,
    }]}
    r = client.post("/api/analyze", json=payload)
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "recommendations" in data
    print(f"\n✅ Custom analyze PASS")
