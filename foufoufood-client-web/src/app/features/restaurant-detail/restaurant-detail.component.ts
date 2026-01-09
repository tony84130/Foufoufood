import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Restaurant, OpeningHours } from '../../models/restaurant.model';
import { MenuItem, MenuCategory } from '../../models/menu.model';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrl: './restaurant-detail.component.scss'
})
export class RestaurantDetailComponent implements OnInit {
  restaurant = signal<Restaurant | null>(null);
  menuItems = signal<MenuItem[]>([]);
  groupedMenuItems = signal<Record<MenuCategory, MenuItem[]>>({} as Record<MenuCategory, MenuItem[]>);
  isLoading = signal<boolean>(false);
  
  reviewForm: FormGroup;
  showReviewForm = signal<boolean>(false);
  userReview = signal<any>(null);
  quantityInputs = signal<Record<string, number>>({});

  menuCategories: MenuCategory[] = ['Entrée', 'Plat', 'Dessert', 'Boisson', 'Accompagnement', 'Autre'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private menuService: MenuService,
    private cartService: CartService,
    private authService: AuthService,
    private favoritesService: FavoritesService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });
  }

  ngOnInit(): void {
    // Initialiser groupedMenuItems avec toutes les catégories vides
    this.groupedMenuItems.set({
      'Entrée': [],
      'Plat': [],
      'Dessert': [],
      'Boisson': [],
      'Accompagnement': [],
      'Autre': []
    });
    
    const restaurantId = this.route.snapshot.paramMap.get('id');
    if (restaurantId) {
      this.loadRestaurant(restaurantId);
      this.loadMenuItems(restaurantId);
    }
  }


  loadRestaurant(id: string): void {
    this.isLoading.set(true);
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.restaurant.set(response.data);
          this.checkUserReview(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading restaurant:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadMenuItems(restaurantId: string): void {
    this.menuService.getMenuItems(restaurantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.menuItems.set(response.data);
          this.groupMenuItemsByCategory(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
      }
    });
  }

  groupMenuItemsByCategory(items: MenuItem[]): void {
    const grouped: Record<MenuCategory, MenuItem[]> = {
      'Entrée': [],
      'Plat': [],
      'Dessert': [],
      'Boisson': [],
      'Accompagnement': [],
      'Autre': []
    };

    items.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      } else {
        grouped['Autre'].push(item);
      }
    });

    this.groupedMenuItems.set(grouped);
  }

  getCategoryItems(category: MenuCategory): MenuItem[] {
    const grouped = this.groupedMenuItems();
    if (!grouped || !grouped[category]) {
      return [];
    }
    return grouped[category];
  }

  checkUserReview(restaurant: Restaurant): void {
    if (!this.authService.isAuthenticated() || !restaurant.reviews) {
      return;
    }

    const userId = this.authService.user()?.id;
    if (!userId) return;

    const review = restaurant.reviews.find(r => {
      if (typeof r.user === 'object' && r.user) {
        return r.user.id === userId || r.user._id === userId;
      }
      return false;
    });

    if (review) {
      this.userReview.set(review);
      this.reviewForm.patchValue({
        rating: review.rating,
        comment: review.comment || ''
      });
    }
  }

  toggleFavorite(): void {
    const restaurant = this.restaurant();
    if (!restaurant) return;
    this.favoritesService.toggleFavorite(restaurant.id);
  }

  isFavorite(): boolean {
    const restaurant = this.restaurant();
    return restaurant ? this.favoritesService.isFavorite(restaurant.id) : false;
  }

  addToCart(menuItem: MenuItem, quantity: number = 1): void {
    const restaurant = this.restaurant();
    if (!restaurant) return;

    if (!this.cartService.isRestaurantCompatible(restaurant.id)) {
      if (confirm('Votre panier contient des articles d\'un autre restaurant. Voulez-vous le vider et ajouter cet article ?')) {
        this.cartService.clearCart();
      } else {
        return;
      }
    }

    this.cartService.addToCart(menuItem, restaurant, quantity);
    this.quantityInputs.update(inputs => ({ ...inputs, [menuItem.id]: 1 }));
  }

  getQuantity(menuItemId: string): number {
    return this.quantityInputs()[menuItemId] || 1;
  }

  setQuantity(menuItemId: string, quantity: number): void {
    this.quantityInputs.update(inputs => ({ ...inputs, [menuItemId]: quantity }));
  }

  decreaseQuantity(menuItemId: string): void {
    const currentQuantity = this.getQuantity(menuItemId);
    this.setQuantity(menuItemId, Math.max(1, currentQuantity - 1));
  }

  toggleReviewForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.showReviewForm.set(!this.showReviewForm());
  }

  submitReview(): void {
    const restaurant = this.restaurant();
    if (!restaurant || this.reviewForm.invalid) return;

    const reviewData = this.reviewForm.value;
    if (!reviewData.comment || reviewData.comment.trim() === '') {
      delete reviewData.comment;
    }

    if (this.userReview()) {
      // Mise à jour de l'avis existant (le backend gère ça via POST qui remplace)
      this.restaurantService.addReview(restaurant.id, reviewData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRestaurant(restaurant.id);
            this.showReviewForm.set(false);
          }
        },
        error: (error) => {
          console.error('Error updating review:', error);
        }
      });
    } else {
      // Nouvel avis
      this.restaurantService.addReview(restaurant.id, reviewData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRestaurant(restaurant.id);
            this.showReviewForm.set(false);
          }
        },
        error: (error) => {
          console.error('Error adding review:', error);
        }
      });
    }
  }

  deleteReview(): void {
    const restaurant = this.restaurant();
    if (!restaurant || !confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) return;

    this.restaurantService.deleteReview(restaurant.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.userReview.set(null);
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.showReviewForm.set(false); // Fermer le formulaire après suppression
          this.loadRestaurant(restaurant.id);
        }
      },
      error: (error) => {
        console.error('Error deleting review:', error);
      }
    });
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  getDayLabel(dayValue: string): string {
    const days: Record<string, string> = {
      'Mon': 'Lundi',
      'Tue': 'Mardi',
      'Wed': 'Mercredi',
      'Thu': 'Jeudi',
      'Fri': 'Vendredi',
      'Sat': 'Samedi',
      'Sun': 'Dimanche'
    };
    return days[dayValue] || dayValue;
  }

  getSortedOpeningHours(): OpeningHours[] {
    const restaurant = this.restaurant();
    if (!restaurant || !restaurant.openingHours) return [];
    
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return [...restaurant.openingHours].sort((a, b) => {
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  }

  getReviewUserName(review: any): string {
    if (review.user && typeof review.user === 'object') {
      return review.user.name || 'Utilisateur anonyme';
    }
    return 'Utilisateur anonyme';
  }

  isUserReview(review: any): boolean {
    if (!this.authService.isAuthenticated() || !review.user) {
      return false;
    }
    const userId = this.authService.user()?.id;
    if (!userId) return false;

    if (typeof review.user === 'object' && review.user) {
      return review.user.id === userId || review.user._id === userId;
    }
    return false;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }

  get cartItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  get hasItemsInCart(): boolean {
    return this.cartItemCount > 0;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}

