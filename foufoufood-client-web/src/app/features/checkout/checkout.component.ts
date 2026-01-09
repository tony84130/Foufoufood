import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Cart } from '../../models/cart.model';
import { DeliveryAddress } from '../../models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  cart = signal<Cart | null>(null);
  checkoutForm!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    // Charger le panier
    this.cartService.cart$.subscribe(cart => {
      this.cart.set(cart);
      
      if (!cart || cart.items.length === 0) {
        this.router.navigate(['/cart']);
        return;
      }

      // Pré-remplir le formulaire avec l'adresse de l'utilisateur si disponible
      const user = this.authService.getCurrentUser();
      if (user?.address) {
        this.checkoutForm.patchValue({
          line1: user.address.line1 || '',
          line2: user.address.line2 || '',
          city: user.address.city || '',
          region: user.address.region || '',
          postalCode: user.address.postalCode || '',
          country: user.address.country || 'Canada'
        });
      }
    });
  }

  private initForm(): void {
    this.checkoutForm = this.fb.group({
      line1: ['', [Validators.required, Validators.maxLength(200)]],
      line2: ['', [Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      region: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['Canada', [Validators.required, Validators.maxLength(100)]]
    });
  }

  getSubtotal(): number {
    const cart = this.cart();
    return cart ? cart.totalPrice : 0;
  }

  getTotal(): number {
    return this.getSubtotal();
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched(this.checkoutForm);
      return;
    }

    const cart = this.cart();
    if (!cart || cart.items.length === 0) {
      this.errorMessage.set('Votre panier est vide');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const deliveryAddress: DeliveryAddress = {
      line1: this.checkoutForm.value.line1,
      line2: this.checkoutForm.value.line2 || undefined,
      city: this.checkoutForm.value.city,
      region: this.checkoutForm.value.region,
      postalCode: this.checkoutForm.value.postalCode,
      country: this.checkoutForm.value.country
    };

    // Préparer les items pour l'API
    const orderItems = cart.items.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      notes: item.notes
    }));

    this.orderService.createOrderFromCart(
      deliveryAddress,
      cart.restaurantId,
      orderItems
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Vider le panier local
          this.cartService.clearCart();
          
          // Rediriger vers la page de confirmation avec l'ID de la commande
          const orderId = response.data._id || response.data.id;
          this.router.navigate(['/order-confirmation', orderId]);
        } else {
          this.errorMessage.set(response.message || 'Erreur lors de la création de la commande');
          this.isSubmitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.errorMessage.set(
          error.error?.message || 
          'Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (field?.hasError('required') && field.touched) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('maxlength') && field.touched) {
      return `Maximum ${field.errors?.['maxlength'].requiredLength} caractères`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }
}

