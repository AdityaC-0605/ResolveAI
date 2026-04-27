import numpy as np
from typing import List, Dict, Tuple
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import chromadb
from chromadb.config import Settings
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
import httpx
import re

class OllamaEmbeddingFunction(EmbeddingFunction):
    def __init__(self, model_name: str = "nomic-embed-text", url: str = "http://localhost:11434/api/embeddings"):
        self.model_name = model_name
        self.url = url
        
    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        with httpx.Client() as client:
            for text in input:
                response = client.post(
                    self.url,
                    json={"model": self.model_name, "prompt": text}
                )
                response.raise_for_status()
                embeddings.append(response.json()["embedding"])
        return embeddings

class HybridRetriever:
    def __init__(self, collection_name: str = "complaints", persist_dir: str = "./chroma_db"):
        self.ef = OllamaEmbeddingFunction()
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.ef
        )
        self.bm25 = None
        self.corpus = []
        self.corpus_ids = []
        self.tokenized_corpus = []
        self._build_bm25_index()
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple but effective tokenization for BM25"""
        return re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
    
    def _build_bm25_index(self):
        """Rebuild BM25 index from ChromaDB collection"""
        try:
            all_docs = self.collection.get()
            if all_docs['documents']:
                self.corpus = all_docs['documents']
                self.corpus_ids = all_docs['ids']
                self.tokenized_corpus = [self._tokenize(doc) for doc in self.corpus]
                self.bm25 = BM25Okapi(self.tokenized_corpus)
        except Exception:
            self.bm25 = None
    
    def add_documents(self, texts: List[str], ids: List[str], metadatas: List[dict] = None):
        """Add documents to both vector store and BM25 index"""
        self.collection.add(
            documents=texts,
            ids=ids,
            metadatas=metadatas or [{} for _ in texts]
        )
        self._build_bm25_index()
    
    def keyword_search(self, query: str, top_k: int = 10) -> List[Dict]:
        """BM25 keyword search with fuzzy matching fallback"""
        if not self.bm25 or not self.corpus:
            return []
        
        tokenized_query = self._tokenize(query)
        if not tokenized_query:
            return []
        
        scores = self.bm25.get_scores(tokenized_query)
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for rank, idx in enumerate(top_indices, 1):
            if scores[idx] > 0:
                results.append({
                    "id": self.corpus_ids[idx],
                    "text": self.corpus[idx],
                    "score": float(scores[idx]),
                    "rank": rank,
                    "method": "keyword"
                })
        return results
    
    def semantic_search(self, query: str, top_k: int = 10) -> List[Dict]:
        """Dense vector semantic search via ChromaDB"""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        semantic_results = []
        for rank, (doc_id, text, distance) in enumerate(zip(
            results['ids'][0], 
            results['documents'][0], 
            results['distances'][0]
        ), 1):
            # Convert cosine distance to similarity score
            similarity = 1 - (distance / 2) if distance <= 2 else 0.5
            semantic_results.append({
                "id": doc_id,
                "text": text,
                "score": float(similarity),
                "rank": rank,
                "method": "semantic"
            })
        return semantic_results
    
    def reciprocal_rank_fusion(
        self, 
        keyword_results: List[Dict], 
        semantic_results: List[Dict], 
        k: float = 60.0,
        keyword_weight: float = 0.4,
        semantic_weight: float = 0.6
    ) -> List[Dict]:
        """
        Reciprocal Rank Fusion with configurable weights.
        Why RRF? It handles score scale differences between BM25 and cosine similarity
        without requiring normalization.
        """
        scores = {}
        doc_texts = {}
        
        # Process keyword results
        for r in keyword_results:
            doc_id = r['id']
            scores[doc_id] = scores.get(doc_id, 0) + keyword_weight * (1.0 / (k + r['rank']))
            doc_texts[doc_id] = r['text']
        
        # Process semantic results
        for r in semantic_results:
            doc_id = r['id']
            scores[doc_id] = scores.get(doc_id, 0) + semantic_weight * (1.0 / (k + r['rank']))
            doc_texts[doc_id] = r['text']
        
        # Sort by fused score
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        fused = []
        for rank, (doc_id, score) in enumerate(sorted_results, 1):
            fused.append({
                "id": doc_id,
                "text": doc_texts[doc_id],
                "score": round(score, 4),
                "rank": rank,
                "method": "fused"
            })
        return fused
    
    def retrieve(self, query: str, top_k: int = 5) -> Tuple[List[Dict], Dict]:
        """
        Full hybrid retrieval pipeline.
        Returns: (fused_results, debug_info)
        """
        # Run both searches with higher top_k for better fusion coverage
        keyword_results = self.keyword_search(query, top_k=top_k*3)
        semantic_results = self.semantic_search(query, top_k=top_k*3)
        
        # Fuse results
        fused_results = self.reciprocal_rank_fusion(
            keyword_results, 
            semantic_results,
            k=60.0,
            keyword_weight=0.35,  # Slightly favor semantic for intent
            semantic_weight=0.65
        )
        
        # Return top_k fused results
        top_results = fused_results[:top_k]
        
        debug_info = {
            "keyword_hits": len(keyword_results),
            "semantic_hits": len(semantic_results),
            "fused_hits": len(fused_results),
            "keyword_top_score": keyword_results[0]['score'] if keyword_results else 0,
            "semantic_top_score": semantic_results[0]['score'] if semantic_results else 0,
        }
        
        return top_results, debug_info