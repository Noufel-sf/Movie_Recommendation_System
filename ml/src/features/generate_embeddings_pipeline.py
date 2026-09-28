"""Offline Pipeline: Generates dense movie embeddings and pgvector database init script."""

from pathlib import Path
import pandas as pd
from ml.src.features.embeddings import MovieEmbeddingGenerator


def run_embedding_pipeline():
    data_dir = Path("data/processed")
    movies_path = data_dir / "movies.parquet"
    ratings_path = data_dir / "ratings_train.parquet"
    embeddings_output_path = data_dir / "movie_embeddings.parquet"
    init_sql_path = Path("infrastructure/docker/postgres/init.sql")

    print(f"Reading movies from {movies_path}...")
    movies_df = pd.read_parquet(movies_path)
    ratings_df = pd.read_parquet(ratings_path) if ratings_path.exists() else None

    print(f"Generating 64-dimensional dense embeddings for {len(movies_df):,} movies...")
    generator = MovieEmbeddingGenerator(target_dim=64)
    embeddings = generator.fit_transform(movies_df, ratings_df)

    print(f"Generated embeddings shape: {embeddings.shape}")
    generator.save_parquet(embeddings_output_path)

    # Generate pgvector DDL with HNSW Index
    sql_script = generator.generate_pgvector_sql()
    init_sql_path.parent.mkdir(parents=True, exist_ok=True)
    with open(init_sql_path, "w", encoding="utf-8") as f:
        f.write(sql_script)

    print(f"Updated pgvector SQL schema with HNSW index at {init_sql_path}")


if __name__ == "__main__":
    run_embedding_pipeline()
