import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit {
  order = signal<Order | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

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

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}

