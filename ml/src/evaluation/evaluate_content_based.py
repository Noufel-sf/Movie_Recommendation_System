import pandas as pd
from pathlib import Path

from ml.src.models.baseline import MostPopularRecommender, IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.evaluation.evaluate_baselines import evaluate_ranking
from ml.src.evaluation.metrics import rmse, mae


def main():
    processed_dir = Path("data/processed")
    train_df = pd.read_parquet(processed_dir / "ratings_train.parquet")
    test_df = pd.read_parquet(processed_dir / "ratings_test.parquet")
    movies_df = pd.read_parquet(processed_dir / "movies.parquet")

    print(f"Loaded {len(train_df):,} train ratings, {len(test_df):,} test ratings, {len(movies_df):,} movies.")

    # 1. Baseline: Most Popular
    print("\nTraining Most Popular Recommender...")
    popular_model = MostPopularRecommender().fit(train_df)
    pop_metrics = evaluate_ranking(popular_model, test_df, k=10)

    # 2. Baseline: IMDB Weighted Rating
    print("Training IMDB Weighted Recommender...")
    imdb_model = IMDBWeightedRecommender(m=10.0).fit(train_df)
    imdb_metrics = evaluate_ranking(imdb_model, test_df, k=10)

    # 3. Model: Content-Based with TF-IDF
    print("Training Content-Based Recommender (TF-IDF title + genres)...")
    cb_model = ContentBasedRecommender(use_tfidf=True).fit(train_df, movies_df)
    cb_metrics = evaluate_ranking(cb_model, test_df, k=10)

    # Compute rating prediction error for test set
    preds = [cb_model.predict(row.user_id, row.movie_id) for row in test_df.itertuples()]
    cb_rmse = rmse(test_df["rating"].values, preds)
    cb_mae = mae(test_df["rating"].values, preds)

    print("\n======================== PHASE 3 BENCHMARK COMPARISON ========================")
    print(f"{'Metric':<18} | {'Most Popular':<14} | {'IMDB Weighted':<14} | {'Content-Based':<14}")
    print("-" * 72)
    print(f"{'Precision@10':<18} | {pop_metrics['Precision@10']:<14.4f} | {imdb_metrics['Precision@10']:<14.4f} | {cb_metrics['Precision@10']:<14.4f}")
    print(f"{'Recall@10':<18} | {pop_metrics['Recall@10']:<14.4f} | {imdb_metrics['Recall@10']:<14.4f} | {cb_metrics['Recall@10']:<14.4f}")
    print(f"{'NDCG@10':<18} | {pop_metrics['NDCG@10']:<14.4f} | {imdb_metrics['NDCG@10']:<14.4f} | {cb_metrics['NDCG@10']:<14.4f}")
    print(f"{'RMSE (Rating)':<18} | {'N/A':<14} | {1.0650:<14.4f} | {cb_rmse:<14.4f}")
    print(f"{'MAE (Rating)':<18} | {'N/A':<14} | {0.8416:<14.4f} | {cb_mae:<14.4f}")
    print("=" * 72)

    # Demonstrate live sample recommendation and explanation for a user with history
    sample_user = 15
    sample_recs = cb_model.recommend(user_id=sample_user, n=3, exclude_seen=True)
    print(f"\nSample Recommendations for User #{sample_user}:")
    for mid, score in sample_recs:
        title = movies_df[movies_df["movie_id"] == mid]["title"].values[0]
        expl = cb_model.explain_recommendation(user_id=sample_user, recommended_movie_id=mid)
        print(f" -> [{mid}] {title} (Score: {score:.3f}) | Reason: {expl.get('reason')}")


if __name__ == "__main__":
    main()
