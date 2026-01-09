import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Restaurant, CreateRestaurantRequest, UpdateRestaurantRequest, RestaurantReviewRequest } from '../../models/restaurant.model';
import { ApiResponse, ApiListResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';

  constructor(private http: HttpClient) {}

  getRestaurants(): Observable<ApiListResponse<Restaurant>> {
    return this.http.get<ApiListResponse<Restaurant>>(`${this.API_URL}/restaurants`);
  }

  searchRestaurants(query: string): Observable<ApiListResponse<Restaurant>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiListResponse<Restaurant>>(`${this.API_URL}/restaurants/search`, { params });
  }

  getRestaurantById(id: string): Observable<ApiResponse<Restaurant>> {
    return this.http.get<ApiResponse<Restaurant>>(`${this.API_URL}/restaurants/${id}`);
  }

  getMyRestaurants(): Observable<ApiListResponse<Restaurant>> {
    return this.http.get<ApiListResponse<Restaurant>>(`${this.API_URL}/restaurants/me`);
  }

  createRestaurant(restaurant: CreateRestaurantRequest): Observable<ApiResponse<Restaurant>> {
    return this.http.post<ApiResponse<Restaurant>>(`${this.API_URL}/restaurants`, restaurant);
  }

  updateRestaurant(id: string, updates: UpdateRestaurantRequest): Observable<ApiResponse<Restaurant>> {
    return this.http.put<ApiResponse<Restaurant>>(`${this.API_URL}/restaurants/${id}`, updates);
  }

  deleteRestaurant(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/restaurants/${id}`);
  }

  addReview(restaurantId: string, review: RestaurantReviewRequest): Observable<ApiResponse<Restaurant>> {
    return this.http.post<ApiResponse<Restaurant>>(`${this.API_URL}/restaurants/${restaurantId}/reviews`, review);
  }

  deleteReview(restaurantId: string): Observable<ApiResponse<Restaurant>> {
    return this.http.delete<ApiResponse<Restaurant>>(`${this.API_URL}/restaurants/${restaurantId}/reviews`);
  }
}

