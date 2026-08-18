"""
Interest Graph and Latent Interest Inference Engine.

This is the core of the system's intelligence. Instead of keyword matching,
we use a hierarchical ontology to map surface-level topics to latent domains,
then aggregate across all Reels to identify the highest-level coherent interest.

KEY DESIGN: The Java Trap Prevention mechanism ensures that a student watching
Java memes + career content + interview jokes + laptop comparisons is correctly
classified as interested in "Software Engineering / Technology Career Development"
rather than simply "Java".
"""

from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict
import math


# ---------------------------------------------------------------------------
# Interest Ontology Graph
# ---------------------------------------------------------------------------
# Structure: topic → [latent_domains]
# Each topic maps to one or more higher-level domains.
# The system aggregates domain evidence across all Reels to find the
# strongest latent interest.

TOPIC_TO_DOMAINS: Dict[str, List[str]] = {
    # Java / JVM ecosystem
    "java":                      ["Programming", "Backend Software Engineering", "Software Engineering"],
    "nullpointerexception":      ["Programming", "Backend Software Engineering"],
    "jvm":                       ["Backend Software Engineering", "Programming"],
    "spring":                    ["Backend Software Engineering", "Programming"],
    "spring boot":               ["Backend Software Engineering", "Programming"],

    # Programming / General
    "programming":               ["Programming", "Software Engineering"],
    "coding":                    ["Programming", "Software Engineering"],
    "debugging":                 ["Programming", "Software Engineering"],
    "software development":      ["Software Engineering", "Programming"],
    "backend":                   ["Backend Software Engineering", "Software Engineering"],
    "frontend":                  ["Software Engineering", "Programming"],
    "fullstack":                 ["Software Engineering", "Programming"],

    # Software Engineering (Broad)
    "software engineering":      ["Software Engineering", "Technology Career Development"],
    "developer lifestyle":       ["Technology Career Development", "Software Engineering"],
    "tech company":              ["Technology Career Development", "Software Engineering"],
    "work life":                 ["Technology Career Development"],
    "productivity":              ["Technology Career Development", "Developer Productivity"],
    "pair programming":          ["Software Engineering", "Programming"],
    "code review":               ["Software Engineering", "Programming"],

    # Career Development
    "career":                    ["Technology Career Development", "Software Engineering"],
    "career development":        ["Technology Career Development"],
    "tech career":               ["Technology Career Development"],
    "job":                       ["Technology Career Development"],
    "internship":                ["Technology Career Development"],
    "placement":                 ["Technology Career Development"],
    "resume":                    ["Technology Career Development"],
    "linkedin":                  ["Technology Career Development"],

    # DSA / Interview Prep
    "coding interview":          ["Technical Interview Preparation", "Technology Career Development"],
    "leetcode":                  ["Technical Interview Preparation", "DSA"],
    "dsa":                       ["DSA", "Technical Interview Preparation"],
    "data structures":           ["DSA", "Technical Interview Preparation"],
    "algorithms":                ["DSA", "Technical Interview Preparation"],
    "technical interview":       ["Technical Interview Preparation", "Technology Career Development"],
    "interview":                 ["Technical Interview Preparation", "Technology Career Development"],
    "competitive programming":   ["DSA", "Technical Interview Preparation"],

    # System Design / HLD
    "system design":             ["System Design", "Backend Software Engineering", "Software Engineering"],
    "hld":                       ["System Design", "Backend Software Engineering"],
    "lld":                       ["System Design", "Software Engineering"],
    "load balancer":             ["System Design", "Cloud Infrastructure", "Backend Software Engineering"],
    "api gateway":               ["System Design", "Backend Software Engineering"],
    "microservices":             ["System Design", "Backend Software Engineering"],
    "distributed systems":       ["System Design", "Backend Software Engineering"],
    "scalability":               ["System Design", "Backend Software Engineering"],

    # Backend / Infrastructure
    "database":                  ["Backend Software Engineering", "System Design"],
    "redis":                     ["Backend Software Engineering", "System Design"],
    "cache":                     ["Backend Software Engineering", "System Design"],
    "sql":                       ["Backend Software Engineering", "Programming"],
    "nosql":                     ["Backend Software Engineering", "System Design"],
    "api":                       ["Backend Software Engineering", "Software Engineering"],
    "rest":                      ["Backend Software Engineering", "Software Engineering"],
    "graphql":                   ["Backend Software Engineering", "Software Engineering"],

    # Cloud
    "cloud":                     ["Cloud Infrastructure", "Backend Software Engineering"],
    "aws":                       ["Cloud Infrastructure"],
    "azure":                     ["Cloud Infrastructure"],
    "gcp":                       ["Cloud Infrastructure"],
    "docker":                    ["Cloud Infrastructure", "Backend Software Engineering"],
    "kubernetes":                ["Cloud Infrastructure", "System Design"],
    "devops":                    ["Cloud Infrastructure", "Software Engineering"],
    "ci/cd":                     ["Cloud Infrastructure", "Software Engineering"],

    # AI / ML
    "ai":                        ["AI Application Development", "AI Engineering"],
    "machine learning":          ["AI Engineering", "AI Application Development"],
    "deep learning":             ["AI Engineering"],
    "llm":                       ["Generative AI Engineering", "AI Application Development"],
    "rag":                       ["Generative AI Engineering", "AI Application Development"],
    "retrieval augmented generation": ["Generative AI Engineering", "AI Application Development"],
    "vector embeddings":         ["Generative AI Engineering", "AI Engineering"],
    "generative ai":             ["Generative AI Engineering", "AI Application Development"],
    "nlp":                       ["AI Engineering", "AI Application Development"],
    "transformers":              ["AI Engineering", "Generative AI Engineering"],
    "neural networks":           ["AI Engineering"],
    "pytorch":                   ["AI Engineering"],
    "tensorflow":                ["AI Engineering"],
    "ai tools":                  ["AI Application Development"],  # Surface level only

    # Cybersecurity
    "cybersecurity":             ["Cybersecurity Engineering"],
    "network security":          ["Cybersecurity Engineering"],
    "ethical hacking":           ["Cybersecurity Engineering"],
    "penetration testing":       ["Cybersecurity Engineering"],
    "authentication":            ["Cybersecurity Engineering", "Backend Software Engineering"],
    "web security":              ["Cybersecurity Engineering", "Backend Software Engineering"],
    "encryption":                ["Cybersecurity Engineering"],
    "owasp":                     ["Cybersecurity Engineering"],

    # Developer Hardware
    "laptop":                    ["Developer Hardware Selection", "Developer Productivity"],
    "macbook":                   ["Developer Hardware Selection", "Developer Productivity"],
    "thinkpad":                  ["Developer Hardware Selection", "Developer Productivity"],
    "developer hardware":        ["Developer Hardware Selection", "Developer Productivity"],
    "hardware":                  ["Developer Hardware Selection"],
    "monitor":                   ["Developer Hardware Selection", "Developer Productivity"],
    "mechanical keyboard":       ["Developer Hardware Selection", "Developer Productivity"],
    "asus rog":                  ["Developer Hardware Selection"],
    "gaming laptop":             ["Developer Hardware Selection"],

    # Developer Productivity Tools
    "vim":                       ["Developer Productivity", "Programming"],
    "vs code":                   ["Developer Productivity", "Programming"],
    "ide":                       ["Developer Productivity", "Programming"],
    "terminal":                  ["Developer Productivity", "Programming"],
    "linux":                     ["Developer Productivity", "Software Engineering"],
    "git":                       ["Developer Productivity", "Software Engineering"],

    # Entertainment / Gaming (non-tech)
    "gaming":                    ["Entertainment"],
    "valorant":                  ["Entertainment"],
    "esports":                   ["Entertainment"],
    "fps game":                  ["Entertainment"],
    "competitive gaming":        ["Entertainment"],
    "meme":                      ["Entertainment"],
    "comedy":                    ["Entertainment"],
    "music":                     ["Entertainment"],
    "celebrity":                 ["Entertainment"],

    # Hype / Listicle (surface level)
    "job guarantee":             [],  # No valid domain
    "get rich":                  [],
    "money making":              [],
    "overnight learning":        [],
    "ai prompts":                ["AI Application Development"],  # Low depth
}


# ---------------------------------------------------------------------------
# Domain Hierarchy
# ---------------------------------------------------------------------------
# Maps each domain to a parent super-domain for clustering.
# Used to detect when multiple domains point to the same super-domain.

DOMAIN_HIERARCHY: Dict[str, str] = {
    "Programming":                   "Software Engineering",
    "Backend Software Engineering":  "Software Engineering",
    "Technical Interview Preparation": "Software Engineering",
    "DSA":                           "Software Engineering",
    "System Design":                 "Software Engineering",
    "Developer Productivity":        "Software Engineering",
    "Technology Career Development": "Software Engineering",
    "AI Application Development":    "AI Engineering",
    "Generative AI Engineering":     "AI Engineering",
    "Cloud Infrastructure":          "Software Engineering",
    "Cybersecurity Engineering":     "Cybersecurity",
    "Developer Hardware Selection":  "Software Engineering",
    "Entertainment":                 "Entertainment",
    "Software Engineering":          "Software Engineering",
    "AI Engineering":                "AI Engineering",
    "Cybersecurity":                 "Cybersecurity",
}


# Entertainment topics that should NOT be counted as tech interest
ENTERTAINMENT_TOPICS: Set[str] = {
    "gaming", "valorant", "esports", "fps game", "competitive gaming",
    "meme", "comedy", "music", "celebrity", "entertainment", "humor",
}


# ---------------------------------------------------------------------------
# Interest Graph Node
# ---------------------------------------------------------------------------

class InterestNode:
    """Represents a node in the interest graph."""
    def __init__(self, name: str):
        self.name = name
        self.score: float = 0.0
        self.supporting_reels: List[str] = []
        self.contributing_signals: Dict[str, float] = defaultdict(float)
        self.children: List[str] = []

    def add_evidence(self, reel_id: str, score: float, signals: Dict[str, float]):
        self.score += score
        if reel_id not in self.supporting_reels:
            self.supporting_reels.append(reel_id)
        for sig, val in signals.items():
            self.contributing_signals[sig] += val


# ---------------------------------------------------------------------------
# Interest Inference Engine
# ---------------------------------------------------------------------------

class LatentInterestInferenceEngine:
    """
    Core inference engine.

    Pipeline:
    1. For each Reel, map topics → latent domains (via TOPIC_TO_DOMAINS)
    2. Compute behavioral score for each Reel
    3. Accumulate domain evidence weighted by behavioral score
    4. Detect super-domain clustering (Java Trap prevention)
    5. Normalize and rank interests
    6. Generate behavioral evidence summaries
    """

    def __init__(self):
        self.domain_nodes: Dict[str, InterestNode] = {}
        self.super_domain_scores: Dict[str, float] = defaultdict(float)
        self._reset()

    def _reset(self):
        self.domain_nodes = {}
        self.super_domain_scores = defaultdict(float)
        self._all_reels_behavioral_scores: List[float] = []

    def _get_or_create_node(self, domain: str) -> InterestNode:
        if domain not in self.domain_nodes:
            self.domain_nodes[domain] = InterestNode(domain)
        return self.domain_nodes[domain]

    def _map_topics_to_domains(self, topics: List[str]) -> Dict[str, float]:
        """
        Map a list of topics to domain scores.
        Topics that map to multiple domains distribute weight equally.
        Entertainment topics are tagged but given near-zero domain weight.
        """
        domain_hits: Dict[str, float] = defaultdict(float)
        for topic in topics:
            topic_lower = topic.lower().strip()
            # Check entertainment
            if topic_lower in ENTERTAINMENT_TOPICS:
                domain_hits["Entertainment"] += 0.1
                continue
            domains = TOPIC_TO_DOMAINS.get(topic_lower, [])
            if domains:
                per_domain_weight = 1.0 / len(domains)
                for d in domains:
                    domain_hits[d] += per_domain_weight
        return dict(domain_hits)

    def _compute_cross_reel_consistency(
        self,
        reel_domains: List[Dict[str, float]],
        current_domains: Dict[str, float],
    ) -> float:
        """
        Measure how consistently the current Reel's domains appear
        across the other Reels. High consistency = stronger signal.
        """
        if len(reel_domains) < 2:
            return 0.5  # Neutral for first Reel
        other_domains: Set[str] = set()
        for rd in reel_domains:
            other_domains.update(rd.keys())
        current_set = set(current_domains.keys())
        overlap = current_set.intersection(other_domains - {"Entertainment"})
        if not current_set - {"Entertainment"}:
            return 0.0
        return len(overlap) / max(len(current_set - {"Entertainment"}), 1)

    def infer(
        self,
        reel_representations: List[dict],
    ) -> Dict[str, any]:
        """
        Main inference method.
        Input: list of {reel_id, topics, behavioral_score, signals, is_entertainment}
        Output: {domains, super_domains, top_interests, raw_scores, normalized_scores}
        """
        self._reset()

        all_reel_domains: List[Dict[str, float]] = []

        # First pass — map topics to domains for all Reels
        for rep in reel_representations:
            topics  = rep.get("topics", [])
            domains = self._map_topics_to_domains(topics)
            all_reel_domains.append(domains)

        # Second pass — accumulate weighted domain evidence
        for i, rep in enumerate(reel_representations):
            reel_id        = rep.get("reel_id", f"R{i}")
            behavioral_score = rep.get("behavioral_score", 0.5)
            signals        = rep.get("signals", {})
            is_entertainment = rep.get("is_entertainment", False)
            current_domains  = all_reel_domains[i]

            # Cross-Reel consistency
            other_domains = all_reel_domains[:i] + all_reel_domains[i+1:]
            cross_consistency = self._compute_cross_reel_consistency(
                other_domains, current_domains
            )

            # Discount entertainment Reels heavily
            entertain_weight = 0.15 if is_entertainment else 1.0

            for domain, domain_weight in current_domains.items():
                if domain == "Entertainment" and not is_entertainment:
                    continue
                effective_score = (
                    behavioral_score * domain_weight * entertain_weight
                )
                # Boost cross-Reel consistent signals
                if domain != "Entertainment":
                    effective_score *= (1.0 + cross_consistency * 0.3)

                node = self._get_or_create_node(domain)
                node.add_evidence(reel_id, effective_score, signals)

        # Third pass — aggregate to super-domains (Java Trap prevention)
        for domain, node in self.domain_nodes.items():
            super_domain = DOMAIN_HIERARCHY.get(domain, domain)
            self.super_domain_scores[super_domain] += node.score

        # Build sorted results
        raw_domain_scores = {
            d: n.score for d, n in self.domain_nodes.items()
            if d != "Entertainment"
        }
        raw_super_scores = dict(self.super_domain_scores)

        # Remove Entertainment from super if low
        if raw_super_scores.get("Entertainment", 0) < 0.3:
            raw_super_scores.pop("Entertainment", None)

        # Sort domains by score
        sorted_domains = sorted(
            raw_domain_scores.items(), key=lambda x: x[1], reverse=True
        )
        sorted_super  = sorted(
            raw_super_scores.items(), key=lambda x: x[1], reverse=True
        )

        # Normalize
        max_d = max((v for _, v in sorted_domains), default=1.0)
        max_s = max((v for _, v in sorted_super),  default=1.0)

        normalized_domains = {
            d: round((v / max_d) * 100, 2)
            for d, v in sorted_domains
        }
        normalized_super = {
            d: round((v / max_s) * 100, 2)
            for d, v in sorted_super
        }

        return {
            "domain_nodes":       self.domain_nodes,
            "sorted_domains":     sorted_domains,
            "sorted_super":       sorted_super,
            "normalized_domains": normalized_domains,
            "normalized_super":   normalized_super,
            "entertainment_only": self._is_entertainment_only(reel_representations),
        }

    def _is_entertainment_only(self, reel_representations: List[dict]) -> bool:
        """Return True if student shows no meaningful tech interest."""
        tech_scores = []
        for rep in reel_representations:
            if not rep.get("is_entertainment", False):
                tech_scores.append(rep.get("behavioral_score", 0))
        if not tech_scores:
            return True
        return sum(tech_scores) / len(tech_scores) < 0.20

    def get_interest_graph_data(self) -> dict:
        """Return interest graph structure for frontend visualization."""
        nodes = []
        edges = []
        seen_nodes = set()

        for domain, node in self.domain_nodes.items():
            if node.score < 0.05:
                continue
            if domain not in seen_nodes:
                nodes.append({
                    "id": domain,
                    "label": domain,
                    "score": round(node.score, 3),
                    "type": "domain",
                })
                seen_nodes.add(domain)

            # Super-domain
            super_d = DOMAIN_HIERARCHY.get(domain, domain)
            if super_d != domain and super_d not in seen_nodes:
                nodes.append({
                    "id": super_d,
                    "label": super_d,
                    "score": round(self.super_domain_scores.get(super_d, 0), 3),
                    "type": "super_domain",
                })
                seen_nodes.add(super_d)

            if super_d != domain:
                edges.append({"from": domain, "to": super_d})

            # Reel nodes
            for reel_id in node.supporting_reels:
                if reel_id not in seen_nodes:
                    nodes.append({"id": reel_id, "label": reel_id, "type": "reel"})
                    seen_nodes.add(reel_id)
                edges.append({"from": reel_id, "to": domain})

        return {"nodes": nodes, "edges": edges}


# ---------------------------------------------------------------------------
# Latent Interest Name Generator
# ---------------------------------------------------------------------------

INTEREST_DESCRIPTIONS = {
    "Software Engineering": (
        "Software Engineering / Technology Career Development",
        "Broad interest in the software engineering profession, career growth, "
        "and the daily realities of being a developer."
    ),
    "AI Engineering": (
        "AI Application Development / Generative AI Engineering",
        "Strong interest in building AI-powered applications, understanding LLM "
        "architectures, and working with modern AI frameworks."
    ),
    "Cybersecurity": (
        "Cybersecurity Engineering",
        "Focused interest in application security, network defense, ethical hacking, "
        "and secure software development practices."
    ),
    "Entertainment": (
        "Entertainment",
        "Primary consumption is entertainment content with no significant technology interest."
    ),
}

def get_interest_display_name(super_domain: str) -> Tuple[str, str]:
    """Return (display_name, description) for a super-domain."""
    if super_domain in INTEREST_DESCRIPTIONS:
        return INTEREST_DESCRIPTIONS[super_domain]
    return super_domain, f"Interest in {super_domain.lower()}."
