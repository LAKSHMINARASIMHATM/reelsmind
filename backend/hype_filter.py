"""
Hype/quality filter for the AI Reel Recommendation Agent.

Two-layer filtering:
  1. Keyword detection on title/description
  2. Metadata quality thresholds (educational_value, hype_score)
"""

from __future__ import annotations
from typing import List, Tuple
from scoring import HYPE_SCORE_THRESHOLD, EDUCATIONAL_VALUE_THRESHOLD


# ---------------------------------------------------------------------------
# Hype Keyword Blocklist
# ---------------------------------------------------------------------------

HYPE_KEYWORDS: List[str] = [
    "guaranteed",
    "guarantee",
    "get rich",
    "instant job",
    "secret",
    "secrets",
    "hack",
    "hacks",
    "100%",
    "make money",
    "overnight",
    "7 days",
    "7days",
    "24 hours",
    "24hours",
    "guaranteed placement",
    "life changing",
    "life-changing",
    "viral",
    "must know",
    "shocking",
    "earn money",
    "lakh per day",
    "lakh/day",
    "salary hike",
    "get a job fast",
    "fast track",
    "shortcut",
    "no experience needed",
    "no degree needed",
    "passive income",
    "ai millionaire",
    "become rich",
    "unlimited income",
    "click here",
    "watch before deleted",
]


# ---------------------------------------------------------------------------
# Filter Logic
# ---------------------------------------------------------------------------

def _detect_hype_keywords(text: str) -> List[str]:
    """Return list of hype keywords found in text (case-insensitive)."""
    text_lower = text.lower()
    return [kw for kw in HYPE_KEYWORDS if kw in text_lower]


def check_hype(
    candidate_id: str,
    title: str,
    description: str,
    educational_value: float,
    hype_score: float,
    learning_outcomes: list,
) -> Tuple[bool, List[str]]:
    """
    Returns (is_hype: bool, reasons: List[str]).

    A candidate is rejected if ANY of the following hold:
      - Title/description contains hype keywords
      - hype_score > HYPE_SCORE_THRESHOLD (0.60)
      - educational_value < EDUCATIONAL_VALUE_THRESHOLD (0.40)
      - No learning outcomes provided
    """
    reasons: List[str] = []

    # Layer 1 — Keyword detection
    title_hits = _detect_hype_keywords(title)
    desc_hits  = _detect_hype_keywords(description)
    all_hits   = list(set(title_hits + desc_hits))
    if all_hits:
        reasons.append(
            f"Hype keywords detected: {', '.join(all_hits)}"
        )

    # Layer 2 — Metadata quality
    if hype_score > HYPE_SCORE_THRESHOLD:
        reasons.append(
            f"High hype score: {hype_score:.2f} > threshold {HYPE_SCORE_THRESHOLD}"
        )

    if educational_value < EDUCATIONAL_VALUE_THRESHOLD:
        reasons.append(
            f"Insufficient educational value: {educational_value:.2f} < threshold {EDUCATIONAL_VALUE_THRESHOLD}"
        )

    if not learning_outcomes:
        reasons.append("Missing learning outcomes — cannot verify educational depth")

    return len(reasons) > 0, reasons


def filter_candidates(candidates: list) -> Tuple[list, list]:
    """
    Separate candidates into (approved, rejected).
    
    Each candidate must have: candidate_id, title, educational_value,
    hype_score, learning_outcomes attributes/keys.
    """
    approved = []
    rejected = []

    for c in candidates:
        # Support both dict and object access
        if isinstance(c, dict):
            cid    = c.get("candidate_id", "")
            title  = c.get("title", "")
            desc   = c.get("description", "")
            ev     = c.get("educational_value", 0.0)
            hs     = c.get("hype_score", 0.0)
            lo     = c.get("learning_outcomes", [])
        else:
            cid    = getattr(c, "candidate_id", "")
            title  = getattr(c, "title", "")
            desc   = getattr(c, "description", "")
            ev     = getattr(c, "educational_value", 0.0)
            hs     = getattr(c, "hype_score", 0.0)
            lo     = getattr(c, "learning_outcomes", [])

        is_hype, reasons = check_hype(cid, title, desc, ev, hs, lo)
        if is_hype:
            rejected.append({"candidate": c, "reasons": reasons})
        else:
            approved.append(c)

    return approved, rejected
