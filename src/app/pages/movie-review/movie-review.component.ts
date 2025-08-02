import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { MovieService } from '../../services/movie.service';
import { Movie, MovieReview } from '../../models/movie.interface';

@Component({
  selector: 'app-movie-review',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './movie-review.component.html',
  styleUrls: ['./movie-review.component.css'],
})
export class MovieReviewComponent implements OnInit, OnDestroy {
  movieId!: number;
  movie: Movie | null = null;
  reviewForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  existingReview: MovieReview | undefined;
  selectedRating = 0;
  hoveredRating = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly movieService: MovieService,
    private readonly snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.movieId = parseInt(id, 10);
        this.loadMovieDetails();
        this.loadExistingReview();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      reviewText: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private loadMovieDetails(): void {
    this.isLoading = true;
    this.movieService.getMovieDetails(this.movieId).subscribe({
      next: (movie) => {
        this.movie = movie;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load movie details', 'Close', { duration: 3000 });
      }
    });
  }

  private loadExistingReview(): void {
    this.existingReview = this.movieService.getReviewForMovie(this.movieId);
    if (this.existingReview) {
      this.selectedRating = this.existingReview.rating;
      this.reviewForm.patchValue({
        rating: this.existingReview.rating,
        reviewText: this.existingReview.reviewText
      });
    }
  }

  onStarClick(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  onStarHover(rating: number): void {
    this.hoveredRating = rating;
  }

  onStarLeave(): void {
    this.hoveredRating = 0;
  }

  getStarIcon(starNumber: number): string {
    const currentRating = this.hoveredRating || this.selectedRating;
    return starNumber <= currentRating ? 'star' : 'star_border';
  }

  getStarClass(starNumber: number): string {
    const currentRating = this.hoveredRating || this.selectedRating;
    return starNumber <= currentRating ? 'star-filled' : 'star-empty';
  }

  onSubmit(): void {
    if (this.reviewForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const reviewData: MovieReview = {
        movieId: this.movieId,
        rating: this.reviewForm.value.rating,
        reviewText: this.reviewForm.value.reviewText,
      };

      this.movieService.addReview(reviewData);
      
      this.snackBar.open(
        this.existingReview ? 'Review updated successfully!' : 'Review submitted successfully!', 
        'Close', 
        { duration: 3000 }
      );
      
      this.isSubmitting = false;
      this.existingReview = reviewData;
    }
  }

  onAddToWatchlist(): void {
    if (this.movie) {
      this.movieService.addToWatchlist(this.movie);
      this.snackBar.open(`${this.movie.title} added to watchlist`, 'Close', { duration: 2000 });
    }
  }

  onRemoveFromWatchlist(): void {
    if (this.movie) {
      this.movieService.removeFromWatchlist(this.movie.id);
      this.snackBar.open(`${this.movie.title} removed from watchlist`, 'Close', { duration: 2000 });
    }
  }

  isInWatchlist(): boolean {
    return this.movie ? this.movieService.isInWatchlist(this.movie.id) : false;
  }

  goBack(): void {
    window.history.back();
  }

  getFormattedRuntime(): string {
    // Since runtime is not available in the current Movie interface,
    // we'll return an empty string for now
    return '';
  }

  getRatingErrorMessage(): string {
    const ratingControl = this.reviewForm.get('rating');
    if (ratingControl?.hasError('required')) {
      return 'Rating is required';
    }
    if (ratingControl?.hasError('min') || ratingControl?.hasError('max')) {
      return 'Rating must be between 1 and 5 stars';
    }
    return '';
  }

  getReviewErrorMessage(): string {
    const reviewControl = this.reviewForm.get('reviewText');
    if (reviewControl?.hasError('required')) {
      return 'Review text is required';
    }
    if (reviewControl?.hasError('minlength')) {
      const requiredLength = reviewControl.getError('minlength').requiredLength;
      const actualLength = reviewControl.getError('minlength').actualLength;
      return `Review must be at least ${requiredLength} characters (current: ${actualLength})`;
    }
    return '';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder-poster.jpg';
  }
}
