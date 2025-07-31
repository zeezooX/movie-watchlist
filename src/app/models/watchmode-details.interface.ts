export interface WatchmodeTitleDetails {
  id: number;
  title: string;
  original_title?: string;
  plot_overview?: string;
  type: string;
  runtime_minutes?: number;
  year?: number;
  end_year?: number;
  release_date?: string;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  genres?: number[];
  genre_names?: string[];
  user_rating?: number;
  critic_score?: number;
  us_rating?: string;
  poster?: string;
  backdrop?: string;
  original_language?: string;
  networks?: number[];
  network_names?: string[];
  relevance_percentile?: number;
}
