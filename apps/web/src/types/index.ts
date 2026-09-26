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
}

export interface PaginatedMovies {
  items: Movie[];
  total: number;
  page: number;
  page_size: number;
}
