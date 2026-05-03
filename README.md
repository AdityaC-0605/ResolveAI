# ResolveAI: Hybrid RAG Complaint Classifier

> **Intelligent, local-first complaint classification using Semantic + Keyword retrieval and structured LLM inference.**

ResolveAI is a production-grade system designed to classify customer complaints with high precision. By fusing dense vector search with traditional keyword matching (BM25), it provides the LLM with the most relevant historical context, resulting in highly accurate, explainable, and structured outcomes.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.9+ & Node.js 18+
- [Ollama](https://ollama.ai) (Local LLM runner)

### 2. Prepare AI Models
```bash
ollama pull llama3.2         # Classification engine
ollama pull nomic-embed-text  # Embedding engine
```

### 3. Launch Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed_data.py          # Initialize knowledge base
uvicorn main:app --reload
```

### 4. Launch Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, Pydantic v2, ChromaDB (Vector Store), Rank-BM25.
- **AI/LLM**: Ollama (llama3.2/mistral), nomic-embed-text.
- **Frontend**: React 18, Tailwind CSS, Framer Motion (Animations), Vite.
- **Infrastructure & Monitoring**: Redis (Distributed Caching), Prometheus (Telemetry), LangDetect (Multilingual).
- **Data Store**: SQLite (Feedback & System Configurations).

---

## 🧠 Core Architecture

ResolveAI follows a sophisticated RAG (Retrieval-Augmented Generation) pipeline:

1.  **Multilingual Pre-processing**: Auto-detection and English translation of complaints via LangDetect.
2.  **High-Speed Caching**: Redis-backed cache layer checks for exact matches to serve instant results.
3.  **Hybrid Retrieval**: Parallel execution of BM25 keyword search and HNSW vector search.
4.  **RRF Fusion & Re-ranking**: Results are combined using Reciprocal Rank Fusion, then re-scored using a TF-IDF cross-attention mechanism.
5.  **Dynamic Few-Shot**: System continuously curates and injects the most relevant historical corrections into the prompt.
6.  **Structured Inference**: Ollama processes the context to generate a validated JSON response.

### Structured Output Schema
Every classification includes:
- **Category & Subcategory**: Hierarchical mapping.
- **Sentiment & Urgency**: Emotional tone and priority level.
- **Reasoning**: Step-by-step chain-of-thought explanation.
- **Action Items**: Recommended next steps for support teams.

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py              # FastAPI entry & endpoints
│   ├── retrieval.py         # Hybrid search engine (BM25 + Vector)
│   ├── llm_engine.py        # Local LLM integration & JSON parsing
│   ├── models.py            # Pydantic schemas & data types
│   ├── feedback.py          # SQLite store for classification analytics
│   ├── config.py            # Environment-driven configuration
│   ├── cache.py             # In-memory TTL caching logic
│   ├── redis_cache.py       # Distributed Redis caching layer
│   ├── few_shot_refresh.py  # Dynamic prompt refresher logic
│   ├── hyde.py              # Hypothetical document embeddings (HyDE)
│   ├── language.py          # Multilingual processing & LangDetect
│   ├── metrics.py           # Prometheus observability metrics
│   ├── middleware.py        # Rate limiting, auth, and logging
│   ├── reranker.py          # Cross-encoder neural reranking
│   ├── seed_data.py         # Knowledge base initialization
│   ├── MIGRATION.md         # V2 enhancement configuration guide
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── index.html           # HTML entry point
    ├── package.json         # NPM dependencies
    ├── vite.config.js       # Vite build configuration
    ├── tailwind.config.js   # Tailwind CSS design system config
    ├── postcss.config.js    # PostCSS config
    ├── .eslintrc.json       # ESLint rules
    └── src/
        ├── main.jsx         # React application entry
        ├── App.jsx          # React router & route definitions
        ├── api.js           # Centralised fetch API calls
        ├── index.css        # Global styles & glassmorphism utilities
        ├── pages/           # Landing, Dashboard, Classify, Batch, Knowledge, Analytics
        ├── components/      # UI components, ParticleField, Layout, Sidebar
        └── hooks/           # useComplaintPipeline custom streaming hook
```

---

## 📊 Monitoring & Analytics

ResolveAI includes built-in endpoints for operational visibility:
- **`/health`**: Dependency-aware health checks (Ollama, Redis, Vector DB).
- **`/stats`**: Real-time metrics on latency, cache hits, and retrieval performance.
- **`/analytics`**: Accuracy trends based on human-in-the-loop feedback.
- **`/metrics`**: Prometheus-compatible endpoint for Grafana observability dashboards.

---

## 🛡️ Privacy & Performance

- **100% Local**: No data ever leaves your infrastructure. No API costs. No latency spikes.
- **Async First**: Fully non-blocking architecture for high-concurrency workloads.
- **Smart Caching**: TTL-based caching for embeddings and common queries.

---

<div align="center">
  Built for support teams that demand accuracy, privacy, and speed.
</div>
