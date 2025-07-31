export interface Movie {
  id: number;
  title: string;
  posterUrl?: string;
  year?: number;
  type: string;
  imdbId?: string;
  tmdbId?: number;
  inWatchlist?: boolean;
  dateAdded?: Date;
}

export interface MovieReview {
  movieId: number;
  rating: number;
  reviewText: string;
  dateCreated: Date;
}
