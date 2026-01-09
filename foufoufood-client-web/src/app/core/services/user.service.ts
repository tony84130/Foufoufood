import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Address } from '../../models/user.model';
import { ApiResponse, ApiListResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/me`);
  }

  updateCurrentUser(updates: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/users/me`, updates);
  }

  deleteCurrentUser(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/users/me`);
  }

  getAllUsers(): Observable<ApiListResponse<User>> {
    return this.http.get<ApiListResponse<User>>(`${this.API_URL}/users`);
  }

  searchUsers(query: string): Observable<ApiListResponse<User>> {
    return this.http.get<ApiListResponse<User>>(`${this.API_URL}/users/search`, {
      params: { q: query }
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/users/${id}`);
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/users/${id}`);
  }
}

