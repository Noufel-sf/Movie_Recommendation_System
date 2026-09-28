import { Movie, PaginatedMovies } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchMovies(
  page: number = 1,
  pageSize: number = 20,
  genre?: string,
  query?: string
): Promise<PaginatedMovies> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (genre && genre !== "All") params.append("genre", genre);
  if (query && query.trim()) params.append("query", query.trim());

  const res = await fetch(`${API_BASE_URL}/movies?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
}

export async function fetchMovieDetail(movieId: number): Promise<Movie> {
  const res = await fetch(`${API_BASE_URL}/movies/${movieId}`);
  if (!res.ok) throw new Error("Failed to fetch movie detail");
  return res.json();
}

export async function fetchTrending(): Promise<{ trending: Movie[] }> {
  const res = await fetch(`${API_BASE_URL}/trending?n=15`);
  if (!res.ok) throw new Error("Failed to fetch trending movies");
  return res.json();
}

export async function fetchSpotlights(): Promise<{ spotlights: Movie[] }> {
  const res = await fetch(`${API_BASE_URL}/spotlights?count=6`);
  if (!res.ok) throw new Error("Failed to fetch spotlights");
  return res.json();
}

export async function fetchRecommendations(
  userId: number,
  n: number = 12,
  model: string = "hybrid"
): Promise<{ recommendations: Movie[]; model?: string }> {
  const res = await fetch(`${API_BASE_URL}/recommendations?user_id=${userId}&n=${n}&model=${model}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

export async function fetchSimilar(movieId: number, n: number = 8): Promise<{ similar_movies: Movie[] }> {
  const res = await fetch(`${API_BASE_URL}/movies/${movieId}/similar?n=${n}`);
  if (!res.ok) throw new Error("Failed to fetch similar movies");
  return res.json();
}

export async function fetchGenres(): Promise<{ genres: string[] }> {
  const res = await fetch(`${API_BASE_URL}/genres`);
  if (!res.ok) throw new Error("Failed to fetch genres");
  return res.json();
}

export async function submitRating(userId: number, movieId: number, rating: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, movie_id: movieId, rating }),
  });
  if (!res.ok) throw new Error("Failed to submit rating");
  return res.json();
}

export async function fetchOnboardingCandidates(perGenre: number = 2): Promise<{ candidates: Movie[]; total: number }> {
  const res = await fetch(`${API_BASE_URL}/onboarding/candidates?per_genre=${perGenre}`);
  if (!res.ok) throw new Error("Failed to fetch onboarding candidates");
  return res.json();
}

export async function submitOnboarding(userId: number, selectedMovieIds: number[]): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, selected_movie_ids: selectedMovieIds }),
  });
  if (!res.ok) throw new Error("Failed to submit onboarding selections");
  return res.json();
}
