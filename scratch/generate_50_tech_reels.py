import json
import os

DATA_DIR = r"d:\hackathon\data"

VERIFIED_MP4_STREAMS = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/tags/movie.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
  "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
  "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
]

# 50 Pure Educational Tech, Java, System Design & Software Engineering Reels
tech_reels_definitions = [
    # ─── JAVA & SPRING BOOT (12 Reels) ───────────────────────────────────────
    ("Java Developer Meme: When NullPointerException Appears in Production", "Java", ["java", "meme", "humor", "entertainment"], 0.25, 0.05, "@java_meme_king", "Dev Humor HQ"),
    ("Java 21 Virtual Threads (Project Loom): Eliminating OS Thread Blocking", "Java", ["java", "java21", "virtual threads", "concurrency", "backend", "software engineering"], 0.96, 0.02, "@java_guru", "Java Architecture Lab"),
    ("Spring Boot 3.2 Security with OAuth2 and JWT Token Authentication", "Java", ["java", "spring boot", "security", "jwt", "backend", "software engineering"], 0.94, 0.02, "@spring_mastery", "Spring Boot Classroom"),
    ("JVM Memory Management: Heap vs Metaspace vs Stack Allocation", "Java", ["java", "jvm", "garbage collection", "memory management", "backend"], 0.95, 0.01, "@jvm_internals", "JVM Performance Lab"),
    ("Hibernate JPA N+1 Query Problem: How @EntityGraph Fixes DB Bloat", "Java", ["java", "hibernate", "jpa", "database", "sql", "backend"], 0.93, 0.02, "@java_db_pro", "Java Persistence Master"),
    ("ConcurrentHashMap vs HashMap: Thread Safety without Synchronized Lock", "Java", ["java", "concurrency", "data structures", "multithreading", "backend"], 0.95, 0.02, "@java_concurrency", "Java Multithreading Lab"),
    ("Clean Code in Java: Refactoring 500-Line Methods using SOLID Principles", "Java", ["java", "clean code", "refactoring", "solid principles", "software engineering"], 0.94, 0.03, "@clean_coder_java", "Clean Code Academy"),
    ("Java Optional API: Stopping NullPointerException Before It Happens", "Java", ["java", "functional programming", "clean code", "backend", "software engineering"], 0.89, 0.03, "@java_tips", "Java Code Tips"),
    ("Spring Cloud Microservices: Service Discovery with Eureka & Resilience4j", "Java", ["java", "spring cloud", "microservices", "resilience4j", "backend"], 0.95, 0.02, "@microservices_java", "Spring Cloud Pro"),
    ("Java Stream API vs Loops: Parallel Streams Performance Benchmark", "Java", ["java", "streams api", "functional programming", "performance", "backend"], 0.91, 0.02, "@stream_master", "Java Streams Lab"),
    ("Maven vs Gradle Build Tool Comparison: Dependency Resolution & Caching", "Java", ["java", "maven", "gradle", "build tools", "devops", "software engineering"], 0.88, 0.04, "@java_build_tools", "DevOps for Java"),
    ("Java Bytecode Internals: Decompiling Class Files with javap -c", "Java", ["java", "bytecode", "jvm", "compilation", "software engineering"], 0.92, 0.01, "@bytecode_ninja", "Java Low Level"),

    # ─── SYSTEM DESIGN & SOFTWARE ARCHITECTURE (12 Reels) ────────────────────
    ("How a Production Backend Request Travels Through Load Balancer, Cache and DB", "System Design", ["system design", "backend", "load balancer", "api gateway", "database", "redis", "hld"], 0.97, 0.02, "@system_design_guru", "System Design Guru"),
    ("Designing Twitter's Timeline Feed: Fanout on Write vs Fanout on Read", "System Design", ["system design", "twitter", "hld", "distributed systems", "scalability", "database"], 0.96, 0.02, "@sysdesign_pro", "System Design Lab"),
    ("Distributed Rate Limiter: Implementing Token Bucket Algorithm with Redis", "System Design", ["system design", "rate limiter", "redis", "algorithms", "hld", "software engineering"], 0.95, 0.02, "@distributed_architect", "Distributed Systems HQ"),
    ("SOLID Design Principles Explained with Real-World Code Refactoring", "Software Engineering", ["solid principles", "clean code", "design patterns", "software engineering", "refactoring"], 0.94, 0.03, "@clean_code_daily", "Software Craftsmanship"),
    ("Microservices Saga Pattern: Managing Distributed Transactions in DBs", "System Design", ["microservices", "saga pattern", "distributed transactions", "system design", "backend"], 0.96, 0.02, "@microservices_guru", "Microservices Architecture"),
    ("Event-Driven Architecture: Kafka vs RabbitMQ vs AWS SQS Use Cases", "System Design", ["event driven", "kafka", "rabbitmq", "system design", "backend", "cloud"], 0.95, 0.02, "@event_driven_tech", "Event Driven Systems"),
    ("Consistent Hashing: How Distributed Caches Distribute Keys Uniformly", "System Design", ["consistent hashing", "distributed systems", "redis", "memcached", "hld"], 0.96, 0.01, "@cache_architect", "Distributed Caching"),
    ("API Gateway Design Patterns: Authentication, Rate Limiting & Routing", "System Design", ["api gateway", "microservices", "system design", "backend", "software engineering"], 0.93, 0.03, "@api_architect", "API Engineering"),
    ("Database Sharding vs Read Replicas: Scaling DBs to 100M Active Users", "System Design", ["database", "sharding", "scalability", "sql", "system design", "backend"], 0.96, 0.02, "@db_scale", "Database Systems Lab"),
    ("REST vs GraphQL vs gRPC: Choosing the Right API Paradigm for Production", "Software Engineering", ["rest", "graphql", "grpc", "api", "backend", "software engineering"], 0.92, 0.04, "@api_mastery", "API Architecture"),
    ("CI/CD Pipeline Architecture: Automated Testing, Linting & Docker Builds", "Software Engineering", ["ci/cd", "devops", "docker", "automation", "software engineering"], 0.91, 0.03, "@cicd_ninja", "DevOps & Engineering"),
    ("Design Patterns in Java: Singleton, Factory, Observer & Strategy Guide", "Software Engineering", ["design patterns", "java", "architecture", "software engineering", "clean code"], 0.95, 0.02, "@pattern_master", "Design Patterns HQ"),

    # ─── BACKEND, PYTHON & DATABASE TECH (10 Reels) ──────────────────────────
    ("PostgreSQL Query Optimization: Reading EXPLAIN ANALYZE Execution Plans", "Backend", ["postgres", "sql", "database", "backend", "performance optimization", "indexing"], 0.94, 0.02, "@database_pro", "SQL & Postgres Master"),
    ("Python AsyncIO Event Loop: Handling 10,000 Concurrent Sockets in FastAPI", "Backend", ["python", "asyncio", "concurrency", "fastapi", "backend", "software engineering"], 0.93, 0.03, "@python_mastery", "Python Backend Lab"),
    ("Database B-Tree Index Internals: Why Clustered Indexes Speed Up Lookups", "Backend", ["database", "indexing", "b-tree", "sql", "backend", "software engineering"], 0.95, 0.01, "@db_internals", "Database Engineering"),
    ("Redis Caching Strategies: Cache-Aside vs Write-Through vs Write-Behind", "Backend", ["redis", "cache", "backend", "performance", "system design"], 0.94, 0.02, "@redis_expert", "Redis Mastery"),
    ("OWASP Top 10 Security: SQL Injection Live Demo & Parameterized Queries", "Cybersecurity", ["cybersecurity", "sqlinjection", "owasp", "ethical hacking", "backend", "security"], 0.95, 0.03, "@sec_ninja", "CyberSec Labs"),
    ("Docker vs Kubernetes in 60 Seconds: Containers vs Cluster Orchestration", "Cloud", ["docker", "kubernetes", "cloud", "devops", "containerization", "backend"], 0.92, 0.04, "@devops_pro", "DevOps Classroom"),
    ("JWT Authentication Tokens vs Session Cookies: Security Trade-offs", "Backend", ["authentication", "jwt", "web security", "backend", "cybersecurity"], 0.91, 0.03, "@auth_security", "Security Engineering"),
    ("Database Transactions & ACID Isolation Levels: Read Committed vs Serializable", "Backend", ["database", "acid", "transactions", "sql", "backend"], 0.96, 0.01, "@acid_db", "Database ACID Lab"),
    ("gRPC Protocol Buffers vs JSON: Serialization Speed Benchmark", "Backend", ["grpc", "protobuf", "json", "serialization", "backend", "performance"], 0.94, 0.02, "@grpc_master", "gRPC Systems"),
    ("Kubernetes Control Plane Architecture: API Server, etcd & Kubelet", "Cloud", ["kubernetes", "cloud", "devops", "containers", "software engineering"], 0.93, 0.03, "@k8s_architect", "Kubernetes Lab"),

    # ─── DATA STRUCTURES, ALGORITHMS & CAREER (9 Reels) ──────────────────────
    ("Day in the Life of a Senior Software Engineer at a Tech Company", "Career", ["software engineering", "career", "tech company", "work life", "productivity", "developer lifestyle"], 0.65, 0.08, "@alex_tech_lead", "Alex Tech Lead"),
    ("Coding Interview Joke: Me After Solving the Easy LeetCode Question", "Career", ["coding interview", "leetcode", "dsa", "technical interview", "career", "software engineering"], 0.30, 0.08, "@leetcode_grindset", "LeetCode Grindset"),
    ("Two Pointers and Sliding Window: Solving 80% of Array Interview Problems", "DSA", ["dsa", "algorithms", "two pointers", "sliding window", "coding interview", "leetcode"], 0.94, 0.03, "@dsa_master", "DSA Patterns Lab"),
    ("Dynamic Programming 5-Step Framework: Top-Down Memoization to Bottom-Up", "DSA", ["dsa", "dynamic programming", "leetcode", "algorithms", "coding interview"], 0.96, 0.02, "@dp_grind", "Dynamic Programming Pro"),
    ("Trie Data Structure: Implementing Search Autocomplete in O(K) Time", "DSA", ["dsa", "trie", "data structures", "leetcode", "algorithms"], 0.95, 0.02, "@trie_algo", "Algorithms Visualized"),
    ("Graph Traversal: BFS vs DFS Explained for Social Network Connections", "DSA", ["dsa", "graph algorithms", "bfs", "dfs", "leetcode"], 0.93, 0.03, "@graph_algo", "Graph Algorithms HQ"),
    ("LRU Cache Implementation: Doubly Linked List + HashMap in O(1) Time", "DSA", ["dsa", "lru cache", "data structures", "leetcode", "coding interview"], 0.96, 0.02, "@lru_master", "Data Structures Lab"),
    ("Binary Search Tree Balancing: How AVL and Red-Black Trees Work", "DSA", ["dsa", "bst", "red black tree", "algorithms", "software engineering"], 0.94, 0.02, "@tree_algo", "Binary Trees Lab"),
    ("System Design Interview Framework: 4-Step Method for FAANG Interviews", "Career", ["system design", "technical interview", "career", "faang", "software engineering"], 0.91, 0.06, "@swe_interview_prep", "Interview Masterclass"),

    # ─── AI, GENERATIVE AI & HARDWARE TECH (9 Reels) ────────────────────────
    ("How RAG Systems Retrieve Documents Before Generating an LLM Answer", "AI", ["rag", "retrieval augmented generation", "llm", "vector embeddings", "ai", "machine learning"], 0.97, 0.02, "@ai_explainer", "AI Explained Simply"),
    ("Transformer Self-Attention Mechanism Visualized with Matrix Multiplication", "AI", ["transformers", "attention mechanism", "ai", "deep learning", "nlp", "llm"], 0.98, 0.02, "@ml_deep_learning", "Deep Learning Visualized"),
    ("Vector Database HNSW Indexing vs IVF: Semantic Search Speed Benchmark", "AI", ["vector database", "hnsw", "chromadb", "faiss", "ai", "rag"], 0.96, 0.02, "@vector_db_pro", "Vector Search Lab"),
    ("Fine-Tuning Llama-3 with QLoRA 4-Bit Quantization on a Single GPU", "AI", ["qlora", "fine tuning", "llama3", "generative ai", "llm", "ai"], 0.97, 0.03, "@llm_architect", "LLM Engineering"),
    ("Building Agentic AI Workflows with LangGraph and ReAct Function Calling", "AI", ["agentic ai", "langgraph", "langchain", "agents", "ai", "python"], 0.98, 0.03, "@ai_agent_lab", "AI Agents Lab"),
    ("LLM Evaluation Metrics: Ragas Faithfulness, Context Recall & Precision", "AI", ["llm eval", "ragas", "evaluations", "ai", "nlp"], 0.94, 0.02, "@llm_eval_lab", "AI Eval Lab"),
    ("MacBook Pro M3 vs ThinkPad X1 vs ASUS ROG for Developers: Hardware Guide", "Hardware", ["laptop", "macbook", "thinkpad", "developer hardware", "productivity", "hardware"], 0.55, 0.12, "@dev_hardware_reviews", "DevHardware Lab"),
    ("React 19 Server Components vs Client Components in 60 Seconds", "Frontend", ["react", "react19", "frontend", "javascript", "webdev", "software engineering"], 0.92, 0.03, "@react_pro_tips", "React Mastery Lab"),
    ("Why Rust Borrow Checker Prevents Memory Leaks and Data Races without GC", "Systems", ["rust", "systems programming", "memory safety", "cpp", "concurrency"], 0.95, 0.02, "@rust_systems_lab", "Rust Systems Lab"),
]

all_reels = []
for idx, (title, category, topics, edu_val, hype_val, author, author_name) in enumerate(tech_reels_definitions, start=1):
    reel_id = f"R{idx:03d}"
    video_id = f"v_7381{idx:04d}90123"
    stream_url = VERIFIED_MP4_STREAMS[(idx - 1) % len(VERIFIED_MP4_STREAMS)]
    
    is_meme = edu_val < 0.40
    
    all_reels.append({
        "reel_id": reel_id,
        "video_id": video_id,
        "video_url": stream_url,
        "title": title,
        "description": f"Short-form software engineering educational Reel explaining {title}. Targeted at technology, Java, and software development students.",
        "duration_seconds": 45 + (idx % 20),
        "category": category,
        "topics": topics,
        "watch_duration_seconds": 15 if is_meme else 48,
        "watch_percentage": 30 if is_meme else 95,
        "liked": False if is_meme else True,
        "shared": False if is_meme else True,
        "saved": False if is_meme else True,
        "commented": True,
        "comment_sentiment": "neutral" if is_meme else "positive",
        "rewatched": False if is_meme else True,
        "engagement_score": 0.30 if is_meme else 0.96,
        "educational_value": edu_val,
        "hype_score": hype_val,
        "author_username": author,
        "author_name": author_name,
        "hashtags": [f"#{t.replace(' ', '')}" for t in topics[:4]],
        "music_title": f"🎵 Educational Tech Beats - {category}",
        "view_count": 1200000 + (idx * 40000),
        "like_count": 140000 + (idx * 3500),
        "share_count": 25000 + (idx * 800),
        "comment_count": 3500 + (idx * 150),
        "created_at": "2026-07-01"
    })

all_reel_ids = [r["reel_id"] for r in all_reels]

# Load existing sample_reels.json to preserve users and suggested accounts
with open(os.path.join(DATA_DIR, "sample_reels.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

data["reels"] = all_reels
data["dataset_metadata"]["name"] = "TikTok-10M Pure Educational Tech & Software Engineering Dataset"
data["dataset_metadata"]["description"] = f"Curated dataset containing {len(all_reels)} 100% educational software engineering, Java, system design, and technology Reels."

# Student profiles
data["student_profiles"] = [
    {
      "profile_id": "P001",
      "name": "Alex — The Aspiring Software Engineer",
      "description": "Watches Java memes, Spring Boot 3, system design, and interview preparation content. Classic Java Trap profile.",
      "reel_ids": ["R001", "R002", "R003", "R004", "R005", "R006", "R007", "R008", "R013", "R014", "R032", "R033"]
    },
    {
      "profile_id": "P002",
      "name": "Priya — The AI & Systems Architect",
      "description": "Deeply engaged with AI/ML, System Design, Python FastAPI, and Cloud infrastructure content.",
      "reel_ids": ["R042", "R043", "R044", "R045", "R013", "R014", "R015", "R016", "R025", "R026", "R047", "R049"]
    },
    {
      "profile_id": "P003",
      "name": "Sam — Low Engagement Explorer",
      "description": "Explores developer hardware and memes with negligible watch completion (8%).",
      "reel_ids": ["R001"]
    },
    {
      "profile_id": "P004",
      "name": "TikTok-10M Feed — Real-Time Tech Scrolling Feed",
      "description": "Interactive vertical scrolling reel feed powered by 50 Educational Software Engineering & Tech Reels.",
      "reel_ids": all_reel_ids
    }
]

with open(os.path.join(DATA_DIR, "sample_reels.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Successfully generated {len(all_reels)} 100% PURE EDUCATIONAL TECH & SOFTWARE REELS in sample_reels.json!")
