import pandas as pd
import numpy as np
from pathlib import Path

from ml.src.models.baseline import MostPopularRecommender, IMDBWeightedRecommender
from ml.src.evaluation.metrics import precision_at_k, recall_at_k, ndcg_at_k, rmse, mae


def evaluate_ranking(
    model, 
    test_df: pd.DataFrame, 
    k: int = 10, 
    relevance_threshold: float = 3.5
) -> dict[str, float]:
    """
    Evaluate ranking performance of a recommender across all test users.
    Only items rated >= relevance_threshold (e.g. 3.5+) are considered relevant.
    """
    precisions, recalls, ndcgs = [], [], []
    
    # Group test items by user
    user_test_groups = test_df.groupby("user_id")

    for user_id, group in user_test_groups:
        # Ground truth relevant movies for this user in the test period
        relevant_movies = set(group[group["rating"] >= relevance_threshold]["movie_id"])
        if not relevant_movies:
            continue
            
        # Get top-K recommendations
        recs = model.recommend(user_id=int(user_id), n=k, exclude_seen=True)
        rec_ids = [mid for mid, _ in recs]
        
        precisions.append(precision_at_k(rec_ids, relevant_movies, k=k))
        recalls.append(recall_at_k(rec_ids, relevant_movies, k=k))
        ndcgs.append(ndcg_at_k(rec_ids, relevant_movies, k=k))

    return {
        f"Precision@{k}": float(np.mean(precisions)) if precisions else 0.0,
        f"Recall@{k}": float(np.mean(recalls)) if recalls else 0.0,
        f"NDCG@{k}": float(np.mean(ndcgs)) if ndcgs else 0.0,
        "evaluated_users": len(precisions)
    }


def main():
    processed_dir = Path("data/processed")
    train_df = pd.read_parquet(processed_dir / "ratings_train.parquet")
    test_df = pd.read_parquet(processed_dir / "ratings_test.parquet")
    
    print(f"Loaded {len(train_df):,} train ratings, {len(test_df):,} test ratings.")

    # 1. Train Most Popular Recommender
    print("\nTraining Most Popular Recommender...")
    popular_model = MostPopularRecommender().fit(train_df)
    pop_metrics = evaluate_ranking(popular_model, test_df, k=10)

    # 2. Train IMDB Weighted Rating Recommender
    print("Training IMDB Weighted Rating Recommender (m=10)...")
    imdb_model = IMDBWeightedRecommender(m=10.0).fit(train_df)
    imdb_metrics = evaluate_ranking(imdb_model, test_df, k=10)

    # 3. Rating prediction error for IMDB model on test pairs
    preds = [imdb_model.predict(row.user_id, row.movie_id) for row in test_df.itertuples()]
    test_rmse = rmse(test_df["rating"].values, preds)
    test_mae = mae(test_df["rating"].values, preds)

    print("\n=================== BASELINE EVALUATION BENCHMARK ===================")
    print(f"{'Metric':<18} | {'Most Popular':<16} | {'IMDB Weighted':<16}")
    print("-" * 56)
    print(f"{'Precision@10':<18} | {pop_metrics['Precision@10']:<16.4f} | {imdb_metrics['Precision@10']:<16.4f}")
    print(f"{'Recall@10':<18} | {pop_metrics['Recall@10']:<16.4f} | {imdb_metrics['Recall@10']:<16.4f}")
    print(f"{'NDCG@10':<18} | {pop_metrics['NDCG@10']:<16.4f} | {imdb_metrics['NDCG@10']:<16.4f}")
    print(f"{'RMSE (Rating)':<18} | {'N/A (Counts)':<16} | {test_rmse:<16.4f}")
    print(f"{'MAE (Rating)':<18} | {'N/A (Counts)':<16} | {test_mae:<16.4f}")
    print("=" * 56)


if __name__ == "__main__":
    main()
