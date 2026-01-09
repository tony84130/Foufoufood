import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss'
})
export class OrdersListComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  selectedStatus = signal<OrderStatus | 'all'>('all');
  currentPage = signal(1);
  totalPages = signal(1);
  totalOrders = signal(0);
  private refreshInterval: any = null;

  statusOptions: Array<{ value: OrderStatus | 'all'; label: string }> = [
    { value: 'all', label: 'Toutes' },
    { value: 'En attente', label: 'En attente' },
    { value: 'Confirmée', label: 'Confirmée' },
    { value: 'Préparée', label: 'Préparée' },
    { value: 'En livraison', label: 'En livraison' },
    { value: 'Livrée', label: 'Livrée' },
    { value: 'Annulée', label: 'Annulée' }
  ];

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    // Mise à jour automatique toutes les minutes (60 secondes)
    this.refreshInterval = setInterval(() => {
      if (!this.isLoading()) {
        this.loadOrders();
      }
    }, 60000); // 60000 ms = 1 minute
  }

  ngOnDestroy(): void {
    // Nettoyer l'interval lors de la destruction du composant
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const status = this.selectedStatus() === 'all' ? undefined : this.selectedStatus();
    const page = this.currentPage();

    this.orderService.getMyOrders(status, 10, page).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.orders.set(response.data);
          
          // Si la réponse contient des informations de pagination
          if ((response as any).pagination) {
            this.totalPages.set((response as any).pagination.totalPages || 1);
            this.totalOrders.set((response as any).pagination.totalOrders || 0);
          }
        } else {
          this.error.set('Aucune commande trouvée');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error.set(
          err.error?.message || 'Erreur lors du chargement des commandes'
        );
        this.isLoading.set(false);
      }
    });
  }

  onStatusChange(status: OrderStatus | 'all'): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getOrderId(order: Order): string {
    return order._id || order.id || '';
  }

  getRestaurantName(order: Order): string {
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.name || '';
  }

  getStatusClass(status: OrderStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  viewOrderDetails(order: Order): void {
    const orderId = this.getOrderId(order);
    this.router.navigate(['/orders', orderId]);
  }

  getStatusLabel(status: OrderStatus): string {
    return status;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

