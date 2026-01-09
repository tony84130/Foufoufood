import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favorites';
  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  public favorites$: Observable<Set<string>> = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  /**
   * Charge les favoris depuis localStorage
   */
  private loadFavorites(): void {
    const favoritesJson = localStorage.getItem(this.STORAGE_KEY);
    if (favoritesJson) {
      try {
        const favoritesArray = JSON.parse(favoritesJson) as string[];
        // Vérifier que c'est bien un tableau de strings
        if (Array.isArray(favoritesArray)) {
          const favoritesSet = new Set<string>(favoritesArray.filter((id): id is string => typeof id === 'string'));
          this.favoritesSubject.next(favoritesSet);
        } else {
          this.favoritesSubject.next(new Set());
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        this.favoritesSubject.next(new Set());
      }
    }
  }

  /**
   * Sauvegarde les favoris dans localStorage
   */
  private saveFavorites(favorites: Set<string>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    this.favoritesSubject.next(favorites);
  }

  /**
   * Récupère tous les favoris
   */
  getFavorites(): Set<string> {
    return this.favoritesSubject.value;
  }

  /**
   * Vérifie si un restaurant est en favori
   */
  isFavorite(restaurantId: string): boolean {
    return this.favoritesSubject.value.has(restaurantId);
  }

  /**
   * Ajoute un restaurant aux favoris
   */
  addFavorite(restaurantId: string): void {
    const currentFavorites = new Set(this.favoritesSubject.value);
    currentFavorites.add(restaurantId);
    this.saveFavorites(currentFavorites);
  }

  /**
   * Retire un restaurant des favoris
   */
  removeFavorite(restaurantId: string): void {
    const currentFavorites = new Set(this.favoritesSubject.value);
    currentFavorites.delete(restaurantId);
    this.saveFavorites(currentFavorites);
  }

  /**
   * Toggle le statut favori d'un restaurant
   */
  toggleFavorite(restaurantId: string): void {
    if (this.isFavorite(restaurantId)) {
      this.removeFavorite(restaurantId);
    } else {
      this.addFavorite(restaurantId);
    }
  }

  /**
   * Récupère le nombre de favoris
   */
  getFavoritesCount(): number {
    return this.favoritesSubject.value.size;
  }

  /**
   * Vide tous les favoris
   */
  clearFavorites(): void {
    this.saveFavorites(new Set());
  }
}

