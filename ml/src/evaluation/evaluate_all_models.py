import time
from pathlib import Path
import pandas as pd
import numpy as np

from ml.src.models.baseline import MostPopularRecommender, IMDBWeightedRecommender
from ml.src.models.content_based import ContentBasedRecommender
from ml.src.models.collaborative_filtering import ItemItemCollaborativeRecommender
from ml.src.models.matrix_factorization import ExplicitSGDMatrixFactorization
from ml.src.evaluation.metrics import (
    rmse,
    mae,
    precision_at_k,
    recall_at_k,
    ndcg_at_k,
    average_precision_at_k,
    catalog_coverage,
)


def evaluate_model(
    model_name: str,
    model,
    test_df: pd.DataFrame,
    total_catalog_size: int,
    k_list: list[int] = [5, 10],
    relevance_threshold: float = 3.5,
    max_eval_users: int = 150,
) -> dict:
    """
    Evaluates both rating prediction (RMSE/MAE) and ranking (Precision/Recall/MAP/NDCG/Coverage)
    on a test set of user interactions.
    """
    # 1. Rating prediction evaluation (if model supports predict)
    test_actuals = []
    test_preds = []
    
    # Filter test items to evaluate rating predictions
    sample_ratings = test_df.sample(min(2000, len(test_df)), random_state=42)
    for _, row in sample_ratings.iterrows():
        uid = int(row["user_id"])
        mid = int(row["movie_id"])
        actual = float(row["rating"])
        try:
            pred = model.predict(uid, mid)
            if pred is not None and not np.isnan(pred):
                test_actuals.append(actual)
                test_preds.append(float(pred))
        except Exception:
            pass

    model_rmse = rmse(test_actuals, test_preds) if test_actuals else None
    model_mae = mae(test_actuals, test_preds) if test_actuals else None

    # 2. Ranking evaluation per user
    user_test_groups = list(test_df.groupby("user_id"))
    np.random.seed(42)
    if len(user_test_groups) > max_eval_users:
        user_indices = np.random.choice(len(user_test_groups), max_eval_users, replace=False)
        selected_groups = [user_test_groups[i] for i in user_indices]
    else:
        selected_groups = user_test_groups

    p_5, r_5, ndcg_5 = [], [], []
    p_10, r_10, ndcg_10, map_10 = [], [], [], []
    all_recs_10 = []

    for uid, group in selected_groups:
        relevant_movies = set(group[group["rating"] >= relevance_threshold]["movie_id"])
        if not relevant_movies:
            continue

        try:
            recs = model.recommend(user_id=int(uid), n=10, exclude_seen=True)
            rec_ids = [mid for mid, _ in recs]
        except Exception:
            rec_ids = []

        all_recs_10.append(rec_ids)

        # K = 5
        p_5.append(precision_at_k(rec_ids, relevant_movies, k=5))
        r_5.append(recall_at_k(rec_ids, relevant_movies, k=5))
        ndcg_5.append(ndcg_at_k(rec_ids, relevant_movies, k=5))

        # K = 10
        p_10.append(precision_at_k(rec_ids, relevant_movies, k=10))
        r_10.append(recall_at_k(rec_ids, relevant_movies, k=10))
        ndcg_10.append(ndcg_at_k(rec_ids, relevant_movies, k=10))
        map_10.append(average_precision_at_k(rec_ids, relevant_movies, k=10))

    coverage = catalog_coverage(all_recs_10, total_catalog_size)

    return {
        "Model": model_name,
        "RMSE": round(model_rmse, 4) if model_rmse is not None else "N/A",
        "MAE": round(model_mae, 4) if model_mae is not None else "N/A",
        "P@5": round(float(np.mean(p_5)), 4) if p_5 else 0.0,
        "R@5": round(float(np.mean(r_5)), 4) if r_5 else 0.0,
        "NDCG@5": round(float(np.mean(ndcg_5)), 4) if ndcg_5 else 0.0,
        "P@10": round(float(np.mean(p_10)), 4) if p_10 else 0.0,
        "R@10": round(float(np.mean(r_10)), 4) if r_10 else 0.0,
        "NDCG@10": round(float(np.mean(ndcg_10)), 4) if ndcg_10 else 0.0,
        "MAP@10": round(float(np.mean(map_10)), 4) if map_10 else 0.0,
        "Coverage": f"{round(coverage * 100, 2)}%",
    }


def run_benchmark():
    data_dir = Path("data/processed")
    train_df = pd.read_parquet(data_dir / "ratings_train.parquet")
    test_df = pd.read_parquet(data_dir / "ratings_test.parquet")
    movies_df = pd.read_parquet(data_dir / "movies.parquet")
    total_catalog_size = len(movies_df)

    print("=" * 80)
    print(f"RUNNING COMPREHENSIVE BENCHMARK (Phase 6)")
    print(f"Train size: {len(train_df):,} | Test size: {len(test_df):,} | Catalog: {total_catalog_size:,} movies")
    print("=" * 80)

    results = []

    # 1. Most Popular Baseline
    print("\n[1/5] Training Most Popular Baseline...")
    t0 = time.time()
    pop_model = MostPopularRecommender().fit(train_df)
    res_pop = evaluate_model("1. Most Popular", pop_model, test_df, total_catalog_size)
    print(f"  Done in {time.time() - t0:.2f}s -> P@10: {res_pop['P@10']}, NDCG@10: {res_pop['NDCG@10']}, Cov: {res_pop['Coverage']}")
    results.append(res_pop)

    # 2. IMDB Bayesian Weighted Baseline
    print("\n[2/5] Training IMDB Bayesian Shrinkage Baseline...")
    t0 = time.time()
    imdb_model = IMDBWeightedRecommender(m=10.0).fit(train_df)
    res_imdb = evaluate_model("2. IMDB Bayesian", imdb_model, test_df, total_catalog_size)
    print(f"  Done in {time.time() - t0:.2f}s -> P@10: {res_imdb['P@10']}, NDCG@10: {res_imdb['NDCG@10']}, Cov: {res_imdb['Coverage']}")
    results.append(res_imdb)

    # 3. Content-Based Recommender (TF-IDF & Genres)
    print("\n[3/5] Training Content-Based (TF-IDF & Genre Vectors)...")
    t0 = time.time()
    content_model = ContentBasedRecommender().fit(train_df, movies_df)
    res_content = evaluate_model("3. Content-Based", content_model, test_df, total_catalog_size)
    print(f"  Done in {time.time() - t0:.2f}s -> P@10: {res_content['P@10']}, NDCG@10: {res_content['NDCG@10']}, Cov: {res_content['Coverage']}")
    results.append(res_content)

    # 4. Item-Item Collaborative Filtering
    print("\n[4/5] Training Item-Item Collaborative Filtering (Adjusted Cosine)...")
    t0 = time.time()
    cf_model = ItemItemCollaborativeRecommender(k_neighbors=20, min_co_raters=3).fit(train_df)
    res_cf = evaluate_model("4. Item-Item CF", cf_model, test_df, total_catalog_size)
    print(f"  Done in {time.time() - t0:.2f}s -> P@10: {res_cf['P@10']}, NDCG@10: {res_cf['NDCG@10']}, Cov: {res_cf['Coverage']}")
    results.append(res_cf)

    # 5. Matrix Factorization (Explicit SGD SVD)
    print("\n[5/5] Training Matrix Factorization (20 Latent Factors SGD)...")
    t0 = time.time()
    mf_model = ExplicitSGDMatrixFactorization(n_factors=20, lr=0.005, reg=0.02, n_epochs=15).fit(train_df)
    res_mf = evaluate_model("5. SVD Latent MF", mf_model, test_df, total_catalog_size)
    print(f"  Done in {time.time() - t0:.2f}s -> P@10: {res_mf['P@10']}, NDCG@10: {res_mf['NDCG@10']}, Cov: {res_mf['Coverage']}")
    results.append(res_mf)

    # Summary Comparison Table
    df_results = pd.DataFrame(results)
    print("\n" + "=" * 80)
    print("FINAL MODEL BENCHMARK COMPARISON TABLE")
    print("=" * 80)
    print(df_results.to_string(index=False))

    # Save to CSV for persistent documentation
    output_path = data_dir / "model_benchmark_results.csv"
    df_results.to_csv(output_path, index=False)
    print(f"\nSaved benchmark results to {output_path}")

    return df_results


if __name__ == "__main__":
    run_benchmark()
