import { Routes } from '@angular/router';
import { DiscoverComponent } from './pages/discover/discover.component';
import { MovieReviewComponent } from './pages/movie-review/movie-review.component';

export const routes: Routes = [
  { path: '', redirectTo: '/discover', pathMatch: 'full' },
  { 
    path: 'discover', 
    component: DiscoverComponent,
  },
  { 
    path: 'watchlist', 
    component: DiscoverComponent
  },
  { 
    path: 'movie/:id', 
    component: MovieReviewComponent
  },
  { path: '**', redirectTo: '/discover' }
];
