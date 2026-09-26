import os
import re
import zipfile
import urllib.request
from pathlib import Path
import pandas as pd
import numpy as np

MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"

def download_movielens(raw_dir: Path) -> Path:
    """Download MovieLens latest-small dataset if not already present."""
    raw_dir.mkdir(parents=True, exist_ok=True)
    zip_path = raw_dir / "ml-latest-small.zip"
    extracted_folder = raw_dir / "ml-latest-small"

    if not extracted_folder.exists():
        if not zip_path.exists():
            print(f"Downloading MovieLens dataset from {MOVIELENS_URL}...")
            import requests
            response = requests.get(MOVIELENS_URL, stream=True, timeout=30)
            response.raise_for_status()
            with open(zip_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("Download complete.")
        
        print("Extracting zip archive...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(raw_dir)
        print(f"Extracted to {extracted_folder}")
    else:
        print(f"Dataset already present at {extracted_folder}")

    return extracted_folder

def clean_movies(raw_movies_df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and transform raw movies DataFrame:
    - Standardize column names
    - Extract release year from title e.g. 'Toy Story (1995)' -> year=1995
    - Normalize genres into clean pipe-delimited string and list
    """
    df = raw_movies_df.rename(columns={"movieId": "movie_id"}).copy()

    # Extract 4-digit year inside parentheses at the end of the title string
    year_pattern = r"\((\d{4})\)\s*$"
    df["release_year"] = df["title"].str.extract(year_pattern)[0].astype(float)
    
    # Strip year from title for clean display
    df["clean_title"] = df["title"].str.replace(year_pattern, "", regex=True).str.strip()

    # Clean genres: replace '(no genres listed)' with empty string
    df["genres"] = df["genres"].replace("(no genres listed)", "")
    
    return df[["movie_id", "title", "clean_title", "release_year", "genres"]]

def clean_ratings(raw_ratings_df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean ratings DataFrame:
    - Standardize column names
    - Validate rating boundaries [0.5, 5.0]
    - Convert Unix timestamp to integer
    """
    df = raw_ratings_df.rename(columns={"movieId": "movie_id", "userId": "user_id"}).copy()
    
    # Drop invalid ratings if any
    df = df[(df["rating"] >= 0.5) & (df["rating"] <= 5.0)]
    df["timestamp"] = df["timestamp"].astype(int)
    
    # Sort chronologically by timestamp
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    return df[["user_id", "movie_id", "rating", "timestamp"]]

def temporal_split(
    ratings_df: pd.DataFrame, 
    val_ratio: float = 0.1, 
    test_ratio: float = 0.1
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Perform a global time-aware train/validation/test split.
    Guarantees zero data leakage from future into past.
    
    All interactions in train occurred before validation.
    All interactions in validation occurred before test.
    """
    sorted_df = ratings_df.sort_values(by="timestamp").reset_index(drop=True)
    n = len(sorted_df)
    
    train_idx = int(n * (1.0 - val_ratio - test_ratio))
    val_idx = int(n * (1.0 - test_ratio))
    
    train_df = sorted_df.iloc[:train_idx].copy()
    val_df = sorted_df.iloc[train_idx:val_idx].copy()
    test_df = sorted_df.iloc[val_idx:].copy()
    
    return train_df, val_df, test_df

def compute_sparsity(n_users: int, n_items: int, n_ratings: int) -> float:
    """
    Calculate the sparsity of the user-item interaction matrix:
    Sparsity = 1 - (observed_ratings / (n_users * n_items))
    """
    total_possible = n_users * n_items
    if total_possible == 0:
        return 0.0
    return 1.0 - (n_ratings / total_possible)

def run_ingestion_pipeline(
    raw_dir: Path = Path("data/raw"), 
    processed_dir: Path = Path("data/processed")
) -> dict:
    """Full execution of Phase 1 ingestion, validation, and serialization."""
    data_folder = download_movielens(raw_dir)
    
    print("Loading raw CSVs...")
    movies_raw = pd.read_csv(data_folder / "movies.csv")
    ratings_raw = pd.read_csv(data_folder / "ratings.csv")
    
    print("Cleaning & validating data...")
    movies_clean = clean_movies(movies_raw)
    ratings_clean = clean_ratings(ratings_raw)
    
    print("Performing temporal train/val/test split...")
    train_df, val_df, test_df = temporal_split(ratings_clean, val_ratio=0.1, test_ratio=0.1)
    
    # Save processed artifacts to Parquet for high-speed I/O
    processed_dir.mkdir(parents=True, exist_ok=True)
    movies_clean.to_parquet(processed_dir / "movies.parquet", index=False)
    ratings_clean.to_parquet(processed_dir / "ratings_full.parquet", index=False)
    train_df.to_parquet(processed_dir / "ratings_train.parquet", index=False)
    val_df.to_parquet(processed_dir / "ratings_val.parquet", index=False)
    test_df.to_parquet(processed_dir / "ratings_test.parquet", index=False)
    
    # Compute metrics
    n_users = ratings_clean["user_id"].nunique()
    n_movies = ratings_clean["movie_id"].nunique()
    n_ratings = len(ratings_clean)
    sparsity = compute_sparsity(n_users, n_movies, n_ratings)
    
    summary = {
        "num_users": n_users,
        "num_movies": n_movies,
        "num_ratings": n_ratings,
        "sparsity_percent": round(sparsity * 100, 2),
        "train_size": len(train_df),
        "val_size": len(val_df),
        "test_size": len(test_df),
    }
    
    print(f"\n--- Ingestion Pipeline Complete ---")
    print(f"Users: {summary['num_users']}")
    print(f"Movies: {summary['num_movies']}")
    print(f"Ratings: {summary['num_ratings']}")
    print(f"Matrix Sparsity: {summary['sparsity_percent']}%")
    print(f"Train split: {summary['train_size']} ratings")
    print(f"Val split:   {summary['val_size']} ratings")
    print(f"Test split:  {summary['test_size']} ratings")
    
    return summary

if __name__ == "__main__":
    run_ingestion_pipeline()
