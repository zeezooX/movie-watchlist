import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-movie-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './movie-review.component.html',
  styleUrls: ['./movie-review.component.css'],
})
export class MovieReviewComponent {
  movieId: string;

  constructor(private readonly route: ActivatedRoute) {
    this.movieId = '';
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.movieId = params.get('id') || '';
    });
  }
}
