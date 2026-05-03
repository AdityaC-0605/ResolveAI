# ResolveAI v2 — Enhancement Migration Guide

Quick reference for enabling each enhancement. All are **off by default** where
they require extra dependencies or services, so the base system keeps working
without any changes.

---

## Enhancement 1 — Neural Re-ranking

**What:** Replaces TF-IDF cosine re-ranker with `cross-encoder/ms-marco-MiniLM-L-6-v2`.
**Accuracy lift:** +6–10% MRR@5 on typical support complaints.

```bash
pip install sentence-transformers==3.3.0
```

```env
RERANK_ENABLED=true
RERANK_METHOD=neural
RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
```

**To use your own cross-encoder** (e.g. fine-tuned on support data):
```env
RERANK_MODEL=./checkpoints/my-cross-encoder
```

**Fallback:** If `sentence-transformers` is not installed, the system
automatically falls back to TF-IDF — no code change needed.

---

## Enhancement 2 — HyDE (Hypothetical Document Embeddings)

**What:** Before semantic search, the LLM generates a hypothetical ideal
document. That document is embedded instead of the raw query, bridging the
query/document embedding gap.
**Best for:** Short or vague complaints like "my thing doesn't work".

```env
HYDE_ENABLED=true
HYDE_TIMEOUT_SECONDS=12.0
```

**Cost:** One extra Ollama call per query (~1–3s). Enable for production only
after benchmarking on your corpus.

---

## Enhancement 3 — Prometheus Metrics

**What:** Exposes `GET /metrics` (Prometheus text format) with 10 custom
metrics covering latency, throughput, category distribution, cache efficiency.

```bash
pip install prometheus-client==0.21.0 prometheus-fastapi-instrumentator==7.0.0
```

```env
ENABLE_PROMETHEUS=true
```

**Grafana setup:**
1. Add Prometheus datasource pointing at `http://localhost:8000/metrics`
2. Import `docs/grafana_dashboard.json` (provided separately)

**Key metrics:**
| Metric | Description |
|--------|-------------|
| `rag_request_duration_seconds` | p50/p95/p99 latency per endpoint |
| `rag_classification_category_total` | category × urgency breakdown |
| `rag_cache_operations_total` | hit/miss rates |
| `rag_llm_duration_seconds` | Ollama inference time |
| `rag_rerank_duration_seconds` | re-ranking time split by method |

---

## Enhancement 4 — Multi-language Support

**What:** Auto-detects language with `langdetect`, then either:
- Translates to English via LibreTranslate (self-hosted) or Ollama fallback
- OR uses a multilingual embedding model directly

```bash
pip install langdetect==1.0.9
```

```env
MULTILANG_ENABLED=true
MULTILANG_STRATEGY=translate   # or "multilingual" / "hybrid"
```

**LibreTranslate (best quality, free, self-hosted):**
```bash
docker run -p 5000:5000 libretranslate/libretranslate
```
```env
LIBRETRANSLATE_URL=http://localhost:5000
```

**Multilingual embedding (your mBERT checkpoint):**
```env
MULTILANG_STRATEGY=multilingual
MULTILANG_EMBED_MODEL=./checkpoints/mbert-crosslingual-qa  # your fine-tuned model
```

**Supported languages:** 55 (all langdetect languages), including hi, ta, te,
bn, mr (Indian languages relevant to CBA's customer base).

---

## Enhancement 5 — Feedback-Driven Few-Shot Refresh

**What:** Every 6h (configurable), reads misclassified complaints from the
feedback store and patches the LLM system prompt with up to 8 human-verified
correction examples. Closes the human-in-the-loop cycle with zero training cost.

No extra dependencies. Already wired in `main.py`.

```env
FEW_SHOT_REFRESH_ENABLED=true
FEW_SHOT_REFRESH_INTERVAL_HOURS=6
```

**Manual trigger:**
```bash
curl -X POST http://localhost:8000/admin/refresh-prompts
```

**View active examples:**
```bash
curl http://localhost:8000/admin/few-shot-examples
```

**How to feed it:**
1. Use the thumbs-down button in the UI on any classification result
2. The feedback modal asks for the correct category/urgency
3. The refresher picks up corrections on the next cycle

---

## Enhancement 6 — Redis Cache

**What:** Replaces the in-process TTLCache with Redis, enabling shared cache
across multiple uvicorn workers or Kubernetes replicas.

```bash
pip install redis==5.2.0
docker run -p 6379:6379 redis:7-alpine
```

```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0
```

**Check cache stats:**
```bash
curl http://localhost:8000/cache/info
```

**Flush cache:**
```bash
curl -X DELETE http://localhost:8000/cache
```

**Fallback:** If Redis is unreachable at startup, the system falls back to
in-process TTLCache automatically — safe for development.

---

## Enabling Everything at Once

```env
# .env — full production config
RERANK_ENABLED=true
RERANK_METHOD=neural
HYDE_ENABLED=false          # enable after benchmarking
ENABLE_PROMETHEUS=true
MULTILANG_ENABLED=true
MULTILANG_STRATEGY=translate
LIBRETRANSLATE_URL=http://localhost:5000
FEW_SHOT_REFRESH_ENABLED=true
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0
```

```bash
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```