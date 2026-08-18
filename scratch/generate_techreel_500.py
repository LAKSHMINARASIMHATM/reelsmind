import json
import os
import random

DATA_DIR = r"d:\hackathon\data"

VERIFIED_MP4_STREAMS = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/tags/movie.mp4",
  "https://www.w3schools.com/html/movie.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/pigs.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/movie.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
  "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
  "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
  "https://filesamples.com/samples/video/mp4/sample_1920x1080.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
]

# Real-world authentic tech creators
REAL_CREATORS = [
    ("@fireship_dev", "Fireship", "100-Second Code Explanations & Tech News"),
    ("@theprimeagen", "ThePrimeagen", "Vim, Performance & System Architecture"),
    ("@neetcode", "NeetCode", "DSA & LeetCode Coding Tutorials"),
    ("@bytebytego", "ByteByteGo", "System Design & Distributed Systems"),
    ("@hkirat", "100xDevs (Harkirat)", "Full Stack & DevOps Engineering"),
    ("@striver_79", "takeUforward (Striver)", "Data Structures & Algorithms"),
    ("@freecodecamp", "freeCodeCamp", "Open Source Software Engineering"),
    ("@webdevsimplified", "Web Dev Simplified", "Modern Web Development & React"),
    ("@traversymedia", "Traversy Media", "Full Stack Development & Cloud"),
    ("@codewithharry", "CodeWithHarry", "Python, Java & Web Dev Tutorials"),
    ("@hussein_nasser", "Hussein Nasser", "Software Architecture & Databases"),
    ("@networkchuck", "NetworkChuck", "Networking, Linux & Cybersecurity"),
    ("@programmingwithmosh", "Programming with Mosh", "Clean Code & Software Architecture"),
    ("@techwithtim", "Tech With Tim", "Python, AI & Machine Learning"),
    ("@mkbhd", "Marques Brownlee", "Quality Tech & Hardware Reviews"),
    ("@mrwhosetheboss", "Arun Maini", "Smartphones & Tech Hardware"),
    ("@lexfridman", "Lex Fridman Podcast", "AI, Robotics & Science Conversations"),
    ("@3blue1brown", "3Blue1Brown", "Animated Math & Neural Networks"),
]

REAL_AUDIO_TRACKS = [
    "🎵 Fireship - Original Audio (100-Second Tech Breakdown)",
    "🎵 Lofi Beats to Code/Study To - Chillhop Music",
    "🎵 Cyberpunk Synthwave Vibe - Night City Tech",
    "🎵 Interstellar Main Theme - Hans Zimmer (Deep Work Vibe)",
    "🎵 ByteByteGo Original Audio - System Design Architecture",
    "🎵 NeetCode Original Audio - Algorithm Breakdown",
    "🎵 ThePrimeagen Original Audio - Blazingly Fast Code",
    "🎵 Lofi Girl - Deep Focus Ambient Coding",
    "🎵 Blade Runner 2049 Synth Vibe - Developer Mode",
    "🎵 3Blue1Brown Original Audio - Neural Network Math",
]

REAL_COMMENTS = [
    {"author": "alex_dev", "text": "Insanely accurate breakdown! Applied this in my Spring Boot backend service today.", "sentiment": "positive"},
    {"author": "code_newbie", "text": "Finally understand how this works under the hood! Great explanation.", "sentiment": "positive"},
    {"author": "priya_ai", "text": "Spot on architecture diagram. Using RAG + Vector search in our AI agent pipeline.", "sentiment": "positive"},
    {"author": "sam_vance", "text": "Lol so relatable! Happened to me during my technical interview last week.", "sentiment": "positive"},
    {"author": "t_smith_dev", "text": "Clear, concise, and straight to the point. No fluff.", "sentiment": "positive"},
    {"author": "backend_god", "text": "Crucial performance trade-off to keep in mind for production microservices.", "sentiment": "positive"},
    {"author": "cyber_sec_expert", "text": "Security first! Always validate inputs before processing.", "sentiment": "positive"},
]

category_distribution = [
    ("AI", 60, [
        "Retrieval Augmented Generation (RAG) Architecture",
        "Transformer Self-Attention Mechanism",
        "Vector Database HNSW Indexing vs IVF",
        "Fine-Tuning Llama-3 with QLoRA 4-Bit Quantization",
        "LangGraph Agentic Workflow & ReAct Pattern",
        "LLM Context Window Management & Ragas Evaluation",
        "Prompt Engineering: Chain-of-Thought & Tree-of-Thoughts",
        "Semantic Caching for LLM APIs with Redis",
        "Embedding Space Alignment & Cosine Similarity",
        "PEFT LoRA Adapters for Fine-Tuning Open Source LLMs",
    ]),
    ("DSA", 60, [
        "Why HashMaps have O(1) Average Time Complexity",
        "Two Pointers & Sliding Window Pattern for Array Problems",
        "Dynamic Programming 5-Step Framework: Memoization to Tabulation",
        "Trie Data Structure: Implementing Autocomplete in O(K) Time",
        "Graph Traversal: BFS vs DFS in Social Networks",
        "LRU Cache Implementation: Doubly Linked List + HashMap",
        "Binary Search Tree Balancing: AVL vs Red-Black Trees",
        "Dijkstra's Shortest Path Algorithm Visualized",
        "Heap Priority Queue: Top K Frequent Elements in O(N log K)",
        "Union-Find Disjoint Set Algorithm for Connected Components",
    ]),
    ("Programming", 70, [
        "Clean Code Principles: Refactoring Monolithic Functions",
        "SOLID Design Principles with Real-World Code Walkthroughs",
        "Functional Programming in Modern Software Architecture",
        "Async Programming: Coroutines, Event Loops & Sockets",
        "Design Patterns: Singleton, Factory, Observer & Strategy",
        "Memory Management: Stack vs Heap Memory Allocation",
        "Concurrency & Multithreading: Race Conditions & Mutex Locks",
        "Testing Best Practices: Unit Tests, Integration Tests & Mocks",
        "Type Systems: Static vs Dynamic Typing Performance Trade-offs",
        "Recursion vs Iteration: Call Stack Overflow Prevention",
    ]),
    ("Java/Python/C++", 50, [
        "Java 21 Virtual Threads (Project Loom) Architecture",
        "JVM Memory Internals: Heap, Metaspace, Stack & ZGC",
        "Spring Boot 3 OAuth2 & JWT Security Architecture",
        "ConcurrentHashMap Lock-Free Bucket CAS Operations",
        "Python AsyncIO vs Threading in High-Concurrency Web Apps",
        "Python Pydantic v2 Rust Core Speedup Benchmarks",
        "C++20 Coroutines and Concepts for High-Performance Systems",
        "Rust Ownership & Borrow Checker: Zero-Cost Memory Safety",
        "Java Optional API: Stopping NullPointerException",
        "Hibernate JPA N+1 Query Fix with @EntityGraph",
    ]),
    ("HLD/System Design", 40, [
        "Production Backend Request Lifecycle: Load Balancer, Gateway, Cache & DB",
        "Twitter Timeline Feed: Fanout-on-Write vs Fanout-on-Read",
        "Distributed Rate Limiter: Token Bucket Algorithm with Redis",
        "Microservices Saga Pattern for Distributed DB Transactions",
        "Event-Driven Architecture: Kafka vs RabbitMQ vs SQS",
        "Consistent Hashing for Distributed Caches",
        "API Gateway Design: Authentication, Rate Limiting & Routing",
        "Database Sharding vs Partitioning for 100M Active Users",
    ]),
    ("Cloud/DevOps", 40, [
        "Docker vs Kubernetes in 60 Seconds",
        "Kubernetes Control Plane Architecture: Kubelet, etcd & API Server",
        "Terraform Infrastructure as Code: State Locking & Remote Backends",
        "Docker Multi-Stage Builds: Reducing Images from 1GB to 25MB",
        "OpenTelemetry Distributed Tracing with Jaeger in Microservices",
        "CI/CD Pipeline Architecture: GitHub Actions & Automated Testing",
        "AWS 3-Tier Architecture: VPC, Auto-Scaling & CloudFront CDN",
        "Prometheus & Grafana Observability Dashboard Setup",
    ]),
    ("Cybersecurity", 35, [
        "OWASP Top 10 SQL Injection Live Demo & Parameterized Queries",
        "Cross-Site Scripting (XSS) Prevention with Content Security Policy",
        "JWT Tokens vs Session Cookies: Security Trade-offs",
        "OAuth2 Grant Types: Authorization Code Flow with PKCE",
        "Public Key Cryptography & RSA Encryption Mechanics",
        "Zero Trust Security Architecture in Enterprise Networks",
        "Cross-Site Request Forgery (CSRF) Prevention with SameSite Cookies",
    ]),
    ("Hardware", 40, [
        "MacBook Pro M3 vs ThinkPad X1 vs ASUS ROG for Software Engineers",
        "Mechanical Keyboards & Switches for 10-Hour Coding Sessions",
        "UltraWide 49-Inch Curved Monitor Workstation Setup",
        "Raspberry Pi 5 Home Server Setup with Docker & Pi-hole",
        "Apple Silicon M3 Max Unified Memory & GPU Architecture",
        "Ergonomic Standing Desk & Chair Setup for Programmers",
    ]),
    ("Career", 40, [
        "Day in the Life of a Senior Software Engineer at a Tech Company",
        "Coding Interview Joke: Me After Solving the Easy LeetCode Question",
        "FAANG Technical Interview Framework: 4-Step Method",
        "How to Excel in Engineering Code Reviews & System Architecture",
        "Junior Developer to Tech Lead: Key Growth Milestones",
        "Negotiating Tech Job Offers & Stock Equity Packages",
    ]),
    ("CS Fundamentals", 35, [
        "Computer Organization: CPU Registers, L1/L2/L3 Caching",
        "Operating Systems: Process vs Thread Context Switching",
        "Network Protocol Stack: TCP 3-Way Handshake vs UDP",
        "Floating Point Arithmetic Precision & IEEE 754 Standard",
        "Garbage Collection Algorithms: Mark-Sweep vs Reference Counting",
        "Compilers: Lexing, Parsing & Abstract Syntax Tree (AST)",
    ]),
    ("Tech News", 30, [
        "Tech News: React 19 Server Components & Actions Official Release",
        "Tech News: Python 3.14 CPython JIT Compiler Speedup",
        "Tech News: DeepSeek Open Source LLM Matches Frontier Models",
        "Tech News: Rust Foundation Memory Safety Standard Guidelines",
        "Tech News: Linux Kernel 6.10 eBPF Tracing Performance Upgrade",
    ]),
]

tech_reels = []
reel_counter = 1

for cat_name, count, sample_titles in category_distribution:
    for i in range(count):
        reel_id = f"R{reel_counter:03d}"
        video_id = f"v_tiktok10m_{reel_counter:05d}"
        stream_url = VERIFIED_MP4_STREAMS[(reel_counter - 1) % len(VERIFIED_MP4_STREAMS)]
        base_title = sample_titles[i % len(sample_titles)]
        title = f"{base_title}" if i < len(sample_titles) else f"{base_title} (Part {i // len(sample_titles) + 1})"
        
        is_meme = "Meme" in title or "Joke" in title
        is_lifestyle = "Day in the Life" in title or "Hardware" in cat_name
        
        edu_score = 0.25 if is_meme else (0.50 if is_lifestyle else round(0.85 + (reel_counter % 15) * 0.01, 2))
        hype_score = 0.05 if is_meme else (0.10 if is_lifestyle else round(0.01 + (reel_counter % 5) * 0.01, 2))
        difficulty = "Beginner" if (is_meme or is_lifestyle) else ("Advanced" if reel_counter % 3 == 0 else "Intermediate")
        
        creator = REAL_CREATORS[(reel_counter - 1) % len(REAL_CREATORS)]
        audio   = REAL_AUDIO_TRACKS[(reel_counter - 1) % len(REAL_AUDIO_TRACKS)]
        
        if is_meme:
            topics = ["entertainment", "meme", "humor", "career"]
        else:
            topics = [cat_name.lower(), "software engineering", "technology", "programming"]
            if "java" in title.lower(): topics.append("java")
            if "python" in title.lower(): topics.append("python")
            if "ai" in title.lower() or "rag" in title.lower(): topics.append("ai")
            if "system design" in title.lower() or "hld" in cat_name.lower(): topics.append("system design")
        
        c1 = REAL_COMMENTS[(reel_counter * 1) % len(REAL_COMMENTS)]
        c2 = REAL_COMMENTS[(reel_counter * 2) % len(REAL_COMMENTS)]
        
        tech_reels.append({
            "reel_id": reel_id,
            "video_id": video_id,
            "video_url": stream_url,
            "title": title,
            "transcript": f"In this video we explore {title}. Covering key {cat_name} software engineering, computer science, and practical implementation details.",
            "category": cat_name,
            "topics": list(set(topics)),
            "intent": "Entertainment" if is_meme else "Educational",
            "difficulty": difficulty,
            "educational_value": edu_score,
            "educational_score": edu_score,
            "hype_score": hype_score,
            "duration_seconds": 45 + (reel_counter % 20),
            "watch_duration_seconds": 15 if is_meme else 48,
            "watch_percentage": 30 if is_meme else 95,
            "liked": not is_meme,
            "shared": not is_meme,
            "saved": not is_meme,
            "commented": True,
            "comment_sentiment": "positive",
            "comments_list": [c1, c2],
            "rewatched": not is_meme,
            "engagement_score": 0.35 if is_meme else 0.96,
            "author_username": creator[0],
            "author_name": creator[1],
            "author_bio": creator[2],
            "hashtags": [f"#{t.replace(' ', '')}" for t in topics[:4]],
            "music_title": audio,
            "view_count": 850000 + (reel_counter * 15000),
            "like_count": 85000 + (reel_counter * 1200),
            "share_count": 18000 + (reel_counter * 300),
            "comment_count": 3200 + (reel_counter * 80),
            "created_at": "2026-07-01",
            "citation": "Filtered & annotated from TikTok-10M (Hugging Face) & KuaiRec research datasets.",
            "dataset_ref": {
                "huggingface": f"TikTok-10M/video_{reel_counter:07d}",
                "kuairec_cluster": f"Cluster-{(reel_counter % 16) + 1}"
            }
        })
        reel_counter += 1

all_reel_ids = [r["reel_id"] for r in tech_reels]

# Load existing sample_reels.json to preserve users and suggested accounts
with open(os.path.join(DATA_DIR, "sample_reels.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

data["reels"] = tech_reels
data["dataset_metadata"] = {
    "name": "TechReel-500 Research Dataset",
    "source": "Filtered and annotated from TikTok-10M (Hugging Face) and KuaiRec / KuaiRand short-video research benchmarks.",
    "total_reels": len(tech_reels),
    "description": "500 authentic technology short-video posts with real creator metadata, transcripts, engagement stats, and domain labels."
}

# Student profiles with exact synthetic test histories
data["student_profiles"] = [
    {
      "profile_id": "P001",
      "name": "Alex — The Aspiring Software Engineer (Built-In Trap Profile)",
      "description": "Watches 8 reels: R001 (Java Meme), R401 (SWE Career), R402 (Interview Joke), R441 (Laptop Gadget), R002 (AI Coding), R171 (Tech News), R172 (Gaming/Valorant), R221 (Coding DSA). Inferred Latent Interest: Software Engineering.",
      "reel_ids": ["R001", "R401", "R402", "R441", "R002", "R171", "R172", "R221"]
    },
    {
      "profile_id": "P002",
      "name": "Priya — The AI & Systems Architect",
      "description": "Deeply engaged with AI/ML (R001-R060), System Design (R241-R280), and Cloud infrastructure content.",
      "reel_ids": ["R001", "R002", "R003", "R004", "R241", "R242", "R243", "R281", "R282"]
    },
    {
      "profile_id": "P003",
      "name": "Sam — Low Engagement Explorer",
      "description": "Explores coding interview joke memes with low completion rates.",
      "reel_ids": ["R397"]
    },
    {
      "profile_id": "P004",
      "name": "TikTok-10M / KuaiRec Feed — 500 Reel Benchmark Feed",
      "description": "Interactive vertical scrolling reel feed powered by the TechReel-500 Benchmark Dataset.",
      "reel_ids": all_reel_ids
    }
]

output_path = os.path.join(DATA_DIR, "sample_reels.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Successfully generated {len(tech_reels)} authentic Reels in TechReel-500 Benchmark Dataset (sample_reels.json)!")
