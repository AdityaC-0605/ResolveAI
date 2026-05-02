"""
language.py — Multi-language complaint support

Enhancement 4: Multi-language Support
───────────────────────────────────────
Pipeline additions:
  1.  Detect language (langdetect, fast, offline)
  2a. If non-English → translate to English via LibreTranslate (free, self-hosted)
      OR fall back to Ollama prompt-based translation (no extra service needed)
  2b. OR route directly to a multilingual embedding model (your mBERT work!)
  3.  Return translated text + original + detected language for audit trail

Three strategies (configurable via settings.multilang_strategy):
  ┌────────────────┬──────────────────────────────────────────────────────────┐
  │ Strategy       │ Description                                              │
  ├────────────────┼──────────────────────────────────────────────────────────┤
  │ translate      │ Translate → English, then use existing nomic-embed-text  │
  │                │ Best for: monolingual corpus, maximum accuracy           │
  ├────────────────┼──────────────────────────────────────────────────────────┤
  │ multilingual   │ Skip translation, switch to multilingual embedding model │
  │                │ (e.g. sentence-transformers/paraphrase-multilingual-mpnet)│
  │                │ Best for: multilingual corpus, Aditya's mBERT background │
  ├────────────────┼──────────────────────────────────────────────────────────┤
  │ hybrid         │ Translate + embed with both models, fuse results         │
  │                │ Best for: highest recall, higher latency                 │
  └────────────────┴──────────────────────────────────────────────────────────┘

Supported languages (langdetect): 55 languages including hi, ta, te, bn, mr
(all major Indian languages relevant to CBA's customer base).

Your mBERT connection
  The CrossLingualQA system you built (mBERT vs mT5 across 54 language pairs)
  is directly applicable here. The multilingual strategy uses the same
  sentence-transformers multilingual model family. You can swap in your
  fine-tuned mBERT checkpoint by setting:
      MULTILANG_EMBED_MODEL=path/to/your/finetuned-mbert
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from cache import get_query_cache, make_cache_key
from config import settings

logger = logging.getLogger(__name__)

# ── Language detection ────────────────────────────────────────────────────────

try:
    from langdetect import DetectorFactory
    DetectorFactory.seed = 42          # deterministic detection
    _LANGDETECT_AVAILABLE = True
except ImportError:
    _LANGDETECT_AVAILABLE = False
    logger.warning(
        "langdetect not installed — language detection disabled. "
        "Run: pip install langdetect"
    )

# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class LanguageResult:
    original_text: str
    processed_text: str          # text to feed into retrieval (translated or original)
    detected_lang: str           # ISO-639-1 code, e.g. "hi", "fr", "en"
    was_translated: bool
    translation_method: str      # "none" | "libretranslate" | "ollama"
    confidence: float            # langdetect confidence 0-1


# ── Detector ──────────────────────────────────────────────────────────────────

def detect_language(text: str) -> tuple[str, float]:
    """Return (lang_code, confidence). Defaults to ('en', 0.0) on failure."""
    if not _LANGDETECT_AVAILABLE or len(text.strip()) < 10:
        return "en", 0.0
    try:
        from langdetect import detect_langs
        results = detect_langs(text)
        if results:
            top = results[0]
            return top.lang, round(top.prob, 3)
    except Exception as exc:
        logger.debug("Language detection failed: %s", exc)
    return "en", 0.0


# ── Translator ────────────────────────────────────────────────────────────────

class LanguageProcessor:
    """
    Detects and optionally translates complaints to English.

    LibreTranslate (preferred):
        - Free, self-hostable: docker run -p 5000:5000 libretranslate/libretranslate
        - Set LIBRETRANSLATE_URL=http://localhost:5000 in .env

    Ollama fallback:
        - No extra service needed
        - Slightly slower and less accurate for rare languages
        - Always available if Ollama is running
    """

    def __init__(self) -> None:
        self._cache = get_query_cache()
        self._libre_url = settings.libretranslate_url
        self._ollama_url = settings.ollama_generate_url

    async def process(self, text: str) -> LanguageResult:
        """
        Main entry point. Detects language and translates if needed.
        Returns a LanguageResult with all metadata preserved.
        """
        lang, confidence = detect_language(text)
        logger.debug("Detected language: %s (%.2f) for: %s…", lang, confidence, text[:40])

        if lang == "en" or not settings.multilang_enabled:
            return LanguageResult(
                original_text=text, processed_text=text,
                detected_lang=lang, was_translated=False,
                translation_method="none", confidence=confidence,
            )

        # Check cache
        cache_key = make_cache_key("translate", lang, text)
        cached = self._cache.get(cache_key)
        if cached:
            return LanguageResult(
                original_text=text, processed_text=cached,
                detected_lang=lang, was_translated=True,
                translation_method="cached", confidence=confidence,
            )

        # Try LibreTranslate first, fall back to Ollama
        translated, method = await self._translate(text, lang)
        self._cache.set(cache_key, translated)

        return LanguageResult(
            original_text=text, processed_text=translated,
            detected_lang=lang, was_translated=True,
            translation_method=method, confidence=confidence,
        )

    async def _translate(self, text: str, source_lang: str) -> tuple[str, str]:
        if self._libre_url:
            result = await self._translate_libretranslate(text, source_lang)
            if result:
                return result, "libretranslate"

        result = await self._translate_ollama(text, source_lang)
        return result, "ollama"

    async def _translate_libretranslate(self, text: str, source_lang: str) -> Optional[str]:
        """
        POST to a self-hosted LibreTranslate instance.
        Returns None on any failure so the Ollama fallback is used.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self._libre_url}/translate",
                    json={"q": text, "source": source_lang, "target": "en", "format": "text"},
                )
                resp.raise_for_status()
                return resp.json().get("translatedText", "").strip() or None
        except Exception as exc:
            logger.debug("LibreTranslate failed: %s", exc)
            return None

    async def _translate_ollama(self, text: str, source_lang: str) -> str:
        """
        Translate using the local Ollama LLM. Always succeeds (falls back to original).
        """
        prompt = (
            f"Translate the following customer complaint from {source_lang} to English.\n"
            f"Return ONLY the English translation — no explanation, no labels.\n\n"
            f"Text: {text}\n\nEnglish translation:"
        )
        payload = {
            "model": settings.ollama_llm_model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 300},
        }
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(self._ollama_url, json=payload)
                    resp.raise_for_status()
                    translated = resp.json().get("response", "").strip()
                    if translated:
                        return translated
            except Exception as exc:
                logger.warning("Ollama translation attempt %d failed: %s", attempt + 1, exc)
                if attempt == 0:
                    await asyncio.sleep(1)

        logger.warning("All translation attempts failed — using original text.")
        return text


# ── Multilingual embedding switcher ───────────────────────────────────────────

class MultilingualEmbedder:
    """
    Drops in as an alternative OllamaEmbeddingFunction when
    multilang_strategy == 'multilingual'.

    Uses sentence-transformers paraphrase-multilingual-mpnet-base-v2 (50 langs)
    or your own fine-tuned mBERT checkpoint.

    Compatible with the CrossLingualQA model you trained — just point
    MULTILANG_EMBED_MODEL at your checkpoint directory.
    """

    DEFAULT_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

    def __init__(self, model_name: Optional[str] = None) -> None:
        self.model_name = model_name or settings.multilang_embed_model or self.DEFAULT_MODEL
        self._model = None
        self._load()

    def _load(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading multilingual embedder: %s …", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            logger.info("Multilingual embedder ready ✓")
        except ImportError:
            logger.warning(
                "sentence-transformers not installed. "
                "Run: pip install sentence-transformers"
            )
        except Exception as exc:
            logger.error("Multilingual embedder load failed: %s", exc)

    def embed(self, texts: list[str]) -> list[list[float]]:
        if self._model is None:
            raise RuntimeError("Multilingual embedder not available.")
        embeddings = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embeddings.tolist()


# ── Singletons ────────────────────────────────────────────────────────────────

_processor: Optional[LanguageProcessor] = None
_multilingual_embedder: Optional[MultilingualEmbedder] = None


def get_language_processor() -> LanguageProcessor:
    global _processor
    if _processor is None:
        _processor = LanguageProcessor()
    return _processor


def get_multilingual_embedder() -> MultilingualEmbedder:
    global _multilingual_embedder
    if _multilingual_embedder is None:
        _multilingual_embedder = MultilingualEmbedder()
    return _multilingual_embedder