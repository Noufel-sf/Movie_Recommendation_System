import json
import time
from pathlib import Path
import pandas as pd
import requests

TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8"
BASE_URL = "https://api.themoviedb.org/3/movie"

def fetch_and_cache_tmdb_metadata(limit: int = 150):
    raw_dir = Path("data/raw/ml-latest-small")
    processed_dir = Path("data/processed")
    cache_file = processed_dir / "tmdb_cache.json"

    # Load existing cache if any
    cache = {}
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    # Load links and ratings to identify top movies
    links_df = pd.read_csv(raw_dir / "links.csv")
    ratings_df = pd.read_parquet(processed_dir / "ratings_train.parquet")
    
    # Get top movies by vote count
    top_movie_ids = ratings_df["movie_id"].value_counts().head(limit).index.tolist()
    
    # Map movieId to tmdbId
    movie_to_tmdb = links_df.set_index("movieId")["tmdbId"].to_dict()

    print(f"Fetching TMDB metadata for top {len(top_movie_ids)} movies...")
    fetched_count = 0

    for mid in top_movie_ids:
        tid = movie_to_tmdb.get(mid)
        if pd.isna(tid) or int(tid) <= 0:
            continue
        tid = int(tid)
        mid_str = str(mid)

        if mid_str in cache:
            continue

        try:
            url = f"{BASE_URL}/{tid}?api_key={TMDB_API_KEY}&language=en-US"
            resp = requests.get(url, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                poster = data.get("poster_path")
                backdrop = data.get("backdrop_path")
                cache[mid_str] = {
                    "tmdb_id": tid,
                    "title": data.get("title"),
                    "poster_url": f"https://image.tmdb.org/t/p/w500{poster}" if poster else None,
                    "backdrop_url": f"https://image.tmdb.org/t/p/original{backdrop}" if backdrop else None,
                    "overview": data.get("overview") or "No synopsis available.",
                    "runtime": data.get("runtime") or 110,
                    "vote_average": data.get("vote_average") or 7.5,
                    "vote_count": data.get("vote_count") or 1000,
                    "tagline": data.get("tagline") or "",
                }
                fetched_count += 1
                if fetched_count % 25 == 0:
                    print(f"Fetched {fetched_count} metadata records...")
            time.sleep(0.04)  # Respect rate limit
        except Exception:
            continue

    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

    print(f"Successfully cached {len(cache)} movie posters and backdrops to {cache_file}!")

if __name__ == "__main__":
    fetch_and_cache_tmdb_metadata(limit=150)
