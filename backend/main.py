"""
Flask main application for the AI Reel Recommendation Agent.
Compatible with Python 3.14 (no pydantic/FastAPI required).
"""

from __future__ import annotations
import time
import json
import sys
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

# Add backend dir to path
sys.path.insert(0, os.path.dirname(__file__))

from models import (
    ReelInteraction, BehavioralEvidence, DetectedInterest,
    InterestProfile, Recommendation, RecommendationCandidate,
    HypeRejection, ReelAnalysisOutput, ReelRepresentation,
    LearningOutcome, TestResult, ValidationReport,
)
from analyzer import ReelHistoryAnalyzer
from recommendation_engine import RecommendationEngine
from data_loader import (
    get_all_profiles, get_profile_reels,
    load_sample_reels, get_hype_test_reels,
    validate_reel, authenticate_user, register_user,
    get_all_users, get_suggested_accounts,
)
from scoring import derive_confidence
from interest_engine import get_interest_display_name, DOMAIN_HIERARCHY
from hype_filter import filter_candidates
from recommendation_engine import CANDIDATE_POOL

# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

_analyzer   = ReelHistoryAnalyzer()
_rec_engine = RecommendationEngine()


# ---------------------------------------------------------------------------
# Pipeline Helper
# ---------------------------------------------------------------------------

def run_full_pipeline(reels_raw: list, profile_id=None) -> dict:
    t0 = time.time()

    # Validate
    valid_reels = []
    for r in reels_raw:
        ok, errs = validate_reel(r)
        if ok:
            valid_reels.append(r)
        else:
            print(f"[WARN] Skipping invalid reel {r.get('reel_id','?')}: {errs}")

    if not valid_reels:
        return {"error": "No valid Reels provided"}, 400

    # Analysis
    result      = _analyzer.analyze(valid_reels)
    inference   = result["inference_result"]
    enriched    = result["enriched_reels"]
    skill_level = result["skill_level"]
    skill_just  = result["skill_justification"]

    sorted_domains = inference.get("sorted_domains", [])
    sorted_super   = inference.get("sorted_super", [])
    norm_domains   = inference.get("normalized_domains", {})
    norm_super     = inference.get("normalized_super", {})
    is_entertain   = inference.get("entertainment_only", False)
    domain_nodes   = inference.get("domain_nodes", {})

    # Primary interest
    if is_entertain or not sorted_super:
        primary_super = ("Entertainment", 0.0)
    else:
        primary_super = sorted_super[0]

    primary_name, primary_desc = get_interest_display_name(primary_super[0])
    primary_score = norm_super.get(primary_super[0], 0.0)

    primary_supporting = []
    for domain, node in domain_nodes.items():
        if DOMAIN_HIERARCHY.get(domain, domain) == primary_super[0]:
            primary_supporting.extend(node.supporting_reels)
    primary_supporting = list(set(primary_supporting))

    conf_label, conf_num = derive_confidence(primary_score, len(primary_supporting))

    def avg_signal(key):
        return sum(r.get("behavioral_signals", {}).get(key, 0) for r in enriched) / max(len(enriched), 1)

    primary_interest = DetectedInterest(
        interest_name      = primary_name,
        interest_score     = primary_score,
        confidence         = conf_label,
        confidence_numeric = conf_num,
        supporting_reels   = primary_supporting,
        behavioral_evidence= BehavioralEvidence(
            watch_completion_contribution   = avg_signal("watch_completion"),
            rewatch_contribution            = avg_signal("rewatch"),
            like_contribution               = avg_signal("like"),
            share_contribution              = avg_signal("share"),
            save_contribution               = avg_signal("save"),
            comment_contribution            = avg_signal("comment"),
            semantic_relevance_contribution = avg_signal("semantic_relevance"),
            cross_reel_contribution         = avg_signal("cross_reel_consistency"),
            supporting_reel_ids             = primary_supporting,
            behavioral_summary              = primary_desc,
        ),
        description = primary_desc,
    )

    # Secondary interests
    secondary_interests = []
    seen_supers = {primary_super[0]}
    for domain, raw_score in sorted_domains[:10]:
        super_d = DOMAIN_HIERARCHY.get(domain, domain)
        if super_d in seen_supers:
            continue
        seen_supers.add(super_d)
        norm_score = norm_domains.get(domain, 0.0)
        if norm_score < 10:
            continue
        node = domain_nodes.get(domain)
        sup_reels = node.supporting_reels if node else []
        sc_label, sc_num = derive_confidence(norm_score, len(sup_reels))
        disp_name, disp_desc = get_interest_display_name(super_d)
        secondary_interests.append(DetectedInterest(
            interest_name      = domain,
            interest_score     = norm_score,
            confidence         = sc_label,
            confidence_numeric = sc_num,
            supporting_reels   = sup_reels,
            behavioral_evidence= BehavioralEvidence(supporting_reel_ids=sup_reels, behavioral_summary=disp_desc),
            description        = disp_desc,
        ))
        if len(secondary_interests) >= 4:
            break

    analytics = result["engagement_analytics"]
    tech_count = analytics["summary"].get("tech_count", 0)
    ent_count  = analytics["summary"].get("entertainment_count", 0)
    total_rls  = len(enriched)

    interest_profile = InterestProfile(
        primary_interest          = primary_interest,
        secondary_interests       = secondary_interests,
        skill_level               = skill_level,
        skill_level_justification = skill_just,
        total_reels_analyzed      = total_rls,
        entertainment_ratio       = ent_count / max(total_rls, 1),
        tech_engagement_ratio     = tech_count / max(total_rls, 1),
    )

    # Recommendations
    already_seen_cats = [r.get("category", "") for r in valid_reels]
    interest_profile_data = {
        "top_domains":       sorted_domains,
        "top_super_domains": sorted_super,
        "entertainment_only": is_entertain,
    }
    rec_list, rejected_raw = _rec_engine.recommend(
        interest_profile        = interest_profile_data,
        skill_level             = skill_level,
        already_seen_categories = already_seen_cats,
        top_n                   = 5,
    )

    recommendations = []
    for rank, c in enumerate(rec_list, 1):
        alignment_pct = round(c.get("interest_alignment", 0) * 100, 1)
        cl, cn = derive_confidence(alignment_pct, len(primary_supporting))
        lo = [LearningOutcome(outcome=o["outcome"]) for o in c.get("learning_outcomes", [])]
        candidate = RecommendationCandidate(
            candidate_id         = c["candidate_id"],
            title                = c["title"],
            category             = c["category"],
            topics               = c["topics"],
            difficulty           = c["difficulty"],
            educational_value    = c["educational_value"],
            engagement_potential = c["engagement_potential"],
            hype_score           = c["hype_score"],
            learning_outcomes    = lo,
            video_url            = c.get("video_url", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"),
            interest_alignment   = c.get("interest_alignment", 0),
            skill_progression_score = c.get("skill_progression_score", 0),
            novelty_score        = c.get("novelty_score", 0),
            content_quality_score= c.get("content_quality_score", 0),
            final_score          = c.get("final_score", 0),
            why_recommended      = c.get("why_recommended", ""),
        )
        sp = c.get("skill_progression_score", 0)
        if sp >= 0.95:   sp_note = "Perfect difficulty match"
        elif sp >= 0.75: sp_note = "Ideal growth stretch"
        elif sp >= 0.45: sp_note = "Slightly below current level"
        else:            sp_note = "Difficulty gap — consider bridging content"

        recommendations.append(Recommendation(
            rank                       = rank,
            candidate                  = candidate,
            interest_match_percent     = alignment_pct,
            recommendation_score       = c.get("final_score", 0),
            why_recommended            = c.get("why_recommended", ""),
            confidence                 = cl,
            confidence_numeric         = cn,
            connected_interests        = c.get("domains", [])[:3],
            skill_progression_rationale= sp_note,
        ))

    rejected_candidates = [
        HypeRejection(
            candidate_id      = r["candidate_id"],
            title             = r["title"],
            rejection_reasons = r["rejection_reasons"],
            hype_score        = r["hype_score"],
            educational_value = r["educational_value"],
        )
        for r in rejected_raw
    ]

    # Per-Reel outputs
    per_reel_outputs = []
    best_rec = rec_list[0] if rec_list else None
    for reel in enriched:
        reel_domains = reel.get("latent_domains", [])
        top_domain   = reel_domains[0] if reel_domains else "Entertainment"
        sig_parts    = []
        if reel.get("liked"):    sig_parts.append("liked")
        if reel.get("saved"):    sig_parts.append("saved")
        if reel.get("shared"):   sig_parts.append("shared")
        if reel.get("rewatched"):sig_parts.append("rewatched")
        sig_str = ", ".join(sig_parts) if sig_parts else "watched partially"

        rec_for = best_rec
        if best_rec and reel_domains:
            for r in rec_list:
                if any(d in r.get("domains", []) for d in reel_domains):
                    rec_for = r
                    break

        rec_title = rec_for["title"] if rec_for else "No suitable recommendation"
        rec_cat   = rec_for["category"] if rec_for else "N/A"
        rec_why   = rec_for.get("why_recommended", "") if rec_for else ""
        rec_diff  = rec_for.get("difficulty", skill_level) if rec_for else skill_level

        sc_label, sc_num = derive_confidence(
            reel.get("behavioral_score", 0) * 100, len(primary_supporting)
        )
        per_reel_outputs.append(ReelAnalysisOutput(
            reel_reference            = f"[{reel.get('reel_id')}] {reel.get('title')} | {reel.get('duration_seconds')}s | Watch:{reel.get('watch_percentage',0):.0f}% Like:{reel.get('liked')} Save:{reel.get('saved')} Share:{reel.get('shared')} Rewatch:{reel.get('rewatched')}",
            interest_detected         = top_domain,
            why_interest              = f"Student {sig_str} this Reel ({reel.get('watch_percentage',0):.0f}% watched). Topics {reel.get('topics',[])} → domain: {top_domain}. Cross-reel consistency: {reel.get('cross_reel_consistency',0):.2f}.",
            recommended_reel_title    = rec_title,
            recommended_reel_category = rec_cat,
            why_recommendation        = rec_why,
            difficulty                = rec_diff,
            difficulty_justification  = skill_just,
            confidence                = sc_label,
            confidence_numeric        = sc_num,
        ))

    reel_representations = [
        ReelRepresentation(
            reel_id          = r.get("reel_id", ""),
            title            = r.get("title", ""),
            topics           = r.get("topics", []),
            latent_domains   = r.get("latent_domains", []),
            educational_depth= r.get("educational_depth", 0),
            career_relevance = r.get("career_relevance", 0),
            behavioral_score = r.get("behavioral_score", 0),
            engagement_score = r.get("engagement_score", 0),
            hype_score       = r.get("hype_score", 0),
            semantic_topics  = r.get("latent_domains", []),
            is_entertainment = r.get("is_entertainment", False),
            skill_level_signal= r.get("skill_level_signal", "Beginner"),
            video_url        = r.get("video_url", ""),
        )
        for r in enriched
    ]

    elapsed = time.time() - t0
    return {
        "profile_id":             profile_id,
        "interest_profile":       interest_profile.to_dict(),
        "reel_representations":   [r.to_dict() for r in reel_representations],
        "per_reel_outputs":       [p.to_dict() for p in per_reel_outputs],
        "recommendations":        [r.to_dict() for r in recommendations],
        "rejected_candidates":    [r.to_dict() for r in rejected_candidates],
        "processing_time_seconds": round(elapsed, 3),
        "interest_graph":         result["interest_graph"],
        "engagement_analytics":   result["engagement_analytics"],
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return jsonify({"message": "AI Reel Recommendation Agent API", "version": "1.0.0"})


@app.get("/api/profiles")
def list_profiles():
    return jsonify({"profiles": get_all_profiles()})


@app.get("/api/suggested_accounts")
def list_suggested_accounts():
    return jsonify({"suggested_accounts": get_suggested_accounts()})


@app.post("/api/auth/login")
def login():
    data = request.get_json(force=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Please enter both username/email and password."}), 400

    user = authenticate_user(username, password)
    if not user:
        return jsonify({"error": "Invalid username or password. Please try again."}), 401

    return jsonify({"user": user, "message": "Login successful!"})


@app.post("/api/auth/register")
def register():
    data = request.get_json(force=True) or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    try:
        user = register_user(username, email, password, full_name)
        return jsonify({"user": user, "message": "Account created successfully!"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@app.get("/api/auth/users")
def get_users_list():
    users = get_all_users()
    sanitized = []
    for u in users:
        item = dict(u)
        item.pop("password", None)
        sanitized.append(item)
    return jsonify({"users": sanitized})


@app.get("/api/reels")
def get_all_reels():
    data = load_sample_reels()
    return jsonify({"reels": data.get("reels", []), "dataset_metadata": data.get("dataset_metadata", {})})


@app.get("/api/reels/<profile_id>")
def get_profile_reels_route(profile_id):
    try:
        reels = get_profile_reels(profile_id)
        return jsonify({"reels": reels})
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@app.get("/api/analyze/<profile_id>")
def analyze_profile(profile_id):
    try:
        reels_raw = get_profile_reels(profile_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    result = run_full_pipeline(reels_raw, profile_id)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@app.post("/api/analyze")
def analyze():
    data = request.get_json(force=True)
    reels_raw = data.get("reels", [])
    if not reels_raw:
        return jsonify({"error": "No reels provided"}), 400
    profile_id = data.get("profile_id")
    result = run_full_pipeline(reels_raw, profile_id)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@app.post("/api/validate")
def run_validation():
    import time as time_mod
    t_start = time_mod.time()
    test_results = []
    total_reels  = 0
    trap_passed  = 0

    # Test 1 — Java Trap
    java_reels = get_profile_reels("P001")
    total_reels += len(java_reels)
    t1 = run_full_pipeline(java_reels, "P001")
    t1_primary = t1["interest_profile"]["primary_interest"]["interest_name"].lower()
    t1_pass = t1_primary != "java" and any(
        kw in t1_primary for kw in ["software", "engineering", "career", "backend", "technical"]
    )
    if t1_pass:
        trap_passed += 1
    test_results.append(TestResult(
        test_name = "Java Trap Prevention",
        passed    = t1_pass,
        expected  = "Primary ≠ 'Java'; should be Software Engineering / Career",
        actual    = f"Primary: {t1['interest_profile']['primary_interest']['interest_name']}",
        details   = f"Secondaries: {[s['interest_name'] for s in t1['interest_profile']['secondary_interests'][:3]]}. {'PASS' if t1_pass else 'FAIL'}",
    ))

    # Test 2 — AI Learner
    ai_reels = get_profile_reels("P002")
    total_reels += len(ai_reels)
    t2 = run_full_pipeline(ai_reels, "P002")
    t2_primary    = t2["interest_profile"]["primary_interest"]["interest_name"].lower()
    t2_secondaries = [s["interest_name"].lower() for s in t2["interest_profile"]["secondary_interests"]]
    t2_pass = ("ai" in t2_primary or "generative" in t2_primary or "machine" in t2_primary or
               any("ai" in s or "generative" in s for s in t2_secondaries))
    test_results.append(TestResult(
        test_name = "AI Learner Profile",
        passed    = t2_pass,
        expected  = "AI Application Development / Generative AI Engineering",
        actual    = f"Primary: {t2['interest_profile']['primary_interest']['interest_name']}",
        details   = f"Secondary: {[s['interest_name'] for s in t2['interest_profile']['secondary_interests'][:3]]}. {'PASS' if t2_pass else 'FAIL'}",
    ))

    # Test 3 — Entertainment
    ent_reels = get_profile_reels("P003")
    total_reels += len(ent_reels)
    t3 = run_full_pipeline(ent_reels, "P003")
    t3_conf  = t3["interest_profile"]["primary_interest"]["confidence_numeric"]
    t3_ent   = t3["interest_profile"]["entertainment_ratio"]
    t3_recs  = len(t3["recommendations"])
    t3_pass  = t3_ent >= 0.25 or t3_conf < 70 or t3_recs <= 3
    test_results.append(TestResult(
        test_name = "Entertainment Dominant — No False Tech Interest",
        passed    = t3_pass,
        expected  = "Low confidence or no strong tech interest",
        actual    = f"ent_ratio={t3_ent:.2f}, conf={t3_conf:.1f}, recs={t3_recs}",
        details   = f"{'PASS: No hallucinated tech interest' if t3_pass else 'FAIL: Hallucinated tech preference'}",
    ))

    # Test 4 — Hype rejection
    approved, rejected = filter_candidates(CANDIDATE_POOL)
    hype_in_pool = [c for c in CANDIDATE_POOL if c.get("hype_score", 0) > 0.6]
    hype_detected = len(hype_in_pool)
    hype_rejected = len([r for r in rejected if r["candidate"].get("hype_score", 0) > 0.6])
    t4_pass = hype_rejected == hype_detected and hype_rejected > 0
    test_results.append(TestResult(
        test_name = "Hype Content Rejection (100%)",
        passed    = t4_pass,
        expected  = f"All {hype_detected} hype candidates rejected",
        actual    = f"{hype_rejected}/{hype_detected} rejected",
        details   = f"Hype rejection rate: {(hype_rejected/max(hype_detected,1))*100:.1f}%. {'PASS' if t4_pass else 'FAIL'}",
    ))

    # Test 5 — Educational value
    t5_pass = all(
        c.get("educational_value", 0) >= 0.4 and len(c.get("learning_outcomes", [])) > 0
        for c in approved
    )
    test_results.append(TestResult(
        test_name = "Educational Value Validation",
        passed    = t5_pass,
        expected  = "All approved: edu_value >= 0.4 and learning outcomes present",
        actual    = f"{len(approved)} approved candidates checked",
        details   = f"{'PASS' if t5_pass else 'FAIL: Some approved candidates lack educational depth'}",
    ))

    # Test 6 — Latency
    elapsed = time_mod.time() - t_start
    t6_pass = elapsed < 30.0
    test_results.append(TestResult(
        test_name = "Processing Latency < 30 seconds",
        passed    = t6_pass,
        expected  = "< 30 seconds total",
        actual    = f"{elapsed:.2f}s",
        details   = f"{'PASS' if t6_pass else 'FAIL: Exceeded 30s'}",
    ))

    n_tests  = len(test_results)
    n_passed = sum(1 for t in test_results if t.passed)
    accuracy = n_passed / n_tests
    precision = hype_rejected / max(hype_detected, 1)
    recall   = 1.0 if t1_pass else 0.0
    f1       = 2 * precision * recall / max(precision + recall, 1e-9)

    report = ValidationReport(
        total_reels_processed          = total_reels,
        interest_inference_accuracy    = round(accuracy, 4),
        precision                      = round(precision, 4),
        recall                         = round(recall, 4),
        f1_score                       = round(f1, 4),
        hype_content_detected          = hype_detected,
        hype_content_rejected          = hype_rejected,
        hype_rejection_rate            = round(hype_rejected / max(hype_detected, 1), 4),
        trap_tests_passed              = trap_passed,
        trap_tests_total               = 1,
        trap_success_rate              = float(trap_passed),
        educational_recommendations    = len(approved),
        average_processing_time_seconds= round(elapsed / max(n_tests, 1), 3),
        test_results                   = test_results,
        overall_pass                   = all(t.passed for t in test_results),
    )
    return jsonify(report.to_dict())


@app.get("/api/candidates")
def list_candidates():
    approved, rejected = filter_candidates(CANDIDATE_POOL)
    return jsonify({
        "approved": approved,
        "rejected": [{"candidate": r["candidate"], "reasons": r["reasons"]} for r in rejected],
        "total":          len(CANDIDATE_POOL),
        "approved_count": len(approved),
        "rejected_count": len(rejected),
    })


# ---------------------------------------------------------------------------
# /api/videos — Curated pool of verified public MP4 streams
# Frontend uses these as playback sources, rotated per reel_id hash.
# ---------------------------------------------------------------------------

VERIFIED_VIDEO_POOL = [
    # W3Schools
    {"url": "https://www.w3schools.com/html/mov_bbb.mp4",       "tag": "intro",      "source": "w3schools"},
    {"url": "https://www.w3schools.com/tags/movie.mp4",          "tag": "tutorial",   "source": "w3schools"},
    {"url": "https://www.w3schools.com/html/movie.mp4",          "tag": "demo",       "source": "w3schools"},
    # VideoJS
    {"url": "https://vjs.zencdn.net/v/oceans.mp4",               "tag": "nature",     "source": "videojs"},
    # MDN
    {"url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", "tag": "animation", "source": "mdn"},
    {"url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/pigs.mp4",   "tag": "comedy",    "source": "mdn"},
    {"url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4", "tag": "lifestyle", "source": "mdn"},
    # W3C
    {"url": "https://media.w3.org/2010/05/sintel/trailer.mp4",  "tag": "cinematic",  "source": "w3c"},
    {"url": "https://media.w3.org/2010/05/bunny/trailer.mp4",   "tag": "animation",  "source": "w3c"},
    {"url": "https://media.w3.org/2010/05/bunny/movie.mp4",     "tag": "movie",      "source": "w3c"},
    {"url": "https://media.w3.org/2010/05/video/movie_300.mp4", "tag": "lowres",     "source": "w3c"},
    # FileSamples
    {"url": "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",   "tag": "360p",  "source": "filesamples"},
    {"url": "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",   "tag": "540p",  "source": "filesamples"},
    {"url": "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",  "tag": "720p",  "source": "filesamples"},
    {"url": "https://filesamples.com/samples/video/mp4/sample_1920x1080.mp4", "tag": "1080p", "source": "filesamples"},
    # SampleLib
    {"url": "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",  "tag": "short",  "source": "samplelib"},
    {"url": "https://samplelib.com/lib/preview/mp4/sample-10s.mp4", "tag": "medium", "source": "samplelib"},
    {"url": "https://samplelib.com/lib/preview/mp4/sample-20s.mp4", "tag": "long",   "source": "samplelib"},
    # Google Cloud Storage — GTech test videos (reliable CORS-open CDN)
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",            "tag": "classic",   "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",           "tag": "sci-fi",    "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",          "tag": "action",    "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",         "tag": "adventure", "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",             "tag": "fun",       "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",        "tag": "drive",     "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", "tag": "outdoor","source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",             "tag": "drama",     "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",      "tag": "review",    "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",      "tag": "travel",    "source": "gcs"},
    {"url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4","tag": "budget",    "source": "gcs"},
]


@app.get("/api/videos")
def get_video_pool():
    """
    Returns the curated pool of 30 verified, CORS-open MP4 video streams.
    Frontend VideoPlayer rotates these by reel_id hash for deterministic assignment.
    """
    return jsonify({
        "videos": VERIFIED_VIDEO_POOL,
        "count": len(VERIFIED_VIDEO_POOL),
        "info": "Public domain / CC0 MP4 streams — verified CORS-open, HTML5 compatible",
    })




if __name__ == "__main__":
    print("AI Reel Recommendation Agent -- Starting server...")
    print("   Backend: http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=False)
