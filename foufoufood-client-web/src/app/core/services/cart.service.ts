import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cart, CartItem } from '../../models/cart.model';
import { MenuItem } from '../../models/menu.model';
import { Restaurant } from '../../models/restaurant.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$: Observable<Cart | null> = this.cartSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const cartJson = localStorage.getItem('cart');
    if (cartJson) {
      try {
        const cart = JSON.parse(cartJson);
        this.cartSubject.next(cart);
      } catch (error) {
        console.error('Error loading cart from storage:', error);
        localStorage.removeItem('cart');
      }
    }
  }

  private saveCartToStorage(cart: Cart | null): void {
    if (cart) {
      localStorage.setItem('cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cart');
    }
  }

  getCart(): Cart | null {
    return this.cartSubject.value;
  }

  getCartItemCount(): number {
    const cart = this.cartSubject.value;
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  addToCart(menuItem: MenuItem, restaurant: Restaurant, quantity: number = 1, notes?: string): void {
    const currentCart = this.cartSubject.value;

    // Si le panier existe mais pour un autre restaurant, le vider
    if (currentCart && currentCart.restaurantId !== restaurant.id) {
      this.clearCart();
    }

    const cart: Cart = currentCart || {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: [],
      totalPrice: 0
    };

    // Chercher si l'item existe déjà
    const existingItemIndex = cart.items.findIndex(
      item => item.menuItem.id === menuItem.id
    );

    if (existingItemIndex >= 0) {
      // Mettre à jour la quantité
      cart.items[existingItemIndex].quantity += quantity;
      if (notes) {
        cart.items[existingItemIndex].notes = notes;
      }
    } else {
      // Ajouter un nouvel item
      cart.items.push({
        menuItem,
        quantity,
        notes
      });
    }

    // Recalculer le total
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + (item.menuItem.price * item.quantity),
      0
    );

    this.cartSubject.next(cart);
    this.saveCartToStorage(cart);
  }

  updateItemQuantity(menuItemId: string, quantity: number): void {
    const cart = this.cartSubject.value;
    if (!cart) return;

    const itemIndex = cart.items.findIndex(item => item.menuItem.id === menuItemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }

      // Recalculer le total
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + (item.menuItem.price * item.quantity),
        0
      );

      // Si le panier est vide, le supprimer
      if (cart.items.length === 0) {
        this.clearCart();
      } else {
        this.cartSubject.next(cart);
        this.saveCartToStorage(cart);
      }
    }
  }

  removeItem(menuItemId: string): void {
    const cart = this.cartSubject.value;
    if (!cart) return;

    cart.items = cart.items.filter(item => item.menuItem.id !== menuItemId);

    // Recalculer le total
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + (item.menuItem.price * item.quantity),
      0
    );

    // Si le panier est vide, le supprimer
    if (cart.items.length === 0) {
      this.clearCart();
    } else {
      this.cartSubject.next(cart);
      this.saveCartToStorage(cart);
    }
  }

  clearCart(): void {
    this.cartSubject.next(null);
    this.saveCartToStorage(null);
  }

  isRestaurantCompatible(restaurantId: string): boolean {
    const cart = this.cartSubject.value;
    return !cart || cart.restaurantId === restaurantId;
  }
}

