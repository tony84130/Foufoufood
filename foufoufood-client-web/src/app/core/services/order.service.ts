import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';
import { Order, CreateOrderRequest, DeliveryAddress } from '../../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';

  constructor(private http: HttpClient) {}

  /**
   * Crée une nouvelle commande depuis le panier
   */
  createOrderFromCart(
    deliveryAddress: DeliveryAddress,
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>
  ): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(
      `${this.API_URL}/orders`,
      {
        deliveryAddress,
        useCart: false,
        restaurantId,
        items
      }
    ).pipe(
      catchError(error => {
        console.error('Error creating order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère toutes les commandes de l'utilisateur avec pagination
   */
  getMyOrders(status?: string, limit: number = 10, page: number = 1): Observable<ApiResponse<Order[]> & { pagination?: any }> {
    const params: any = { limit, page };
    if (status) {
      params.status = status;
    }

    return this.http.get<ApiResponse<Order[]> & { pagination?: any }>(
      `${this.API_URL}/orders`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère une commande par son ID
   */
  getOrderById(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(
      `${this.API_URL}/orders/${orderId}`
    ).pipe(
      catchError(error => {
        console.error('Error fetching order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Annule une commande
   */
  cancelOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${this.API_URL}/orders/${orderId}/cancel`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Error cancelling order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les commandes disponibles pour les livreurs
   */
  getAvailableOrders(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(
      `${this.API_URL}/orders/delivery/available`
    ).pipe(
      catchError(error => {
        console.error('Error fetching available orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les commandes assignées au livreur
   */
  getMyAssignedOrders(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(
      `${this.API_URL}/orders/delivery/me`
    ).pipe(
      catchError(error => {
        console.error('Error fetching assigned orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère l'historique des commandes livrées
   */
  getMyDeliveryHistory(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(
      `${this.API_URL}/orders/delivery/history`
    ).pipe(
      catchError(error => {
        console.error('Error fetching delivery history:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * S'assigner une commande
   */
  assignOrderToMe(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(
      `${this.API_URL}/orders/${orderId}/assign`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Error assigning order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Met à jour le statut d'une commande (pour les livreurs et admins restaurant)
   */
  updateOrderStatus(orderId: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${this.API_URL}/orders/${orderId}/status`,
      { status }
    ).pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère les commandes d'un restaurant (pour les admins restaurant)
   */
  getRestaurantOrders(restaurantId: string, status?: string, limit: number = 50, page: number = 1): Observable<ApiResponse<Order[]> & { pagination?: any }> {
    const params: any = { restaurantId, limit, page };
    if (status) {
      params.status = status;
    }

    return this.http.get<ApiResponse<Order[]> & { pagination?: any }>(
      `${this.API_URL}/orders/restaurant`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error fetching restaurant orders:', error);
        return throwError(() => error);
      })
    );
  }
}

