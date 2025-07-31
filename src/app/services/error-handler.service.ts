import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppError {
  message: string;
  timestamp: Date;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly errorSubject = new BehaviorSubject<AppError | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  handleError(message: string, code?: string): void {
    const error: AppError = {
      message,
      timestamp: new Date(),
      code
    };
    
    this.errorSubject.next(error);
    console.error('App Error:', error);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  handleHttpError(error: any): string {
    if (error.status === 0) {
      return 'Network error. Please check your internet connection.';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return 'Invalid request. Please try again.';
    }
    
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }
}
