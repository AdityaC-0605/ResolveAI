import json
import httpx
from typing import List, Dict
from models import StructuredClassification, RetrievedChunk
import os

class OllamaLLMEngine:
    def __init__(self, model: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.api_generate = f"{base_url}/api/generate"
    
    def _build_system_prompt(self) -> str:
        return """You are an expert Customer Support Intelligence analyst. 
Your task is to classify customer complaints using the provided retrieved context.
You MUST respond with valid JSON only. No markdown, no explanations outside JSON.

Categories must be one of: Billing, Technical, Account, Product-Quality, Shipping, Service, Fraud-Security
Subcategories must be specific (e.g., "double-charge", "login-failure", "defective-item")

Analyze sentiment carefully: angry, frustrated, neutral, concerned
Assess urgency based on financial impact, safety, or account access issues.

Include detailed reasoning showing your chain of thought."""
    
    def _build_user_prompt(self, complaint: str, chunks: List[Dict]) -> str:
        context_text = "\n\n---\n\n".join([
            f"[{i+1}] {chunk['text'][:400]}..." 
            for i, chunk in enumerate(chunks)
        ])
        
        return f"""COMPLAINT TO CLASSIFY:
\"\"\"{complaint}\"\"\"

RETRIEVED SIMILAR COMPLAINTS (USE AS CONTEXT):
{context_text}

CLASSIFY THE COMPLAINT AND RETURN STRICT JSON:
{{
    "category": "string",
    "subcategory": "string", 
    "sentiment": "angry|frustrated|neutral|concerned",
    "urgency": "critical|high|medium|low",
    "confidence": 0.0-1.0,
    "summary": "1-2 sentence summary",
    "reasoning": "detailed step-by-step reasoning",
    "action_items": ["action 1", "action 2"],
    "assigned_team": "team name",
    "estimated_resolution_hours": integer
}}"""
    
    async def classify(
        self, 
        complaint_text: str, 
        retrieved_chunks: List[Dict]
    ) -> StructuredClassification:
        """
        Generate structured classification using Ollama with JSON mode.
        Falls back to regex extraction if JSON parsing fails.
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(complaint_text, retrieved_chunks)
        
        payload = {
            "model": self.model,
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.3,
                "num_predict": 800,
                "top_p": 0.9
            }
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(self.api_generate, json=payload)
            response.raise_for_status()
            result = response.json()
            
            raw_output = result.get("response", "{}")
            
            # Parse JSON output
            try:
                parsed = json.loads(raw_output)
            except json.JSONDecodeError:
                # Fallback: extract JSON from markdown or text
                import re
                json_match = re.search(r'\{.*\}', raw_output, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                else:
                    raise ValueError(f"Could not parse LLM output: {raw_output}")
            
            # Fix up potential array outputs for string fields
            for field in ["reasoning", "summary", "category", "subcategory", "assigned_team"]:
                if field in parsed and isinstance(parsed[field], list):
                    parsed[field] = "\n".join(str(x) for x in parsed[field])
                
            # Validate and return structured output
            return StructuredClassification(**parsed)