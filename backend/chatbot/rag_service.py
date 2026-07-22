from __future__ import annotations

import json
import logging
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path
import requests

from django.conf import settings

logger = logging.getLogger(__name__)

VECTOR_STORE_PATH = Path(settings.BASE_DIR) / "chatbot" / "vector_store.json"
HF_MODEL_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"

STOP_WORDS = {
    "the", "and", "for", "with", "from", "this", "that", "these", "those",
    "what", "how", "why", "where", "when", "which", "who", "whom", "whose",
    "about", "into", "onto", "over", "under", "your", "our", "there", "their",
    "them", "then", "than", "have", "has", "had", "will", "would", "should",
    "can", "could", "on", "in", "at", "to", "of", "is", "are", "was", "were",
    "it", "you", "we", "me", "my", "she", "he", "they", "him", "her", "its",
    "but", "not", "or", "as", "if", "by", "an", "be", "do", "at", "by"
}

@dataclass
class RAGChunk:
    file_path: str
    chunk_index: int
    category: str
    content: str
    dense_embedding: list[float] | None = None
    term_freq: dict[str, float] | None = None  # TF representation for sparse search

def clean_and_tokenize(text: str) -> list[str]:
    """Basic text cleanup and tokenization."""
    text = text.lower()
    # Replace non-alphanumeric characters with spaces
    cleaned = re.sub(r"[^a-z0-9\-\+]", " ", text)
    tokens = cleaned.split()
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 2]

def compute_cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Compute cosine similarity between two dense vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    if norm_v1 == 0.0 or norm_v2 == 0.0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

class RAGPipeline:
    def __init__(self):
        self.chunks: list[RAGChunk] = []
        self.vocabulary: set[str] = set()
        self.idf_map: dict[str, float] = {}
        self.load_vector_store()

    def get_dense_embedding(self, text: str) -> list[float] | None:
        """Call free Hugging Face inference API for dense embeddings."""
        import sys
        is_testing = 'test' in sys.argv or 'test_runner' in sys.modules or 'unittest' in sys.modules
        if is_testing:
            return None

        try:
            response = requests.post(
                HF_MODEL_URL,
                json={"inputs": text},
                timeout=12
            )
            if response.status_code == 200:
                res = response.json()
                if isinstance(res, list) and all(isinstance(x, (int, float)) for x in res):
                    return [float(x) for x in res]
            logger.warning(f"HF Embeddings returned code={response.status_code} body={response.text[:200]}")
        except Exception as e:
            logger.warning(f"Failed to fetch dense embedding: {e}")
        return None

    def determine_category(self, file_path: str) -> str:
        """Determine chunk category based on file path."""
        p = file_path.lower()
        if "readme" in p:
            return "documentation"
        elif "models.py" in p:
            return "database_schema"
        elif "views.py" in p or "controllers" in p:
            return "controllers"
        elif "urls.py" in p or "routing" in p:
            return "route_definitions"
        elif "services" in p:
            return "services"
        elif "pages" in p:
            return "frontend_pages"
        elif "components" in p:
            return "frontend_components"
        elif "context" in p:
            return "authentication"
        elif "config" in p or "settings.py" in p or ".env" in p:
            return "configuration"
        return "static_content"

    def index_repository(self) -> dict:
        """Scan repository and generate RAG chunks with dense and sparse embeddings."""
        workspace_root = Path(settings.BASE_DIR).parent
        logger.info(f"Indexing repository from root: {workspace_root}")

        raw_chunks: list[dict] = []
        ignored_dirs = {
            "node_modules", "venv", ".git", "__pycache__", ".vscode", "dist",
            "build", "staticfiles", "media", "db.sqlite3", ".agents", ".gemini"
        }
        ignored_extensions = {
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf", ".pyc",
            ".sql", ".db", ".sqlite3", ".zip", ".tar", ".gz"
        }

        # Traverse directory
        for root, dirs, files in os.walk(workspace_root):
            # Prune directory search
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]

            for file in files:
                ext = Path(file).suffix.lower()
                lower_file = file.lower()
                # Skip ignored extensions, dotfiles, env configuration files, key files, and the vector store database itself
                if (
                    ext in ignored_extensions
                    or file.startswith(".")
                    or lower_file == "env"
                    or "env" in lower_file.split(".")
                    or "env" in lower_file.split("-")
                    or "env" in lower_file.split("_")
                    or lower_file == "vector_store.json"
                    or lower_file.endswith((".key", ".pem", ".cert"))
                ):
                    continue


                full_path = Path(root) / file
                # Skip massive build or cache files
                if full_path.stat().st_size > 1.5 * 1024 * 1024:
                    continue

                try:
                    relative_path = full_path.relative_to(workspace_root).as_posix()
                    # Skip specific frontend lockfiles or generated files
                    if "package-lock.json" in relative_path:
                        continue

                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read()

                    if not text.strip():
                        continue

                    # Chunking strategy: character-based chunks of ~800 chars with 150 chars overlap
                    chunk_size = 800
                    overlap = 150
                    start = 0
                    chunk_idx = 0
                    cat = self.determine_category(relative_path)

                    while start < len(text):
                        end = min(start + chunk_size, len(text))
                        chunk_text = text[start:end].strip()

                        if len(chunk_text) > 40:
                            # Prepend source header context for better RAG grounding
                            formatted_text = (
                                f"[File: {relative_path}]\n"
                                f"[Category: {cat.upper()}]\n"
                                f"{chunk_text}"
                            )
                            raw_chunks.append({
                                "file_path": relative_path,
                                "chunk_index": chunk_idx,
                                "category": cat,
                                "content": formatted_text
                            })
                            chunk_idx += 1

                        if end == len(text):
                            break
                        start += (chunk_size - overlap)
                except Exception as e:
                    logger.error(f"Error reading file {file}: {e}")

        logger.info(f"Total raw chunks extracted: {len(raw_chunks)}")

        # Build vocabulary for sparse TF-IDF search
        doc_count = len(raw_chunks)
        doc_freqs: dict[str, int] = {}
        processed_chunks: list[RAGChunk] = []

        # Fit sparse TF-IDF frequencies
        for chunk_data in raw_chunks:
            tokens = clean_and_tokenize(chunk_data["content"])
            unique_tokens = set(tokens)
            for token in unique_tokens:
                doc_freqs[token] = doc_freqs.get(token, 0) + 1

        # Compute global IDFs
        idf_map = {}
        for token, df in doc_freqs.items():
            idf_map[token] = math.log(1.0 + (doc_count / (1.0 + df)))

        # Process each chunk: compute TF representations and fetch dense embeddings (optional/best effort)
        vocab = set(doc_freqs.keys())
        indexed_count = 0

        for idx, chunk_data in enumerate(raw_chunks):
            tokens = clean_and_tokenize(chunk_data["content"])
            term_freq = {}
            for token in tokens:
                term_freq[token] = term_freq.get(token, 0.0) + 1.0

            # Normalize term frequencies
            total_terms = sum(term_freq.values()) or 1.0
            for token in term_freq:
                term_freq[token] = term_freq[token] / total_terms

            # Fetch dense embeddings via public HF API (only for first 150 critical files to prevent throttling, or all)
            dense_vector = None
            # Only generate dense embeddings for README and core documents to keep it fast, or standard 100 docs
            if indexed_count < 180:
                dense_vector = self.get_dense_embedding(chunk_data["content"])
                if dense_vector:
                    indexed_count += 1

            chunk_obj = RAGChunk(
                file_path=chunk_data["file_path"],
                chunk_index=chunk_data["chunk_index"],
                category=chunk_data["category"],
                content=chunk_data["content"],
                dense_embedding=dense_vector,
                term_freq=term_freq
            )
            processed_chunks.append(chunk_obj)

        self.chunks = processed_chunks
        self.vocabulary = vocab
        self.idf_map = idf_map

        # Save to local vector store
        self.save_vector_store()
        return {
            "total_chunks": len(self.chunks),
            "dense_indexed": indexed_count,
            "vocabulary_size": len(self.vocabulary)
        }

    def save_vector_store(self):
        """Save vector store to a JSON file."""
        try:
            VECTOR_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
            serialized_chunks = []
            for chunk in self.chunks:
                serialized_chunks.append({
                    "file_path": chunk.file_path,
                    "chunk_index": chunk.chunk_index,
                    "category": chunk.category,
                    "content": chunk.content,
                    "dense_embedding": chunk.dense_embedding,
                    "term_freq": chunk.term_freq
                })
            payload = {
                "vocabulary": list(self.vocabulary),
                "idf_map": self.idf_map,
                "chunks": serialized_chunks
            }
            with open(VECTOR_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            logger.info(f"Vector store saved with {len(self.chunks)} chunks at {VECTOR_STORE_PATH}")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")

    def load_vector_store(self):
        """Load vector store from JSON file."""
        if not VECTOR_STORE_PATH.exists():
            logger.warning(f"Vector store file {VECTOR_STORE_PATH} does not exist. Index is empty.")
            return

        try:
            with open(VECTOR_STORE_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
            self.vocabulary = set(payload.get("vocabulary", []))
            self.idf_map = payload.get("idf_map", {})
            self.chunks = []
            for item in payload.get("chunks", []):
                chunk = RAGChunk(
                    file_path=item["file_path"],
                    chunk_index=item["chunk_index"],
                    category=item["category"],
                    content=item["content"],
                    dense_embedding=item.get("dense_embedding"),
                    term_freq=item.get("term_freq")
                )
                self.chunks.append(chunk)
            logger.info(f"Loaded vector store with {len(self.chunks)} chunks.")
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")

    def score_sparse_tfidf(self, query_tokens: list[str], chunk: RAGChunk) -> float:
        """Compute sparse cosine-like similarity score using TF-IDF."""
        if not chunk.term_freq:
            return 0.0
        score = 0.0
        # Dot product of query tf-idf * document tf-idf
        # Query TF is assumed binary/equal weight for present tokens
        doc_tf = chunk.term_freq
        for token in query_tokens:
            if token in doc_tf:
                idf = self.idf_map.get(token, 1.0)
                score += doc_tf[token] * idf * idf
        return score

    def retrieve(self, query: str, limit: int = 5) -> list[dict]:
        """Retrieve most relevant chunks using dual dense + sparse fallback similarity search."""
        if not self.chunks:
            # If empty, return nothing
            return []

        query_tokens = clean_and_tokenize(query)
        dense_query_vector = self.get_dense_embedding(query)

        scored_hits = []
        is_dense_search = dense_query_vector is not None

        for chunk in self.chunks:
            score = 0.0
            if is_dense_search and chunk.dense_embedding:
                score = compute_cosine_similarity(dense_query_vector, chunk.dense_embedding)
            else:
                # Sparse TF-IDF similarity search fallback
                score = self.score_sparse_tfidf(query_tokens, chunk)

            if score > 0.0:
                scored_hits.append({
                    "score": round(score, 4),
                    "file_path": chunk.file_path,
                    "category": chunk.category,
                    "content": chunk.content
                })

        # Sort by similarity score descending
        scored_hits.sort(key=lambda x: x["score"], reverse=True)
        return scored_hits[:limit]

# Global pipeline instance
rag_pipeline = RAGPipeline()
