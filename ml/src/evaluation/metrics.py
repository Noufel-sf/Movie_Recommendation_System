import numpy as np
import math


def rmse(y_true: list[float] | np.ndarray, y_pred: list[float] | np.ndarray) -> float:
    """
    Root Mean Squared Error:
    Measures the standard deviation of prediction errors (residuals).
    Penalizes large errors heavily due to squaring.
    """
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)
    if len(y_true_arr) == 0:
        return 0.0
    return float(np.sqrt(np.mean((y_true_arr - y_pred_arr) ** 2)))


def mae(y_true: list[float] | np.ndarray, y_pred: list[float] | np.ndarray) -> float:
    """
    Mean Absolute Error:
    Measures the average magnitude of the errors without direction.
    Robust to extreme outliers compared to RMSE.
    """
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)
    if len(y_true_arr) == 0:
        return 0.0
    return float(np.mean(np.abs(y_true_arr - y_pred_arr)))


def precision_at_k(
    recommended_ids: list[int], 
    actual_relevant_ids: set[int] | list[int], 
    k: int = 10
) -> float:
    """
    Precision@K:
    What fraction of the top-K recommended items were actually relevant?
    Formula: (# relevant items in top-K) / K
    """
    if k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    relevant_set = set(actual_relevant_ids)
    hits = sum(1 for item in top_k if item in relevant_set)
    return hits / k


def recall_at_k(
    recommended_ids: list[int], 
    actual_relevant_ids: set[int] | list[int], 
    k: int = 10
) -> float:
    """
    Recall@K:
    What fraction of all actual relevant items did the top-K recommendations capture?
    Formula: (# relevant items in top-K) / (total # relevant items)
    """
    relevant_set = set(actual_relevant_ids)
    if len(relevant_set) == 0:
        return 0.0
    top_k = recommended_ids[:k]
    hits = sum(1 for item in top_k if item in relevant_set)
    return hits / len(relevant_set)


def ndcg_at_k(
    recommended_ids: list[int], 
    actual_relevant_ids: set[int] | list[int], 
    k: int = 10
) -> float:
    """
    Normalized Discounted Cumulative Gain at K (NDCG@K):
    Measures ranking quality with position discount. An item recommended at position 1
    yields more gain than an item at position 10.
    
    Formula:
        DCG@K = sum_{i=1}^K [ rel_i / log2(i + 1) ]
        IDCG@K = sum_{i=1}^{min(K, |relevant|)} [ 1 / log2(i + 1) ] (Ideal ranking)
        NDCG@K = DCG@K / IDCG@K
    """
    if k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    relevant_set = set(actual_relevant_ids)
    
    if len(relevant_set) == 0:
        return 0.0

    # Compute Discounted Cumulative Gain (DCG)
    dcg = 0.0
    for i, item_id in enumerate(top_k):
        if item_id in relevant_set:
            # i is 0-indexed, so rank = i + 1. log2(rank + 1) -> math.log2(i + 2)
            dcg += 1.0 / math.log2(i + 2)

    # Compute Ideal Discounted Cumulative Gain (IDCG)
    ideal_hits = min(k, len(relevant_set))
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))

    if idcg == 0.0:
        return 0.0

    return dcg / idcg
