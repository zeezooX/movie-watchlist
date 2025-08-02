import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { Movie } from '../../models/movie.interface';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.css'],
})
export class MovieCardComponent {
  @Input() movie!: Movie;
  @Input() isInWatchlist = false;
  @Output() addToWatchlist = new EventEmitter<Movie>();
  @Output() removeFromWatchlist = new EventEmitter<Movie>();

  onAddToWatchlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isInWatchlist) {
      this.addToWatchlist.emit(this.movie);
    } else {
      this.removeFromWatchlist.emit(this.movie);
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder-poster.jpg';
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
