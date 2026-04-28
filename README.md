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
- **Infrastructure**: Redis/Memory Cache, SQLite (Feedback), Docker.

---

## 🧠 Core Architecture

ResolveAI follows a sophisticated RAG (Retrieval-Augmented Generation) pipeline:

1.  **Hybrid Retrieval**: Parallel execution of BM25 keyword search and HNSW vector search.
2.  **RRF Fusion**: Results are combined using **Reciprocal Rank Fusion** to balance exact matches and semantic intent.
3.  **Lightweight Re-ranking**: Top candidates are re-scored using a TF-IDF cross-attention mechanism.
4.  **Structured Inference**: Ollama processes the context to generate a validated JSON response.

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
│   ├── main.py          # FastAPI entry & endpoints
│   ├── retrieval.py     # Hybrid search engine (BM25 + Vector)
│   ├── llm_engine.py    # Local LLM integration & JSON parsing
│   ├── models.py        # Pydantic schemas & data types
│   ├── feedback.py      # SQLite store for classification analytics
│   └── config.py        # Environment-driven configuration
└── frontend/
    ├── src/
    │   ├── pages/       # Dashboard, Batch, Classify, Analytics, Knowledge
    │   ├── components/  # ComplaintInput, RetrievalPipeline, StructuredOutput
    │   └── hooks/       # useComplaintPipeline custom hook
    └── tailwind.config.js
```

---

## 📊 Monitoring & Analytics

ResolveAI includes built-in endpoints for operational visibility:
- **`/health`**: Dependency-aware health checks (Ollama + DB).
- **`/stats`**: Real-time metrics on latency, cache hits, and retrieval performance.
- **`/analytics`**: Accuracy trends based on human-in-the-loop feedback.

---

## 🛡️ Privacy & Performance

- **100% Local**: No data ever leaves your infrastructure. No API costs. No latency spikes.
- **Async First**: Fully non-blocking architecture for high-concurrency workloads.
- **Smart Caching**: TTL-based caching for embeddings and common queries.

---

<div align="center">
  Built for support teams that demand accuracy, privacy, and speed.
</div>
