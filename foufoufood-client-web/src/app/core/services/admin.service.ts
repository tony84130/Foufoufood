import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant, CreateRestaurantWithAdminRequest } from '../../models/restaurant.model';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';

  constructor(private http: HttpClient) {}

  createRestaurantWithAdmin(request: CreateRestaurantWithAdminRequest): Observable<ApiResponse<{ restaurant: Restaurant; admin: any }>> {
    return this.http.post<ApiResponse<{ restaurant: Restaurant; admin: any }>>(
      `${this.API_URL}/admin/restaurants`,
      request
    );
  }
}

