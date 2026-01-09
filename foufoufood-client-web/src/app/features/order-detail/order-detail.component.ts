import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  order = signal<Order | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isCancelling = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (!orderId) {
      this.error.set('ID de commande manquant');
      this.isLoading.set(false);
      return;
    }

    this.loadOrder(orderId);
  }

  private loadOrder(orderId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.orderService.getOrderById(orderId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.order.set(response.data);
        } else {
          this.error.set('Commande introuvable');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.error.set(
          err.error?.message || 'Erreur lors du chargement de la commande'
        );
        this.isLoading.set(false);
      }
    });
  }

  getOrderId(): string {
    const order = this.order();
    if (!order) return '';
    return order._id || order.id || '';
  }

  getRestaurantName(): string {
    const order = this.order();
    if (!order) return '';
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.name || '';
  }

  getRestaurantAddress(): string {
    const order = this.order();
    if (!order) return '';
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.address || '';
  }

  getRestaurantPhone(): string {
    const order = this.order();
    if (!order) return '';
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.phone || '';
  }

  getDeliveryAddress(): string {
    const order = this.order();
    if (!order || !order.deliveryAddress) return '';
    
    const addr = order.deliveryAddress;
    let address = addr.line1;
    if (addr.line2) {
      address += ', ' + addr.line2;
    }
    address += `, ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.country}`;
    return address;
  }

  getDeliveryPartnerName(): string {
    const order = this.order();
    if (!order || !order.deliveryPartner) return '';
    if (typeof order.deliveryPartner === 'string') return '';
    return order.deliveryPartner.user?.name || '';
  }

  getStatusClass(status: OrderStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  canCancel(): boolean {
    const order = this.order();
    if (!order) return false;
    const status = order.status;
    return status !== 'Livrée' && status !== 'Annulée' && status !== 'En livraison';
  }

  cancelOrder(): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    const orderId = this.getOrderId();
    if (!orderId) return;

    this.isCancelling.set(true);
    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.order.set(response.data);
        }
        this.isCancelling.set(false);
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.error.set(
          err.error?.message || 'Erreur lors de l\'annulation de la commande'
        );
        this.isCancelling.set(false);
      }
    });
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

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  getStatusTimeline(): Array<{ status: OrderStatus; label: string; active: boolean; completed: boolean }> {
    const order = this.order();
    if (!order) return [];

    const statuses: OrderStatus[] = ['En attente', 'Confirmée', 'Préparée', 'En livraison', 'Livrée'];
    const currentStatus = order.status;
    const currentIndex = statuses.indexOf(currentStatus);

    return statuses.map((status, index) => {
      const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === status);
      const isActive = index === currentIndex && currentStatus === status;
      
      return {
        status,
        label: status,
        active: isActive,
        completed: isCompleted
      };
    });
  }
}

