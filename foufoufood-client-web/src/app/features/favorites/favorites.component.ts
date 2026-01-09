import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { Restaurant } from '../../models/restaurant.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  favoriteRestaurants = signal<Restaurant[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');
  filteredRestaurants = signal<Restaurant[]>([]);

  constructor(
    private restaurantService: RestaurantService,
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavoriteRestaurants();
    
    // Écouter les changements de favoris
    this.favoritesService.favorites$.subscribe(() => {
      this.loadFavoriteRestaurants();
    });
  }

  loadFavoriteRestaurants(): void {
    this.isLoading.set(true);
    const favoriteIds = Array.from(this.favoritesService.getFavorites());
    
    if (favoriteIds.length === 0) {
      this.favoriteRestaurants.set([]);
      this.filteredRestaurants.set([]);
      this.isLoading.set(false);
      return;
    }

    // Charger tous les restaurants et filtrer ceux qui sont en favoris
    this.restaurantService.getRestaurants().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const favorites = response.data.filter(restaurant => 
            favoriteIds.includes(restaurant.id)
          );
          this.favoriteRestaurants.set(favorites);
          this.filteredRestaurants.set(favorites);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading favorite restaurants:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleFavorite(restaurantId: string): void {
    this.favoritesService.toggleFavorite(restaurantId);
    // Le chargement se fera automatiquement via l'observable
  }

  isFavorite(restaurantId: string): boolean {
    return this.favoritesService.isFavorite(restaurantId);
  }

  onSearch(): void {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredRestaurants.set(this.favoriteRestaurants());
      return;
    }

    const filtered = this.favoriteRestaurants().filter(restaurant =>
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query))
    );

    this.filteredRestaurants.set(filtered);
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  getFavoritesCount(): number {
    return this.favoriteRestaurants().length;
  }

  viewRestaurantDetails(restaurantId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/restaurants', restaurantId]);
  }
}

