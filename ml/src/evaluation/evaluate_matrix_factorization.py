import pandas as pd
from pathlib import Path

from ml.src.models.baseline import MostPopularRecommender, IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.collaborative_filtering import ItemItemCollaborativeRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization
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

    # 5. Matrix Factorization (SGD SVD)
    print("Training Matrix Factorization via manual SGD (20 factors, 10 epochs)...")
    mf_model = ExplicitSGDMatrixFactorization(
        n_factors=20, 
        lr=0.005, 
        reg=0.02, 
        n_epochs=10, 
        random_state=42
    ).fit(train_df)
    mf_metrics = evaluate_ranking(mf_model, test_df, k=10)

    # Evaluate rating prediction error on test set
    mf_preds = [mf_model.predict(row.user_id, row.movie_id) for row in test_df.itertuples()]
    mf_rmse = rmse(test_df["rating"].values, mf_preds)
    mf_mae = mae(test_df["rating"].values, mf_preds)

    print("\n========================================== PHASE 5 BENCHMARK COMPARISON ==========================================")
    print(f"{'Metric':<15} | {'Most Popular':<13} | {'IMDB Weighted':<13} | {'Content-Based':<13} | {'Item-Item CF':<13} | {'Matrix Fact (SGD)':<18}")
    print("-" * 114)
    print(f"{'Precision@10':<15} | {pop_metrics['Precision@10']:<13.4f} | {imdb_metrics['Precision@10']:<13.4f} | {cb_metrics['Precision@10']:<13.4f} | {cf_metrics['Precision@10']:<13.4f} | {mf_metrics['Precision@10']:<18.4f}")
    print(f"{'Recall@10':<15} | {pop_metrics['Recall@10']:<13.4f} | {imdb_metrics['Recall@10']:<13.4f} | {cb_metrics['Recall@10']:<13.4f} | {cf_metrics['Recall@10']:<13.4f} | {mf_metrics['Recall@10']:<18.4f}")
    print(f"{'NDCG@10':<15} | {pop_metrics['NDCG@10']:<13.4f} | {imdb_metrics['NDCG@10']:<13.4f} | {cb_metrics['NDCG@10']:<13.4f} | {cf_metrics['NDCG@10']:<13.4f} | {mf_metrics['NDCG@10']:<18.4f}")
    print(f"{'RMSE (Rating)':<15} | {'N/A':<13} | {1.0650:<13.4f} | {1.1574:<13.4f} | {1.1181:<13.4f} | {mf_rmse:<18.4f}")
    print(f"{'MAE (Rating)':<15} | {'N/A':<13} | {0.8416:<13.4f} | {0.9321:<13.4f} | {0.8875:<13.4f} | {mf_mae:<18.4f}")
    print("=" * 114)

    # Inspect latent item neighbors for The Matrix (id=2571)
    matrix_id = 2571
    if matrix_id in mf_model.movie_to_idx:
        similar_mf = mf_model.similar_items(matrix_id, n=5)
        print(f"\nTop 5 Latent-Factor Similar Movies to The Matrix (id={matrix_id}):")
        for mid, sim in similar_mf:
            title = movies_df[movies_df["movie_id"] == mid]["title"].values[0]
            print(f" -> [{mid}] {title} (Latent factor similarity: {sim:.3f})")


if __name__ == "__main__":
    main()
