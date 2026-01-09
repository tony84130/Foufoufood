import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, SignUpRequest, SignInRequest, User } from '../../models/user.model';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);

  public readonly user = this.currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this.currentUser() !== null);
  public readonly userRole = computed(() => this.currentUser()?.role ?? null);

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  signUp(request: SignUpRequest): Observable<ApiResponse<AuthResponse['data']>> {
    return this.http.post<ApiResponse<AuthResponse['data']>>(
      `${this.API_URL}/auth/sign-up`,
      request
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuth(response.data.token, response.data.user);
        }
      }),
      catchError(error => {
        console.error('Sign up error:', error);
        return throwError(() => error);
      })
    );
  }

  signIn(request: SignInRequest): Observable<ApiResponse<AuthResponse['data']>> {
    return this.http.post<ApiResponse<AuthResponse['data']>>(
      `${this.API_URL}/auth/sign-in`,
      request
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuth(response.data.token, response.data.user);
        }
      }),
      catchError(error => {
        console.error('Sign in error:', error);
        return throwError(() => error);
      })
    );
  }

  signOut(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/sign-out`, {}).pipe(
      tap(() => {
        this.clearAuth();
      }),
      catchError(error => {
        // Même en cas d'erreur, on déconnecte localement
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return this.token();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.userRole();
    return userRole !== null && roles.includes(userRole);
  }

  private setAuth(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private loadStoredAuth(): void {
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.token.set(storedToken);
        this.currentUser.set(user);
      } catch (error) {
        console.error('Error loading stored auth:', error);
        this.clearAuth();
      }
    }
  }
}

