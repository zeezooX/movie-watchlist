export interface WatchmodeSearchResponse {
  results: WatchmodeSearchResult[];
}

export interface WatchmodeSearchResult {
  id: number;
  name: string;
  type: string;
  year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
  image_url?: string;
}
