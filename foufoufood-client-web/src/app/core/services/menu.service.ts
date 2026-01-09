import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, CreateMenuItemRequest, UpdateMenuItemRequest } from '../../models/menu.model';
import { ApiResponse, ApiListResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';

  constructor(private http: HttpClient) {}

  getMenuItems(restaurantId?: string): Observable<ApiListResponse<MenuItem>> {
    let params = new HttpParams();
    if (restaurantId) {
      params = params.set('restaurantId', restaurantId);
    }
    return this.http.get<ApiListResponse<MenuItem>>(`${this.API_URL}/menus`, { params });
  }

  searchMenuItems(query: string, restaurantId?: string): Observable<ApiListResponse<MenuItem>> {
    let params = new HttpParams().set('q', query);
    if (restaurantId) {
      params = params.set('restaurantId', restaurantId);
    }
    return this.http.get<ApiListResponse<MenuItem>>(`${this.API_URL}/menus/search`, { params });
  }

  getMenuItemById(id: string): Observable<ApiResponse<MenuItem>> {
    return this.http.get<ApiResponse<MenuItem>>(`${this.API_URL}/menus/${id}`);
  }

  createMenuItem(menuItem: CreateMenuItemRequest): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.API_URL}/menus`, menuItem);
  }

  updateMenuItem(id: string, updates: UpdateMenuItemRequest): Observable<ApiResponse<MenuItem>> {
    return this.http.put<ApiResponse<MenuItem>>(`${this.API_URL}/menus/${id}`, updates);
  }

  deleteMenuItem(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/menus/${id}`);
  }
}

