export interface Movie {
  movie_id: number;
  title: string;
  clean_title: string;
  release_year: number | null;
  genres: string;
  genres_list: string[];
  score?: number;
  match_score?: number;
  explanation?: string;
  similarity_score?: number;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  tagline?: string;
}

export interface PaginatedMovies {
  items: Movie[];
  total: number;
  page: number;
  page_size: number;
}
