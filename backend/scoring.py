"""
Pure scoring functions for the AI Reel Recommendation Agent.
All formulas are deterministic and fully explainable.
"""

from __future__ import annotations
from typing import Dict


# ---------------------------------------------------------------------------
# Behavioral Signal Weights
# ---------------------------------------------------------------------------

BEHAVIORAL_WEIGHTS = {
    "semantic_relevance":    0.25,
    "watch_completion":      0.20,
    "rewatch":               0.15,
    "like":                  0.10,
    "share":                 0.10,
    "save":                  0.10,
    "comment":               0.05,
    "cross_reel_consistency": 0.05,
}

# ---------------------------------------------------------------------------
# Recommendation Score Weights
# ---------------------------------------------------------------------------

RECOMMENDATION_WEIGHTS = {
    "interest_alignment":   0.35,
    "educational_value":    0.20,
    "skill_progression":    0.15,
    "engagement_compat":    0.10,
    "novelty":              0.10,
    "content_quality":      0.10,
}

# ---------------------------------------------------------------------------
# Quality Thresholds
# ---------------------------------------------------------------------------

HYPE_SCORE_THRESHOLD       = 0.60   # Reject if hype_score > this
EDUCATIONAL_VALUE_THRESHOLD = 0.40  # Reject if educational_value < this


# ---------------------------------------------------------------------------
# Behavioral Scoring
# ---------------------------------------------------------------------------

def compute_watch_completion_score(watch_percentage: float) -> float:
    """
    Sigmoid-like scaling so that:
      < 30% → ~0.0  (scrolled past)
      50%   → ~0.3  (mild interest)
      80%   → ~0.7  (genuine interest)
      > 90% → ~1.0  (high interest)
    """
    p = watch_percentage / 100.0
    if p >= 0.90:
        return 1.0
    elif p >= 0.80:
        return 0.80 + (p - 0.80) * 2.0
    elif p >= 0.50:
        return 0.40 + (p - 0.50) * 1.33
    elif p >= 0.30:
        return 0.10 + (p - 0.30) * 1.5
    else:
        return p * 0.33


def compute_comment_signal(commented: bool, sentiment: str) -> float:
    """
    Positive comment → full signal.
    Neutral comment  → half signal.
    Negative comment → negative signal (reduces interest score).
    No comment       → 0.
    """
    if not commented:
        return 0.0
    sentiment_map = {"positive": 1.0, "neutral": 0.5, "negative": -0.5}
    return sentiment_map.get(sentiment, 0.0)


def compute_behavioral_score(
    watch_percentage: float,
    liked: bool,
    shared: bool,
    saved: bool,
    commented: bool,
    comment_sentiment: str,
    rewatched: bool,
    semantic_relevance: float,
    cross_reel_consistency: float,
) -> Dict[str, float]:
    """
    Compute per-signal scores and weighted total behavioral score.
    Returns a dict with per-component contributions and the total.
    """
    watch_score    = compute_watch_completion_score(watch_percentage)
    rewatch_score  = 1.0 if rewatched else 0.0
    like_score     = 1.0 if liked else 0.0
    share_score    = 1.0 if shared else 0.0
    save_score     = 1.0 if saved else 0.0
    comment_score  = compute_comment_signal(commented, comment_sentiment)
    semantic_score = max(0.0, min(1.0, semantic_relevance))
    cross_score    = max(0.0, min(1.0, cross_reel_consistency))

    w = BEHAVIORAL_WEIGHTS
    total = (
        w["semantic_relevance"]    * semantic_score +
        w["watch_completion"]      * watch_score +
        w["rewatch"]               * rewatch_score +
        w["like"]                  * like_score +
        w["share"]                 * share_score +
        w["save"]                  * save_score +
        w["comment"]               * comment_score +
        w["cross_reel_consistency"] * cross_score
    )
    total = max(0.0, min(1.0, total))

    return {
        "semantic_relevance":     semantic_score * w["semantic_relevance"],
        "watch_completion":       watch_score    * w["watch_completion"],
        "rewatch":                rewatch_score  * w["rewatch"],
        "like":                   like_score     * w["like"],
        "share":                  share_score    * w["share"],
        "save":                   save_score     * w["save"],
        "comment":                comment_score  * w["comment"],
        "cross_reel_consistency": cross_score    * w["cross_reel_consistency"],
        "total":                  total,
    }


# ---------------------------------------------------------------------------
# Interest Score Normalization
# ---------------------------------------------------------------------------

def normalize_interest_scores(raw_scores: Dict[str, float]) -> Dict[str, float]:
    """Normalize a dict of raw scores to 0–100 scale."""
    if not raw_scores:
        return {}
    max_val = max(raw_scores.values()) if raw_scores else 1.0
    if max_val == 0:
        return {k: 0.0 for k in raw_scores}
    return {k: round((v / max_val) * 100, 2) for k, v in raw_scores.items()}


# ---------------------------------------------------------------------------
# Recommendation Scoring
# ---------------------------------------------------------------------------

def compute_recommendation_score(
    interest_alignment: float,
    educational_value: float,
    skill_progression: float,
    engagement_compat: float,
    novelty: float,
    content_quality: float,
) -> float:
    """
    Weighted recommendation score → [0, 1].
    """
    w = RECOMMENDATION_WEIGHTS
    score = (
        w["interest_alignment"] * interest_alignment +
        w["educational_value"]  * educational_value  +
        w["skill_progression"]  * skill_progression  +
        w["engagement_compat"]  * engagement_compat  +
        w["novelty"]            * novelty            +
        w["content_quality"]    * content_quality
    )
    return round(max(0.0, min(1.0, score)), 4)


# ---------------------------------------------------------------------------
# Confidence Derivation
# ---------------------------------------------------------------------------

def derive_confidence(interest_score: float, num_supporting_reels: int) -> tuple[str, float]:
    """
    Derive confidence label and numeric value from score and evidence count.
    """
    numeric = min(100.0, interest_score * 0.7 + num_supporting_reels * 8)
    if numeric >= 75:
        return "High", round(numeric, 1)
    elif numeric >= 50:
        return "Medium", round(numeric, 1)
    else:
        return "Low", round(numeric, 1)


# ---------------------------------------------------------------------------
# Skill Level Estimation
# ---------------------------------------------------------------------------

def estimate_skill_level(
    avg_educational_value: float,
    avg_watch_percentage: float,
    has_deep_content: bool,
    has_system_design: bool,
    has_only_memes: bool,
) -> tuple[str, str]:
    """
    Estimate skill level from behavioral evidence.
    Returns (level, justification).
    """
    if has_system_design and avg_educational_value > 0.70:
        return "Advanced", (
            "Engagement with system design and high-educational-value content "
            "indicates advanced understanding."
        )
    elif avg_educational_value > 0.50 and avg_watch_percentage > 75 and not has_only_memes:
        return "Intermediate", (
            "Moderate educational engagement and solid watch completion rates "
            "suggest an intermediate learner actively building skills."
        )
    elif has_deep_content and avg_watch_percentage > 70:
        return "Intermediate", (
            "Some deep-content engagement present alongside entertainment, "
            "indicating an emerging intermediate learner."
        )
    else:
        return "Beginner", (
            "Content mix leans toward memes, entertainment, and surface-level tech "
            "content, typical of a beginner exploring the field."
        )
