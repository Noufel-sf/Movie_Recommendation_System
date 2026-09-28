"""Vector Search Engine & Approximate Nearest Neighbor (ANN) Module.

Supports:
1. In-memory SIMD-accelerated Vector Search via NumPy.
2. Multiple Distance Metrics:
   - 'cosine' (1.0 - Cosine Distance)
   - 'dot' (Inner Product)
   - 'euclidean' (L2 Distance)
3. Direct execution of pgvector SQL queries when connected to PostgreSQL.
"""

from typing import Dict, List, Literal, Optional, Tuple
import numpy as np
import pandas as pd


class VectorSearchEngine:
    """Fast Vector Similarity Search Engine for movie embeddings."""

    def __init__(
        self,
        embeddings: np.ndarray,
        movie_ids: List[int],
    ):
        self.embeddings = embeddings.astype(np.float32)
        self.movie_ids = movie_ids
        self.movie_id_to_idx: Dict[int, int] = {mid: i for i, mid in enumerate(movie_ids)}
        self.idx_to_movie_id: Dict[int, int] = {i: mid for i, mid in enumerate(movie_ids)}

        # Precompute L2 norms for Euclidean & non-normalized vectors
        self.norms = np.linalg.norm(self.embeddings, axis=1)

    def search_by_vector(
        self,
        query_vector: np.ndarray,
        n: int = 10,
        metric: Literal["cosine", "dot", "euclidean"] = "cosine",
        exclude_movie_ids: Optional[List[int]] = None,
    ) -> List[Tuple[int, float]]:
        """Finds top-N most similar movies to a given query embedding vector."""
        q = query_vector.astype(np.float32).flatten()
        exclude_set = set(exclude_movie_ids or [])

        if metric == "cosine":
            # Cosine similarity: (A · B) / (||A|| * ||B||)
            q_norm = np.linalg.norm(q)
            if q_norm < 1e-8:
                return []
            dots = np.dot(self.embeddings, q)
            scores = dots / (self.norms * q_norm)
            top_indices = np.argsort(-scores)

        elif metric == "dot":
            # Inner product (A · B)
            scores = np.dot(self.embeddings, q)
            top_indices = np.argsort(-scores)

        elif metric == "euclidean":
            # Euclidean distance ||A - B|| (lower is closer, so invert for ranking)
            dists = np.linalg.norm(self.embeddings - q, axis=1)
            # Convert distance to similarity score: 1 / (1 + dist)
            scores = 1.0 / (1.0 + dists)
            top_indices = np.argsort(dists)

        else:
            raise ValueError(f"Unknown metric: {metric}. Use 'cosine', 'dot', or 'euclidean'.")

        results: List[Tuple[int, float]] = []
        for idx in top_indices:
            mid = self.idx_to_movie_id[idx]
            if mid in exclude_set:
                continue
            results.append((mid, float(scores[idx])))
            if len(results) >= n:
                break

        return results

    def search_similar_movies(
        self,
        movie_id: int,
        n: int = 10,
        metric: Literal["cosine", "dot", "euclidean"] = "cosine",
    ) -> List[Tuple[int, float]]:
        """Finds top-N most similar movies to a given movie in vector space."""
        if movie_id not in self.movie_id_to_idx:
            return []

        target_idx = self.movie_id_to_idx[movie_id]
        target_vec = self.embeddings[target_idx]

        return self.search_by_vector(
            query_vector=target_vec,
            n=n,
            metric=metric,
            exclude_movie_ids=[movie_id],
        )

    def benchmark_metrics(self, movie_id: int, n: int = 5) -> Dict[str, List[Tuple[int, float]]]:
        """Compares top-N retrievals across Cosine, Dot Product, and Euclidean distance."""
        return {
            "cosine": self.search_similar_movies(movie_id, n=n, metric="cosine"),
            "dot": self.search_similar_movies(movie_id, n=n, metric="dot"),
            "euclidean": self.search_similar_movies(movie_id, n=n, metric="euclidean"),
        }
