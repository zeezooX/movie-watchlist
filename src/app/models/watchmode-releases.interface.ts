export interface WatchmodeReleasesResponse {
  releases: WatchmodeRelease[];
}

export interface WatchmodeRelease {
  id: number;
  title: string;
  type: string;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  season_number?: number | null;
  poster_url?: string;
  source_release_date?: string;
  source_id?: number;
  source_name?: string;
  is_original?: number;
}
