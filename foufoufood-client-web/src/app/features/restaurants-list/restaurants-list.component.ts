import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Restaurant } from '../../models/restaurant.model';

@Component({
  selector: 'app-restaurants-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './restaurants-list.component.html',
  styleUrl: './restaurants-list.component.scss'
})
export class RestaurantsListComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  filteredRestaurants = signal<Restaurant[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');

  constructor(
    private restaurantService: RestaurantService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.restaurantService.getRestaurants().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.restaurants.set(response.data);
          this.filteredRestaurants.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleFavorite(restaurantId: string): void {
    this.favoritesService.toggleFavorite(restaurantId);
  }

  isFavorite(restaurantId: string): boolean {
    return this.favoritesService.isFavorite(restaurantId);
  }

  onSearch(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredRestaurants.set(this.restaurants());
      return;
    }

    const filtered = this.restaurants().filter(restaurant =>
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query))
    );

    this.filteredRestaurants.set(filtered);
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  viewRestaurantDetails(restaurantId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/restaurants', restaurantId]);
  }
}

