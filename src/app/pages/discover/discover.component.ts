import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.interface';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MovieCardComponent,
  ],
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.css'],
})
export class DiscoverComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  searchResults: Movie[] = [];
  watchlistMovies: Movie[] = [];
  isLoading = false;
  error: string | null = null;
  searchQuery = '';
  isSearching = false;
  isWatchlistPage = false;

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  constructor(
    private readonly movieService: MovieService,
    private readonly snackBar: MatSnackBar,
    private readonly router: Router
  ) {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.performSearch(query);
      });
  }

  ngOnInit(): void {
    // Check if we're on the watchlist page
    this.isWatchlistPage = this.router.url === '/watchlist';
    
    if (this.isWatchlistPage) {
      this.loadWatchlistMovies();
    } else {
      this.loadLatestMovies();
    }
    
    this.subscribeToState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLatestMovies(): void {
    this.movieService.getLatestMovies().subscribe({
      next: (movies) => {
        this.movies = movies || [];
      },
      error: (error) => {
        this.error = 'Failed to load movies';
        this.snackBar.open('Failed to load movies', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  loadWatchlistMovies(): void {
    this.movieService.watchlist$
      .pipe(takeUntil(this.destroy$))
      .subscribe((watchlist) => {
        this.watchlistMovies = watchlist || [];
      });
  }

  private subscribeToState(): void {
    this.movieService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isLoading = loading;
      });

    this.movieService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        this.error = error;
        if (error) {
          this.snackBar.open(error, 'Close', { duration: 3000 });
        }
      });
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    // On watchlist page, we don't need to call API - just filter locally
    if (this.isWatchlistPage) {
      this.isSearching = false;
      return; // getDisplayedMovies() will handle the filtering
    }

    // On discover page, search via API
    this.isSearching = true;
    this.movieService.searchMovies(query).subscribe({
      next: (results) => {
        this.searchResults = results || [];
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
      },
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }

  onAddToWatchlist(movie: Movie): void {
    this.movieService.addToWatchlist(movie);
    this.snackBar.open(`${movie.title} added to watchlist`, 'Close', {
      duration: 2000,
    });
  }

  onRemoveFromWatchlist(movie: Movie): void {
    this.movieService.removeFromWatchlist(movie.id);
    this.snackBar.open(`${movie.title} removed from watchlist`, 'Close', {
      duration: 2000,
    });
  }

  isInWatchlist(movieId: number): boolean {
    return this.movieService.isInWatchlist(movieId);
  }

  getDisplayedMovies(): Movie[] {
    if (this.isWatchlistPage) {
      // On watchlist page, show watchlist movies filtered by search
      return this.searchQuery.trim() 
        ? this.watchlistMovies.filter(movie => 
            movie.title.toLowerCase().includes(this.searchQuery.toLowerCase())
          )
        : this.watchlistMovies;
    } else {
      // On discover page, show search results or latest movies
      return this.searchQuery.trim() ? this.searchResults : this.movies;
    }
  }

  getPageTitle(): string {
    return this.isWatchlistPage ? 'Your Watchlist' : 'Discover Movies';
  }

  trackByMovieId(index: number, movie: Movie): number {
    return movie.id;
  }
}
