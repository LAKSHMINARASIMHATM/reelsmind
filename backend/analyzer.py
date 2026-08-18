"""
Content and Behavioral Analyzer for the AI Reel Recommendation Agent.

Responsibilities:
- Enrich each Reel with semantic domain mappings
- Compute per-Reel behavioral scores
- Detect entertainment vs. tech content
- Estimate educational depth and career relevance
- Generate aggregate engagement analytics
"""

from __future__ import annotations
from typing import List, Dict, Tuple, Any
from collections import defaultdict

from scoring import compute_behavioral_score, estimate_skill_level
from interest_engine import (
    TOPIC_TO_DOMAINS,
    ENTERTAINMENT_TOPICS,
    LatentInterestInferenceEngine,
    DOMAIN_HIERARCHY,
    get_interest_display_name,
)


# ---------------------------------------------------------------------------
# Semantic Domain Mapper
# ---------------------------------------------------------------------------

class ContentAnalyzer:
    """
    Maps Reel content to semantic domains.
    Does NOT rely on keyword matching for interest inference —
    uses the ontology graph to understand conceptual relationships.
    """

    def analyze(self, reel: dict) -> dict:
        """
        Enrich a raw Reel dict with:
        - latent_domains: semantic domains from topic ontology
        - educational_depth: inferred from educational_value + topic diversity
        - career_relevance: how much content relates to a tech career
        - is_entertainment: whether this is primarily non-tech content
        - skill_level_signal: what skill level this content targets
        """
        topics  = [t.lower().strip() for t in reel.get("topics", [])]
        edu_val = reel.get("educational_value", 0.0)
        hype    = reel.get("hype_score", 0.0)

        # Map topics to domains
        domain_hits: Dict[str, float] = defaultdict(float)
        for topic in topics:
            domains = TOPIC_TO_DOMAINS.get(topic, [])
            if domains:
                w = 1.0 / len(domains)
                for d in domains:
                    domain_hits[d] += w

        # Determine if entertainment-dominant
        entertainment_score = sum(
            1 for t in topics if t in ENTERTAINMENT_TOPICS
        ) / max(len(topics), 1)
        is_entertainment = entertainment_score > 0.5 or (
            domain_hits.get("Entertainment", 0) > sum(
                v for d, v in domain_hits.items() if d != "Entertainment"
            )
        )

        # Career relevance — how strongly topics map to career domains
        career_domains = {
            "Technology Career Development", "Technical Interview Preparation",
            "Software Engineering", "Backend Software Engineering",
        }
        career_score = sum(
            v for d, v in domain_hits.items() if d in career_domains
        ) / max(sum(domain_hits.values()), 1.0)
        career_score = min(1.0, career_score)

        # Educational depth — combination of metadata + topic richness
        unique_tech_topics = len([t for t in topics if t not in ENTERTAINMENT_TOPICS])
        topic_richness = min(1.0, unique_tech_topics / 5.0)
        educational_depth = (edu_val * 0.7 + topic_richness * 0.3) * (1.0 - hype * 0.5)
        educational_depth = max(0.0, min(1.0, educational_depth))

        # Skill level signal from content type
        sys_design_keywords = {"system design", "hld", "distributed systems",
                               "microservices", "scalability", "load balancer"}
        advanced_keywords   = {"rag", "llm", "kubernetes", "ci/cd", "graphql",
                               "vector embeddings", "neural networks"}
        beginner_keywords   = {"meme", "humor", "comedy", "joke", "day in the life"}

        has_system_design = any(t in sys_design_keywords for t in topics)
        has_advanced      = any(t in advanced_keywords for t in topics)
        has_beginner      = any(t in beginner_keywords for t in topics)

        if has_system_design or (has_advanced and edu_val > 0.70):
            skill_signal = "Advanced"
        elif edu_val > 0.50 and not has_beginner:
            skill_signal = "Intermediate"
        else:
            skill_signal = "Beginner"

        latent_domains = [
            d for d, v in sorted(domain_hits.items(), key=lambda x: -x[1])
            if d != "Entertainment" and v > 0.1
        ][:5]

        return {
            "latent_domains":    latent_domains,
            "educational_depth": round(educational_depth, 3),
            "career_relevance":  round(career_score, 3),
            "is_entertainment":  is_entertainment,
            "skill_level_signal": skill_signal,
            "domain_hits":       dict(domain_hits),
        }


# ---------------------------------------------------------------------------
# Behavioral Analyzer
# ---------------------------------------------------------------------------

class BehaviorAnalyzer:
    """
    Computes behavioral scores from engagement metrics.
    Handles missing/invalid fields gracefully.
    """

    def analyze(
        self,
        reel: dict,
        semantic_relevance: float = 0.5,
        cross_reel_consistency: float = 0.5,
    ) -> dict:
        """
        Compute behavioral score for a single Reel.
        Returns signal breakdown and total score.
        """
        watch_pct   = float(reel.get("watch_percentage", 0))
        liked       = bool(reel.get("liked", False))
        shared      = bool(reel.get("shared", False))
        saved       = bool(reel.get("saved", False))
        commented   = bool(reel.get("commented", False))
        sentiment   = str(reel.get("comment_sentiment", "neutral"))
        rewatched   = bool(reel.get("rewatched", False))

        scores = compute_behavioral_score(
            watch_percentage=watch_pct,
            liked=liked,
            shared=shared,
            saved=saved,
            commented=commented,
            comment_sentiment=sentiment,
            rewatched=rewatched,
            semantic_relevance=semantic_relevance,
            cross_reel_consistency=cross_reel_consistency,
        )
        return scores


# ---------------------------------------------------------------------------
# Full Pipeline Analyzer
# ---------------------------------------------------------------------------

class ReelHistoryAnalyzer:
    """
    Orchestrates the full analysis pipeline for a student's Reel history.
    """

    def __init__(self):
        self.content_analyzer  = ContentAnalyzer()
        self.behavior_analyzer = BehaviorAnalyzer()
        self.interest_engine   = LatentInterestInferenceEngine()

    def analyze(self, reels: List[dict]) -> dict:
        """
        Full pipeline:
        1. Content analysis per Reel
        2. Initial semantic relevance estimation
        3. Behavioral scoring per Reel
        4. Interest inference across all Reels
        5. Skill level estimation
        6. Engagement analytics
        """
        if not reels:
            return self._empty_result()

        # Step 1 — Content analysis
        enriched: List[dict] = []
        for reel in reels:
            try:
                content_info = self.content_analyzer.analyze(reel)
                enriched.append({**reel, **content_info})
            except Exception as e:
                # Graceful handling of bad data
                enriched.append({
                    **reel,
                    "latent_domains": [],
                    "educational_depth": 0.0,
                    "career_relevance": 0.0,
                    "is_entertainment": True,
                    "skill_level_signal": "Beginner",
                    "domain_hits": {},
                    "_error": str(e),
                })

        # Step 2 — Estimate semantic relevance
        # Relevance of each Reel relative to the most common domains across all Reels
        all_domain_counts: Dict[str, int] = defaultdict(int)
        for r in enriched:
            for d in r.get("latent_domains", []):
                all_domain_counts[d] += 1
        total_reels = len(enriched)

        for r in enriched:
            reel_domains = set(r.get("latent_domains", []))
            if not reel_domains:
                r["semantic_relevance"] = 0.1
            else:
                # Jaccard-like overlap with dominant domains
                dominant = {d for d, c in all_domain_counts.items() if c >= total_reels * 0.4}
                overlap  = reel_domains.intersection(dominant)
                r["semantic_relevance"] = min(1.0, len(overlap) / max(len(reel_domains), 1) + 0.3)

        # Step 3 — Behavioral scoring (initial pass, no cross-reel yet)
        for r in enriched:
            scores = self.behavior_analyzer.analyze(
                r,
                semantic_relevance=r.get("semantic_relevance", 0.5),
                cross_reel_consistency=0.5,  # Placeholder
            )
            r["behavioral_signals"] = scores
            r["behavioral_score"]   = scores["total"]

        # Step 4 — Recompute cross-reel consistency and re-score
        reel_domains_list = [
            {d: 1.0 for d in r.get("latent_domains", [])} for r in enriched
        ]
        for i, r in enumerate(enriched):
            current_domains = reel_domains_list[i]
            other_domains   = reel_domains_list[:i] + reel_domains_list[i+1:]
            other_set: set  = set()
            for od in other_domains:
                other_set.update(od.keys())
            current_set = set(current_domains.keys()) - {"Entertainment"}
            if current_set:
                overlap = current_set.intersection(other_set)
                consistency = len(overlap) / len(current_set)
            else:
                consistency = 0.0

            scores = self.behavior_analyzer.analyze(
                r,
                semantic_relevance=r.get("semantic_relevance", 0.5),
                cross_reel_consistency=consistency,
            )
            r["behavioral_signals"] = scores
            r["behavioral_score"]   = scores["total"]
            r["cross_reel_consistency"] = consistency

        # Step 5 — Interest inference
        reel_reps = [
            {
                "reel_id":          r.get("reel_id", ""),
                "topics":           r.get("topics", []),
                "behavioral_score": r.get("behavioral_score", 0),
                "signals":          r.get("behavioral_signals", {}),
                "is_entertainment": r.get("is_entertainment", False),
            }
            for r in enriched
        ]
        inference_result = self.interest_engine.infer(reel_reps)

        # Step 6 — Skill level estimation
        tech_reels = [r for r in enriched if not r.get("is_entertainment", True)]
        avg_edu_val   = (
            sum(r.get("educational_value", 0) for r in tech_reels) / len(tech_reels)
            if tech_reels else 0.0
        )
        avg_watch_pct = (
            sum(r.get("watch_percentage", 0) for r in enriched) / len(enriched)
        )
        has_system_design = any(
            "System Design" in r.get("latent_domains", []) or
            "Backend Software Engineering" in r.get("latent_domains", [])
            for r in enriched
        )
        has_deep_content = avg_edu_val > 0.55
        has_only_memes   = all(
            r.get("is_entertainment", False) or r.get("educational_depth", 0) < 0.30
            for r in enriched
        )
        skill_level, skill_justification = estimate_skill_level(
            avg_edu_val, avg_watch_pct, has_deep_content,
            has_system_design, has_only_memes
        )

        # Step 7 — Engagement analytics
        analytics = self._build_engagement_analytics(enriched)

        return {
            "enriched_reels":     enriched,
            "inference_result":   inference_result,
            "skill_level":        skill_level,
            "skill_justification": skill_justification,
            "interest_graph":     self.interest_engine.get_interest_graph_data(),
            "engagement_analytics": analytics,
        }

    def _build_engagement_analytics(self, enriched: List[dict]) -> Dict[str, Any]:
        """Build analytics data for the dashboard charts."""
        return {
            "reels": [
                {
                    "reel_id":         r.get("reel_id", ""),
                    "title":           r.get("title", "")[:40] + "…"
                                       if len(r.get("title", "")) > 40 else r.get("title", ""),
                    "watch_percentage": r.get("watch_percentage", 0),
                    "liked":           int(r.get("liked", False)),
                    "shared":          int(r.get("shared", False)),
                    "saved":           int(r.get("saved", False)),
                    "rewatched":       int(r.get("rewatched", False)),
                    "commented":       int(r.get("commented", False)),
                    "engagement_score": r.get("engagement_score", 0),
                    "behavioral_score": round(r.get("behavioral_score", 0) * 100, 1),
                    "educational_value": r.get("educational_value", 0),
                    "is_entertainment": r.get("is_entertainment", False),
                }
                for r in enriched
            ],
            "summary": {
                "avg_watch_percentage": round(
                    sum(r.get("watch_percentage", 0) for r in enriched) / len(enriched), 1
                ),
                "total_likes":    sum(1 for r in enriched if r.get("liked")),
                "total_shares":   sum(1 for r in enriched if r.get("shared")),
                "total_saves":    sum(1 for r in enriched if r.get("saved")),
                "total_rewatches": sum(1 for r in enriched if r.get("rewatched")),
                "entertainment_count": sum(1 for r in enriched if r.get("is_entertainment")),
                "tech_count":     sum(1 for r in enriched if not r.get("is_entertainment")),
            },
        }

    def _empty_result(self) -> dict:
        return {
            "enriched_reels":     [],
            "inference_result":   {},
            "skill_level":        "Beginner",
            "skill_justification": "No Reels analyzed.",
            "interest_graph":     {"nodes": [], "edges": []},
            "engagement_analytics": {"reels": [], "summary": {}},
        }
