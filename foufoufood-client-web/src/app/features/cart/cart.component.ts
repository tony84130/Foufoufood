import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cart = signal<Cart | null>(null);

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart.set(cart);
    });
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
    } else {
      this.cartService.updateItemQuantity(menuItemId, quantity);
    }
  }

  removeItem(menuItemId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article du panier ?')) {
      this.cartService.removeItem(menuItemId);
    }
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.cartService.clearCart();
    }
  }

  validateCart(): void {
    const cart = this.cart();
    if (!cart || cart.items.length === 0) {
      return;
    }
    this.router.navigate(['/checkout']);
  }

  getSubtotal(): number {
    const cart = this.cart();
    return cart ? cart.totalPrice : 0;
  }

  getTotal(): number {
    // Pour l'instant, pas de taxes
    return this.getSubtotal();
  }
}

