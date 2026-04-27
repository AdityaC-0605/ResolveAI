from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uuid
import time
import asyncio
from typing import AsyncGenerator

from models import ComplaintInput, ClassificationResponse, RetrievedChunk
from retrieval import HybridRetriever
from llm_engine import OllamaLLMEngine
from seed_data import seed_database

app = FastAPI(
    title="Hybrid RAG Complaint Classifier",
    description="Semantic + Keyword search with structured LLM output",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
print("Initializing hybrid retriever and seeding data...")
retriever = seed_database()
llm_engine = OllamaLLMEngine(model="llama3.2")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "vector_db_count": retriever.collection.count()}

@app.post("/classify", response_model=ClassificationResponse)
async def classify_complaint(complaint: ComplaintInput):
    start_time = time.time()
    complaint_id = f"COMP-{uuid.uuid4().hex[:8].upper()}"
    
    try:
        # Step 1: Hybrid Retrieval
        chunks, debug_info = retriever.retrieve(complaint.text, top_k=5)
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No relevant context found in knowledge base")
        
        # Step 2: Structured LLM Classification
        classification = await llm_engine.classify(complaint.text, chunks)
        
        processing_time = (time.time() - start_time) * 1000
        
        # Map to response model
        retrieved_chunks = [
            RetrievedChunk(
                id=c["id"],
                text=c["text"],
                source="knowledge_base",
                score=c["score"],
                rank=c["rank"],
                retrieval_method=c["method"]
            ) for c in chunks
        ]
        
        return ClassificationResponse(
            complaint_id=complaint_id,
            input_text=complaint.text,
            processing_time_ms=round(processing_time, 2),
            retrieved_chunks=retrieved_chunks,
            classification=classification,
            hybrid_scores=debug_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify/stream")
async def classify_stream(complaint: ComplaintInput):
    """Streaming endpoint for real-time UI updates"""
    async def event_generator() -> AsyncGenerator[str, None]:
        yield f"data: {{'stage': 'retrieval', 'message': 'Searching knowledge base...'}}\\n\\n"
        await asyncio.sleep(0.5)
        
        chunks, debug_info = retriever.retrieve(complaint.text, top_k=5)
        yield f"data: {{'stage': 'retrieval_complete', 'chunks_found': {len(chunks)}, 'debug': {debug_info}}}\\n\\n"
        await asyncio.sleep(0.3)
        
        yield f"data: {{'stage': 'llm', 'message': 'Analyzing with local LLM...'}}\\n\\n"
        
        classification = await llm_engine.classify(complaint.text, chunks)
        yield f"data: {{'stage': 'complete', 'classification': {classification.model_dump()}}}\\n\\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@app.get("/stats")
async def get_stats():
    """System statistics and retrieval metrics"""
    return {
        "total_documents": retriever.collection.count(),
        "index_status": "healthy" if retriever.bm25 else "rebuilding",
        "embedding_model": "nomic-embed-text (via Ollama)",
        "llm_model": llm_engine.model,
        "fusion_method": "Reciprocal Rank Fusion (RRF)",
        "keyword_weight": 0.35,
        "semantic_weight": 0.65
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)