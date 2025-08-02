import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie, MovieReview } from '../models/movie.interface';
import { WatchmodeSearchResponse } from '../models/watchmode-search.interface';
import { WatchmodeReleasesResponse, WatchmodeRelease } from '../models/watchmode-releases.interface';
import { WatchmodeTitleDetails } from '../models/watchmode-details.interface';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private readonly baseUrl = environment.watchmodeBaseUrl;
  private readonly apiKey = environment.watchmodeApiKey;

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private readonly MAX_CACHE_SIZE = 100;

  // Cache storage
  private readonly searchCache = new Map<string, { data: Movie[], timestamp: number }>();
  private readonly movieDetailsCache = new Map<number, { data: Movie, timestamp: number }>();
  private latestMoviesCache: { data: Movie[], timestamp: number } | null = null;

  private readonly moviesSubject = new BehaviorSubject<Movie[]>([]);
  private readonly watchlistSubject = new BehaviorSubject<Movie[]>([]);
  private readonly reviewsSubject = new BehaviorSubject<MovieReview[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  public movies$ = this.moviesSubject.asObservable();
  public watchlist$ = this.watchlistSubject.asObservable();
  public reviews$ = this.reviewsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.loadFromStorage();
  }

  searchMovies(query: string): Observable<Movie[]> {
    if (!query.trim()) {
      return of([]);
    }

    const cacheKey = query.toLowerCase().trim();
    const cached = this.getFromSearchCache(cacheKey);
    if (cached) {
      return of(cached);
    }

    this.setLoading(true);
    this.clearError();

    const params = new HttpParams()
      .set('apiKey', this.apiKey)
      .set('search_value', query)
      .set('search_type', 2);

    return this.http.get<WatchmodeSearchResponse>(`${this.baseUrl}/autocomplete-search/`, { params })
      .pipe(
        map(response => {
          const movies = response.results.map(result => this.mapSearchResultToMovie(result));
          this.setSearchCache(cacheKey, movies);
          return movies;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => this.handleError('Failed to search movies', error))
      );
  }

  getLatestMovies(): Observable<Movie[]> {
    if (this.latestMoviesCache && this.isCacheValid(this.latestMoviesCache.timestamp)) {
      this.moviesSubject.next(this.latestMoviesCache.data);
      return of(this.latestMoviesCache.data);
    }

    this.setLoading(true);
    this.clearError();

    const params = new HttpParams()
      .set('apiKey', this.apiKey)

    return this.http.get<WatchmodeReleasesResponse>(`${this.baseUrl}/releases/`, { params })
      .pipe(
        map(response => {
          const movies = response.releases.map(release => this.mapReleaseToMovie(release));
          this.latestMoviesCache = { data: movies, timestamp: Date.now() };
          this.moviesSubject.next(movies);
          return movies;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => this.handleError('Failed to fetch latest movies', error))
      );
  }

  getMovieDetails(movieId: number): Observable<Movie | null> {
    const cached = this.getFromMovieDetailsCache(movieId);
    if (cached) {
      return of(cached);
    }

    this.setLoading(true);
    this.clearError();

    const params = new HttpParams()
      .set('apiKey', this.apiKey)

    return this.http.get<WatchmodeTitleDetails>(`${this.baseUrl}/title/${movieId}/details/`, { params })
      .pipe(
        map(details => {
          const movie = this.mapDetailsToMovie(details);
          this.setMovieDetailsCache(movieId, movie);
          return movie;
        }),
        tap(() => this.setLoading(false)),
        catchError(error => this.handleError('Failed to fetch movie details', error))
      );
  }

  addToWatchlist(movie: Movie): void {
    const currentWatchlist = this.watchlistSubject.value;
    const isAlreadyInWatchlist = currentWatchlist.some(item => item.id === movie.id);
    
    if (!isAlreadyInWatchlist) {
      const movieWithWatchlistFlag = { ...movie, inWatchlist: true, dateAdded: new Date() };
      const updatedWatchlist = [...currentWatchlist, movieWithWatchlistFlag];
      this.watchlistSubject.next(updatedWatchlist);
      this.saveToStorage();
    }
  }

  removeFromWatchlist(movieId: number): void {
    const currentWatchlist = this.watchlistSubject.value;
    const updatedWatchlist = currentWatchlist.filter(movie => movie.id !== movieId);
    this.watchlistSubject.next(updatedWatchlist);
    this.saveToStorage();
  }

  isInWatchlist(movieId: number): boolean {
    return this.watchlistSubject.value.some(movie => movie.id === movieId);
  }

  addReview(review: MovieReview): void {
    const currentReviews = this.reviewsSubject.value;
    const existingReviewIndex = currentReviews.findIndex(r => r.movieId === review.movieId);
    
    if (existingReviewIndex >= 0) {
      currentReviews[existingReviewIndex] = { ...review };
    } else {
      currentReviews.push({ ...review });
    }
    
    this.reviewsSubject.next([...currentReviews]);
    this.saveToStorage();
  }

  getReviewForMovie(movieId: number): MovieReview | undefined {
    return this.reviewsSubject.value.find(review => review.movieId === movieId);
  }

  private mapSearchResultToMovie(result: any): Movie {
    return {
      id: result.id,
      title: result.name,
      type: result.type,
      year: result.year,
      posterUrl: result.image_url,
      imdbId: result.imdb_id,
      tmdbId: result.tmdb_id
    };
  }

  private mapReleaseToMovie(release: WatchmodeRelease): Movie {
    return {
      id: release.id,
      title: release.title,
      type: release.type,
      year: release.source_release_date ? new Date(release.source_release_date).getFullYear() : undefined,
      posterUrl: release.poster_url,
      imdbId: release.imdb_id,
      tmdbId: release.tmdb_id,
    };
  }

  private mapDetailsToMovie(details: WatchmodeTitleDetails): Movie {
    return {
      id: details.id,
      title: details.title,
      type: details.type,
      year: details.year,
      posterUrl: details.poster,
      imdbId: details.imdb_id,
      tmdbId: details.tmdb_id,
    };
  }

  private handleError(message: string, error: any): Observable<any> {
    console.error(message, error);
    this.setError(message);
    this.setLoading(false);
    return of(null);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private saveToStorage(): void {
    localStorage.setItem('movieWatchlist', JSON.stringify(this.watchlistSubject.value));
    localStorage.setItem('movieReviews', JSON.stringify(this.reviewsSubject.value));
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const watchlistData = localStorage.getItem('movieWatchlist');
      if (watchlistData) {
        const watchlist = JSON.parse(watchlistData);
        this.watchlistSubject.next(watchlist);
      }

      const reviewsData = localStorage.getItem('movieReviews');
      if (reviewsData) {
        const reviews = JSON.parse(reviewsData);
        this.reviewsSubject.next(reviews);
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  }

  // Cache management methods
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getFromSearchCache(key: string): Movie[] | null {
    const cached = this.searchCache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    if (cached) {
      this.searchCache.delete(key);
    }
    return null;
  }

  private setSearchCache(key: string, data: Movie[]): void {
    this.cleanupSearchCache();
    this.searchCache.set(key, { data, timestamp: Date.now() });
  }

  private cleanupSearchCache(): void {
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.searchCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const entriesToRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      entriesToRemove.forEach(([key]) => this.searchCache.delete(key));
    }
  }

  private getFromMovieDetailsCache(movieId: number): Movie | null {
    const cached = this.movieDetailsCache.get(movieId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    if (cached) {
      this.movieDetailsCache.delete(movieId);
    }
    return null;
  }

  private setMovieDetailsCache(movieId: number, data: Movie): void {
    this.cleanupMovieDetailsCache();
    this.movieDetailsCache.set(movieId, { data, timestamp: Date.now() });
  }

  private cleanupMovieDetailsCache(): void {
    if (this.movieDetailsCache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.movieDetailsCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const entriesToRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      entriesToRemove.forEach(([key]) => this.movieDetailsCache.delete(key));
    }
  }
}
