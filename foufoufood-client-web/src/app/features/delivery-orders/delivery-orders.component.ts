import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../models/order.model';
import { interval, Subscription } from 'rxjs';

type TabType = 'available' | 'assigned' | 'history';

@Component({
  selector: 'app-delivery-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './delivery-orders.component.html',
  styleUrl: './delivery-orders.component.scss'
})
export class DeliveryOrdersComponent implements OnInit, OnDestroy {
  activeTab = signal<TabType>('available');
  
  availableOrders = signal<Order[]>([]);
  assignedOrders = signal<Order[]>([]);
  historyOrders = signal<Order[]>([]);
  
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  isAssigning = signal<string | null>(null);
  isUpdatingStatus = signal<string | null>(null);

  private refreshSubscription?: Subscription;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadAvailableOrders();
    // Rafraîchir automatiquement toutes les 10 secondes (silencieusement)
    this.refreshSubscription = interval(10000).subscribe(() => {
      this.refreshCurrentTab(true);
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  refreshCurrentTab(silent: boolean = false): void {
    // Ne pas rafraîchir si on est déjà en train de charger
    if (this.isLoading()) {
      return;
    }

    const tab = this.activeTab();
    switch (tab) {
      case 'available':
        if (silent) {
          // Rafraîchissement silencieux (sans loader) pour l'auto-refresh
          this.orderService.getAvailableOrders().subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.availableOrders.set(response.data);
              }
            },
            error: (err) => {
              console.error('Error silently refreshing available orders:', err);
            }
          });
        } else {
          this.loadAvailableOrders();
        }
        break;
      case 'assigned':
        if (silent) {
          this.orderService.getMyAssignedOrders().subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.assignedOrders.set(response.data);
              }
            },
            error: (err) => {
              console.error('Error silently refreshing assigned orders:', err);
            }
          });
        } else {
          this.loadAssignedOrders();
        }
        break;
      case 'history':
        // L'historique n'a pas besoin de rafraîchissement automatique
        break;
    }
  }

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.error.set(null);
    
    switch (tab) {
      case 'available':
        this.loadAvailableOrders();
        break;
      case 'assigned':
        this.loadAssignedOrders();
        break;
      case 'history':
        this.loadHistory();
        break;
    }
  }

  loadAvailableOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.orderService.getAvailableOrders().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableOrders.set(response.data);
        } else {
          this.error.set('Erreur lors du chargement des commandes disponibles');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading available orders:', err);
        this.error.set(err.error?.message || 'Erreur lors du chargement des commandes disponibles');
        this.isLoading.set(false);
      }
    });
  }

  loadAssignedOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.orderService.getMyAssignedOrders().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.assignedOrders.set(response.data);
        } else {
          this.error.set('Erreur lors du chargement de vos commandes');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading assigned orders:', err);
        this.error.set(err.error?.message || 'Erreur lors du chargement de vos commandes');
        this.isLoading.set(false);
      }
    });
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.orderService.getMyDeliveryHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.historyOrders.set(response.data);
        } else {
          this.error.set('Erreur lors du chargement de l\'historique');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.error.set(err.error?.message || 'Erreur lors du chargement de l\'historique');
        this.isLoading.set(false);
      }
    });
  }

  assignOrder(orderId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir prendre cette commande en charge ?')) {
      return;
    }

    this.isAssigning.set(orderId);
    this.error.set(null);

    this.orderService.assignOrderToMe(orderId).subscribe({
      next: (response) => {
        if (response.success) {
          // Recharger les listes
          this.loadAvailableOrders();
          this.loadAssignedOrders();
        } else {
          this.error.set(response.message || 'Erreur lors de l\'attribution de la commande');
        }
        this.isAssigning.set(null);
      },
      error: (err) => {
        console.error('Error assigning order:', err);
        this.error.set(err.error?.message || 'Erreur lors de l\'attribution de la commande');
        this.isAssigning.set(null);
      }
    });
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    let confirmMessage = '';
    if (newStatus === 'En livraison') {
      confirmMessage = 'Marquer cette commande comme "En livraison" ?';
    } else if (newStatus === 'Livrée') {
      confirmMessage = 'Confirmer que cette commande a été livrée ?';
    }

    if (confirmMessage && !confirm(confirmMessage)) {
      return;
    }

    this.isUpdatingStatus.set(orderId);
    this.error.set(null);

    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          // Recharger les listes
          this.loadAssignedOrders();
          if (newStatus === 'Livrée') {
            this.loadHistory();
          }
        } else {
          this.error.set(response.message || 'Erreur lors de la mise à jour du statut');
        }
        this.isUpdatingStatus.set(null);
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.error.set(err.error?.message || 'Erreur lors de la mise à jour du statut');
        this.isUpdatingStatus.set(null);
      }
    });
  }

  getOrderId(order: Order): string {
    return order._id || order.id || '';
  }

  getRestaurantName(order: Order): string {
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.name || '';
  }

  getRestaurantAddress(order: Order): string {
    if (typeof order.restaurant === 'string') return '';
    return order.restaurant.address || '';
  }

  getCustomerName(order: Order): string {
    if (typeof order.user === 'string') return '';
    return order.user.name || '';
  }

  getCustomerPhone(order: Order): string {
    if (typeof order.user === 'string') return '';
    return order.user.phone || '';
  }

  getDeliveryAddress(order: Order): string {
    if (!order.deliveryAddress) return '';
    const addr = order.deliveryAddress;
    let address = addr.line1;
    if (addr.line2) address += ', ' + addr.line2;
    address += `, ${addr.city}, ${addr.region} ${addr.postalCode}`;
    return address;
  }

  getStatusClass(status: OrderStatus): string {
    return status.toLowerCase().replace(' ', '-');
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canUpdateToInDelivery(order: Order): boolean {
    // Le livreur peut démarrer la livraison quand la commande est "Préparée"
    return order.status === 'Préparée';
  }

  canUpdateToDelivered(order: Order): boolean {
    // Le livreur peut marquer comme livrée quand elle est "En livraison"
    return order.status === 'En livraison';
  }

  isWaitingForPreparation(order: Order): boolean {
    // La commande est "Confirmée" et attend que le restaurant la prépare
    return order.status === 'Confirmée';
  }

  getItemsCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
}
