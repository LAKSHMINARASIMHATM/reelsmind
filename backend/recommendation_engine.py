"""
Recommendation Engine for the AI Reel Recommendation Agent.

Responsibilities:
- Maintain candidate educational Reel pool
- Filter hype/clickbait content using HypeFilter
- Compute candidate-to-student alignment scores
- Apply skill level progression scoring
- Enforce diversity (prevent over-recommendation of one category)
- Generate transparent human-readable explanations
"""

from __future__ import annotations
from typing import List, Dict, Tuple, Any

from scoring import compute_recommendation_score
from interest_engine import DOMAIN_HIERARCHY, get_interest_display_name
from hype_filter import filter_candidates


# ---------------------------------------------------------------------------
# 25 Strictly Tech, Java & Software Engineering Educational Candidate Pool
# ---------------------------------------------------------------------------

CANDIDATE_POOL = [
    # ─── Java & Spring Boot Engineering ─────────────────────────────────────
    {
        "candidate_id": "C001",
        "title": "Java 21 Virtual Threads (Project Loom) Architecture & Throughput Benchmarks",
        "description": "How Java 21 Virtual Threads eliminate OS thread blocking and allow Spring Boot 3 applications to handle 1,000,000 concurrent sockets effortlessly.",
        "category": "Java",
        "topics": ["java", "java21", "virtual threads", "concurrency", "spring boot", "backend", "software engineering"],
        "difficulty": "Intermediate",
        "educational_value": 0.97,
        "engagement_potential": 0.88,
        "hype_score": 0.02,
        "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "learning_outcomes": [
            {"outcome": "Understand Java 21 Virtual Threads vs OS Platform Threads"},
            {"outcome": "Configure Spring Boot 3 Tomcat connector for Virtual Threads"},
            {"outcome": "Avoid ThreadLocal pinning in synchronized blocks"},
        ],
        "domains": ["Software Engineering", "Backend Software Engineering", "Technology Career Development"],
    },
    {
        "candidate_id": "C002",
        "title": "JVM Memory Internals: Heap, Metaspace, Stack & ZGC Garbage Collector",
        "description": "Deep-dive into Java virtual machine memory layout, GC pause times, and ZGC concurrent thread scanning.",
        "category": "Java",
        "topics": ["java", "jvm", "garbage collection", "memory management", "backend", "software engineering"],
        "difficulty": "Advanced",
        "educational_value": 0.96,
        "engagement_potential": 0.85,
        "hype_score": 0.01,
        "video_url": "https://vjs.zencdn.net/v/oceans.mp4",
        "learning_outcomes": [
            {"outcome": "Analyze JVM Heap vs Metaspace memory allocation"},
            {"outcome": "Tune ZGC flags for sub-millisecond GC pause targets"},
        ],
        "domains": ["Software Engineering", "Backend Software Engineering"],
    },
    {
        "candidate_id": "C003",
        "title": "Spring Boot 3 OAuth2 & JWT Token Security Architecture",
        "description": "Building production security filters, token validation chains, and stateless authentication in Spring Boot.",
        "category": "Java",
        "topics": ["java", "spring boot", "jwt", "security", "backend", "software engineering"],
        "difficulty": "Intermediate",
        "educational_value": 0.94,
        "engagement_potential": 0.86,
        "hype_score": 0.02,
        "video_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        "learning_outcomes": [
            {"outcome": "Implement Spring Security 6 SecurityFilterChain bean"},
            {"outcome": "Verify signed JWT claims and handle refresh token rotation"},
        ],
        "domains": ["Software Engineering", "Backend Software Engineering"],
    },
    {
        "candidate_id": "C004",
        "title": "ConcurrentHashMap Internals: Lock-Free Node Bucket CAS Operations",
        "description": "How ConcurrentHashMap achieves high-concurrency thread safety without coarse-grained synchronized locks.",
        "category": "Java",
        "topics": ["java", "concurrency", "multithreading", "data structures", "software engineering"],
        "difficulty": "Advanced",
        "educational_value": 0.95,
        "engagement_potential": 0.84,
        "hype_score": 0.02,
        "video_url": "https://www.w3schools.com/tags/movie.mp4",
        "learning_outcomes": [
            {"outcome": "Understand Compare-And-Swap (CAS) instructions in Java"},
            {"outcome": "Analyze bucket-level synchronized locks in ConcurrentHashMap"},
        ],
        "domains": ["Software Engineering", "Technical Interview Preparation"],
    },

    # ─── System Design & Software Architecture ──────────────────────────────
    {
        "candidate_id": "C005",
        "title": "How a Backend Request Travels Through Load Balancer, API Gateway, Cache & DB",
        "description": "Complete system design walkthrough covering load balancing algorithms, API gateway patterns, Redis caching strategies, and database connection pooling.",
        "category": "System Design",
        "topics": ["system design", "backend", "load balancer", "api gateway", "database", "redis", "hld", "software engineering"],
        "difficulty": "Intermediate",
        "educational_value": 0.97,
        "engagement_potential": 0.89,
        "hype_score": 0.02,
        "video_url": "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "learning_outcomes": [
            {"outcome": "Understand how HTTP requests flow through production infrastructure"},
            {"outcome": "Learn load balancing algorithms (Round Robin, Least Connections)"},
            {"outcome": "Understand Redis caching layers and cache invalidation strategies"},
        ],
        "domains": ["System Design", "Backend Software Engineering", "Software Engineering"],
    },
    {
        "candidate_id": "C006",
        "title": "Designing Twitter's Timeline: Fanout on Write vs Fanout on Read Trade-offs",
        "description": "Real-world system design of Twitter's home timeline, comparing fanout-on-write and fanout-on-read approaches with trade-off analysis.",
        "category": "System Design",
        "topics": ["system design", "twitter", "hld", "distributed systems", "scalability", "database"],
        "difficulty": "Advanced",
        "educational_value": 0.96,
        "engagement_potential": 0.87,
        "hype_score": 0.02,
        "video_url": "https://media.w3.org/2010/05/bunny/trailer.mp4",
        "learning_outcomes": [
            {"outcome": "Understand fanout-on-write and fanout-on-read trade-offs"},
            {"outcome": "Learn how to design systems at Twitter-scale"},
            {"outcome": "Understand eventual consistency in distributed feed systems"},
        ],
        "domains": ["System Design", "Backend Software Engineering"],
    },
    {
        "candidate_id": "C007",
        "title": "Distributed Rate Limiter Design: Token Bucket Algorithm with Redis",
        "description": "Designing high-scale rate limiters using Redis sliding window and token bucket algorithms for API protection.",
        "category": "System Design",
        "topics": ["system design", "rate limiter", "redis", "algorithms", "hld", "software engineering"],
        "difficulty": "Intermediate",
        "educational_value": 0.95,
        "engagement_potential": 0.86,
        "hype_score": 0.02,
        "video_url": "https://media.w3.org/2010/05/video/movie_300.mp4",
        "learning_outcomes": [
            {"outcome": "Implement Token Bucket and Leaky Bucket algorithms"},
            {"outcome": "Design a distributed rate limiter with Redis atomic Lua scripts"},
        ],
        "domains": ["System Design", "Backend Software Engineering"],
    },
    {
        "candidate_id": "C008",
        "title": "SOLID Design Principles: Refactoring Legacy Code into Modular Architecture",
        "description": "Practical application of Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion in Java/Python.",
        "category": "Software Engineering",
        "topics": ["solid principles", "clean code", "design patterns", "software engineering", "refactoring"],
        "difficulty": "Beginner",
        "educational_value": 0.94,
        "engagement_potential": 0.88,
        "hype_score": 0.03,
        "video_url": "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
        "learning_outcomes": [
            {"outcome": "Identify code smells and tightly coupled classes"},
            {"outcome": "Apply Dependency Injection to decouple business logic"},
        ],
        "domains": ["Software Engineering", "Technology Career Development"],
    },

    # ─── Backend & Database Engineering ─────────────────────────────────────
    {
        "candidate_id": "C009",
        "title": "PostgreSQL Query Optimization: Reading EXPLAIN ANALYZE Execution Plans",
        "description": "How to inspect query execution plans, identify sequential table scans, and build composite B-Tree indexes in PostgreSQL.",
        "category": "Backend",
        "topics": ["postgres", "sql", "database", "backend", "performance optimization", "indexing"],
        "difficulty": "Intermediate",
        "educational_value": 0.95,
        "engagement_potential": 0.85,
        "hype_score": 0.02,
        "video_url": "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
        "learning_outcomes": [
            {"outcome": "Read PostgreSQL query execution plans using EXPLAIN ANALYZE"},
            {"outcome": "Eliminate expensive Sequential Scans with B-Tree indexes"},
        ],
        "domains": ["Backend Software Engineering", "System Design"],
    },
    {
        "candidate_id": "C010",
        "title": "Python AsyncIO vs Threading: Handling 10,000 Concurrent Connections in FastAPI",
        "description": "Benchmark comparison of Python AsyncIO event loop vs Multithreading for high-concurrency I/O bound web applications.",
        "category": "Backend",
        "topics": ["python", "asyncio", "concurrency", "backend", "fastapi", "performance"],
        "difficulty": "Intermediate",
        "educational_value": 0.93,
        "engagement_potential": 0.88,
        "hype_score": 0.03,
        "video_url": "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
        "learning_outcomes": [
            {"outcome": "Master Python async/await syntax and event loop mechanics"},
            {"outcome": "Avoid blocking the event loop with synchronous calls"},
        ],
        "domains": ["Backend Software Engineering"],
    },
    {
        "candidate_id": "C011",
        "title": "Database ACID Transactions & Isolation Levels: Read Committed vs Serializable",
        "description": "Understanding dirty reads, non-repeatable reads, phantom reads, and write skew under different SQL isolation levels.",
        "category": "Backend",
        "topics": ["database", "acid", "transactions", "sql", "backend", "software engineering"],
        "difficulty": "Advanced",
        "educational_value": 0.96,
        "engagement_potential": 0.83,
        "hype_score": 0.01,
        "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "learning_outcomes": [
            {"outcome": "Analyze transaction isolation anomalies (dirty reads, phantom reads)"},
            {"outcome": "Choose serializable isolation for financial database systems"},
        ],
        "domains": ["Backend Software Engineering"],
    },

    # ─── Data Structures & Algorithms / Interviews ─────────────────────────
    {
        "candidate_id": "C012",
        "title": "Two Pointers and Sliding Window: Solving 80% of Array Interview Problems",
        "description": "Master two core patterns that solve 80% of array interview problems. Covers time complexity analysis, pattern recognition, and 5 classic problems.",
        "category": "DSA",
        "topics": ["dsa", "algorithms", "two pointers", "sliding window", "coding interview", "leetcode"],
        "difficulty": "Beginner",
        "educational_value": 0.94,
        "engagement_potential": 0.89,
        "hype_score": 0.03,
        "video_url": "https://vjs.zencdn.net/v/oceans.mp4",
        "learning_outcomes": [
            {"outcome": "Master the two-pointer technique for sorted array problems"},
            {"outcome": "Understand sliding window pattern for substring/subarray problems"},
        ],
        "domains": ["DSA", "Technical Interview Preparation"],
    },
    {
        "candidate_id": "C013",
        "title": "Dynamic Programming Masterclass: 5-Step Framework to Solve DP Problems",
        "description": "Step-by-step breakdown of top-down memoization vs bottom-up tabulation with recurrence relation derivations.",
        "category": "DSA",
        "topics": ["dsa", "dynamic programming", "leetcode", "algorithms", "coding interview"],
        "difficulty": "Intermediate",
        "educational_value": 0.96,
        "engagement_potential": 0.85,
        "hype_score": 0.02,
        "video_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        "learning_outcomes": [
            {"outcome": "Identify overlapping subproblems and optimal substructure"},
            {"outcome": "Convert recursive top-down solutions to iterative DP tables"},
        ],
        "domains": ["DSA", "Technical Interview Preparation"],
    },
    {
        "candidate_id": "C014",
        "title": "LRU Cache Implementation: Doubly Linked List + HashMap in O(1) Time",
        "description": "Combining doubly linked lists for node ordering and hash maps for instant key lookups.",
        "category": "DSA",
        "topics": ["dsa", "lru cache", "data structures", "leetcode", "coding interview"],
        "difficulty": "Intermediate",
        "educational_value": 0.96,
        "engagement_potential": 0.87,
        "hype_score": 0.02,
        "video_url": "https://www.w3schools.com/tags/movie.mp4",
        "learning_outcomes": [
            {"outcome": "Implement O(1) get and put operations in an LRU Cache"},
            {"outcome": "Manage head and tail sentinel nodes in a doubly linked list"},
        ],
        "domains": ["DSA", "Technical Interview Preparation"],
    },

    # ─── AI, LLMs & Cloud Tech ───────────────────────────────────────────────
    {
        "candidate_id": "C015",
        "title": "How RAG Systems Retrieve Documents Before Generating an LLM Answer",
        "description": "Complete technical walkthrough of Retrieval-Augmented Generation: vector embeddings, FAISS similarity search, chunking strategies, and why retrieval improves domain-specific LLM accuracy.",
        "category": "AI",
        "topics": ["rag", "retrieval augmented generation", "llm", "vector embeddings", "ai", "machine learning"],
        "difficulty": "Intermediate",
        "educational_value": 0.97,
        "engagement_potential": 0.88,
        "hype_score": 0.02,
        "video_url": "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "learning_outcomes": [
            {"outcome": "Understand retrieval-augmented generation end-to-end"},
            {"outcome": "Learn how vector embeddings encode semantic meaning"},
        ],
        "domains": ["Generative AI Engineering", "AI Application Development", "AI Engineering"],
    },
    {
        "candidate_id": "C016",
        "title": "Transformer Architecture Explained: Attention Is All You Need",
        "description": "Visual deep-dive into transformer architecture: self-attention mechanism, multi-head attention, positional encoding, and how BERT and GPT differ.",
        "category": "AI",
        "topics": ["transformers", "attention mechanism", "llm", "deep learning", "nlp", "ai"],
        "difficulty": "Advanced",
        "educational_value": 0.98,
        "engagement_potential": 0.82,
        "hype_score": 0.02,
        "video_url": "https://media.w3.org/2010/05/bunny/trailer.mp4",
        "learning_outcomes": [
            {"outcome": "Understand self-attention and why it replaced RNNs"},
            {"outcome": "Learn multi-head attention and positional encoding"},
        ],
        "domains": ["AI Engineering", "Generative AI Engineering"],
    },
    {
        "candidate_id": "C017",
        "title": "Docker & Kubernetes Architecture: Control Plane, Containers & Pod Orchestration",
        "description": "Core concepts of containerization and Kubernetes orchestration: api-server, etcd, scheduler, and pod deployments.",
        "category": "Cloud",
        "topics": ["kubernetes", "docker", "cloud", "devops", "containers", "software engineering"],
        "difficulty": "Intermediate",
        "educational_value": 0.93,
        "engagement_potential": 0.85,
        "hype_score": 0.03,
        "video_url": "https://media.w3.org/2010/05/video/movie_300.mp4",
        "learning_outcomes": [
            {"outcome": "Understand Kubernetes control plane architecture"},
            {"outcome": "Write Dockerfiles and Kubernetes Deployment manifests"},
        ],
        "domains": ["Cloud Computing", "DevOps Engineering"],
    },

    # ─── HYPE candidates — should be REJECTED ────────────────────────────────
    {
        "candidate_id": "H_C001",
        "title": "10 AI Tools That Will Get You a Job Overnight — Guaranteed!",
        "description": "Instant career shortcuts using AI tools. No coding required. 100% guaranteed job placement.",
        "category": "AI Hype",
        "topics": ["ai tools", "job guarantee"],
        "difficulty": "Beginner",
        "educational_value": 0.04,
        "engagement_potential": 0.70,
        "hype_score": 0.97,
        "video_url": "https://media.w3.org/2010/05/video/movie_300.mp4",
        "learning_outcomes": [],
        "domains": [],
    },
    {
        "candidate_id": "H_C002",
        "title": "Become an AI Engineer in 7 Days — Secret Method Revealed",
        "description": "Shocking secret hack to become an AI engineer overnight with no experience needed.",
        "category": "AI Hype",
        "topics": ["ai", "overnight learning", "secret"],
        "difficulty": "Beginner",
        "educational_value": 0.03,
        "engagement_potential": 0.65,
        "hype_score": 0.99,
        "video_url": "https://media.w3.org/2010/05/video/movie_300.mp4",
        "learning_outcomes": [],
        "domains": [],
    },
]


# ---------------------------------------------------------------------------
# Recommendation Engine
# ---------------------------------------------------------------------------

class RecommendationEngine:
    """
    Generates, filters, scores, and ranks educational candidate Reels.
    Focused strictly on Software Engineering, Java, System Design, and Tech topics.
    """

    def recommend(
        self,
        interest_profile: Dict[str, Any],
        skill_level: str,
        already_seen_categories: List[str],
        top_n: int = 5,
    ) -> Tuple[List[dict], List[dict]]:
        """
        Returns (approved_recommendations, rejected_candidates).
        """
        top_domains   = interest_profile.get("top_domains", [])
        top_super     = interest_profile.get("top_super_domains", [])
        is_entertain  = interest_profile.get("entertainment_only", False)

        # Step 1 — Filter hype content
        approved_candidates, rejected_raw = filter_candidates(CANDIDATE_POOL)
        rejected = [
            {
                "candidate_id": r["candidate"]["candidate_id"],
                "title":        r["candidate"]["title"],
                "rejection_reasons": r["reasons"],
                "hype_score":   r["candidate"]["hype_score"],
                "educational_value": r["candidate"]["educational_value"],
            }
            for r in rejected_raw
        ]

        if is_entertain or not top_domains:
            return [], rejected

        # Step 2 — Score each approved candidate
        scored = []
        top_domain_names  = [d for d, _ in top_domains[:5]]
        top_super_names   = [d for d, _ in top_super[:3]]

        max_domain_score  = top_domains[0][1] if top_domains else 1.0

        seen_cats: Dict[str, int] = {}
        for cat in already_seen_categories:
            seen_cats[cat] = seen_cats.get(cat, 0) + 1

        for c in approved_candidates:
            c_domains = c.get("domains", [])
            c_cat     = c.get("category", "")
            c_diff    = c.get("difficulty", "Beginner")
            c_edu     = c.get("educational_value", 0.0)
            c_hype    = c.get("hype_score", 0.0)
            c_engage  = c.get("engagement_potential", 0.0)

            # -- Interest Alignment --
            alignment = 0.0
            for d in c_domains:
                for td, ts in top_domains[:8]:
                    if d == td:
                        alignment += (ts / max_domain_score) * 0.6
                    elif DOMAIN_HIERARCHY.get(d) == DOMAIN_HIERARCHY.get(td):
                        alignment += (ts / max_domain_score) * 0.3
                c_super = DOMAIN_HIERARCHY.get(d, d)
                for sd in top_super_names:
                    if c_super == sd:
                        alignment += 0.2
            alignment = min(1.0, alignment / max(len(c_domains), 1))

            # -- Skill Progression --
            skill_map = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
            student_lvl = skill_map.get(skill_level, 0)
            cand_lvl    = skill_map.get(c_diff, 0)
            diff        = abs(cand_lvl - student_lvl)
            if diff == 0:
                skill_prog = 1.0
            elif diff == 1:
                if cand_lvl > student_lvl:
                    skill_prog = 0.8
                else:
                    skill_prog = 0.5
            else:
                skill_prog = 0.2

            # -- Novelty --
            cat_freq = seen_cats.get(c_cat, 0)
            novelty  = max(0.2, 1.0 - cat_freq * 0.3)

            # -- Content Quality --
            content_quality = c_edu * (1.0 - c_hype * 0.5)
            content_quality = min(1.0, content_quality)

            final_score = compute_recommendation_score(
                interest_alignment = alignment,
                educational_value  = c_edu,
                skill_progression  = skill_prog,
                engagement_compat  = c_engage,
                novelty            = novelty,
                content_quality    = content_quality,
            )

            scored.append({
                **c,
                "interest_alignment":     alignment,
                "skill_progression_score": skill_prog,
                "novelty_score":          novelty,
                "content_quality_score":  content_quality,
                "final_score":            final_score,
            })

        # Step 3 — Sort by final score
        scored.sort(key=lambda x: x["final_score"], reverse=True)

        # Step 4 — Diversity enforcement (max 2 per category in top_n)
        diverse_top: List[dict] = []
        cat_count: Dict[str, int] = {}
        for c in scored:
            cat = c.get("category", "")
            if cat_count.get(cat, 0) >= 2:
                continue
            cat_count[cat] = cat_count.get(cat, 0) + 1
            diverse_top.append(c)
            if len(diverse_top) >= top_n:
                break

        # Step 5 — Generate explanations
        for rank, c in enumerate(diverse_top, 1):
            c["why_recommended"] = self._generate_explanation(
                c, rank, top_domains, top_super_names, skill_level
            )

        return diverse_top, rejected

    def _generate_explanation(
        self,
        c: dict,
        rank: int,
        top_domains: List[Tuple[str, float]],
        top_super: List[str],
        skill_level: str,
    ) -> str:
        """Generate a human-readable explanation for why this Reel was selected."""
        c_domains   = c.get("domains", [])
        c_diff      = c.get("difficulty", "Beginner")
        c_cat       = c.get("category", "")
        alignment   = c.get("interest_alignment", 0.0)
        skill_prog  = c.get("skill_progression_score", 0.0)

        top_domain_names = [d for d, _ in top_domains[:3]]

        matching_domains = [d for d in c_domains if d in top_domain_names]
        if not matching_domains:
            matching_domains = [
                d for d in c_domains
                if DOMAIN_HIERARCHY.get(d) in [DOMAIN_HIERARCHY.get(td) for td in top_domain_names]
            ]

        domain_str = " and ".join(matching_domains[:2]) if matching_domains else c_domains[0] if c_domains else c_cat

        progression_note = ""
        if skill_prog >= 0.8 and c_diff != skill_level:
            progression_note = (
                f" This {c_diff.lower()}-level content is ideal to "
                f"stretch your skills beyond {skill_level.lower()} level."
            )
        elif skill_prog == 1.0:
            progression_note = f" The {c_diff.lower()} difficulty perfectly matches your current skill level."

        alignment_pct = round(alignment * 100, 0)
        return (
            f"Recommended #{rank} ({alignment_pct:.0f}% interest match) because your scrolling behavior "
            f"shows strong latent interest in {domain_str}.{progression_note} "
            f"High educational value ({c.get('educational_value', 0)*100:.0f}%) with zero clickbait hype."
        )
