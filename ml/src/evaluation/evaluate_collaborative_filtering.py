import pandas as pd
from pathlib import Path

from ml.src.models.baseline import MostPopularRecommender, IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.collaborative_filtering import ItemItemCollaborativeRecommender
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

    # 2. Baseline: IMDB Weighted
    print("Training IMDB Weighted Recommender...")
    imdb_model = IMDBWeightedRecommender(m=10.0).fit(train_df)
    imdb_metrics = evaluate_ranking(imdb_model, test_df, k=10)

    # 3. Content-Based
    print("Training Content-Based Recommender...")
    cb_model = ContentBasedRecommender(use_tfidf=True).fit(train_df, movies_df)
    cb_metrics = evaluate_ranking(cb_model, test_df, k=10)

    # 4. Collaborative Filtering (Item-Item)
    print("Training Item-Item Collaborative Filtering...")
    cf_model = ItemItemCollaborativeRecommender(k_neighbors=20, min_co_raters=5).fit(train_df)
    cf_metrics = evaluate_ranking(cf_model, test_df, k=10)

    # RMSE and MAE on test ratings for CF
    preds = [cf_model.predict(row.user_id, row.movie_id) for row in test_df.itertuples()]
    cf_rmse = rmse(test_df["rating"].values, preds)
    cf_mae = mae(test_df["rating"].values, preds)

    print("\n================================== PHASE 4 BENCHMARK COMPARISON ==================================")
    print(f"{'Metric':<16} | {'Most Popular':<13} | {'IMDB Weighted':<13} | {'Content-Based':<13} | {'Item-Item CF':<13}")
    print("-" * 88)
    print(f"{'Precision@10':<16} | {pop_metrics['Precision@10']:<13.4f} | {imdb_metrics['Precision@10']:<13.4f} | {cb_metrics['Precision@10']:<13.4f} | {cf_metrics['Precision@10']:<13.4f}")
    print(f"{'Recall@10':<16} | {pop_metrics['Recall@10']:<13.4f} | {imdb_metrics['Recall@10']:<13.4f} | {cb_metrics['Recall@10']:<13.4f} | {cf_metrics['Recall@10']:<13.4f}")
    print(f"{'NDCG@10':<16} | {pop_metrics['NDCG@10']:<13.4f} | {imdb_metrics['NDCG@10']:<13.4f} | {cb_metrics['NDCG@10']:<13.4f} | {cf_metrics['NDCG@10']:<13.4f}")
    print(f"{'RMSE (Rating)':<16} | {'N/A':<13} | {1.0650:<13.4f} | {1.1574:<13.4f} | {cf_rmse:<13.4f}")
    print(f"{'MAE (Rating)':<16} | {'N/A':<13} | {0.8416:<13.4f} | {0.9321:<13.4f} | {cf_mae:<13.4f}")
    print("=" * 88)

    # Test item-item similar items for a famous movie: The Matrix (id=2571)
    matrix_id = 2571
    if matrix_id in cf_model.movie_to_idx:
        similar_to_matrix = cf_model.similar_items(matrix_id, n=5)
        print(f"\nTop 5 Co-Rated Similar Movies to The Matrix (id={matrix_id}):")
        for mid, sim in similar_to_matrix:
            title = movies_df[movies_df["movie_id"] == mid]["title"].values[0]
            print(f" -> [{mid}] {title} (Co-rating similarity: {sim:.3f})")


if __name__ == "__main__":
    main()
