import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { filter } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  showHeader = true;
  showProfileMenu = false;
  cartItemCount = 0;
  private cartSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {
    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Fermer le menu profil lors de la navigation
        this.showProfileMenu = false;
        // Masquer le header sur la page d'accueil
        this.showHeader = event.url !== '/' && event.urlAfterRedirects !== '/';
      });
    
    // Masquer le header sur la page d'accueil au chargement initial
    this.showHeader = this.router.url !== '/';
  }

  ngOnInit(): void {
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cartItemCount = this.cartService.getCartItemCount();
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu-container')) {
      this.showProfileMenu = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Raccourci clavier : Escape pour fermer le menu profil
    if (event.key === 'Escape' && this.showProfileMenu) {
      this.closeProfileMenu();
    }
    // Raccourci clavier : Ctrl+K ou Cmd+K pour rechercher (focus sur recherche si disponible)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('input[type="text"][placeholder*="Rechercher"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  }

  get user() {
    return this.authService.user();
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  get userRole() {
    return this.authService.userRole();
  }

  get currentUser() {
    return this.authService.user();
  }

  logout(): void {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        // Même en cas d'erreur, on redirige vers la page d'accueil
        this.router.navigate(['/']);
      }
    });
  }

  getRoleDisplay(role: string | null): string {
    const roleMap: Record<string, string> = {
      'client': 'Client',
      'delivery_partner': 'Partenaire de livraison',
      'restaurant_admin': 'Admin Restaurant',
      'platform_admin': 'Admin Plateforme'
    };
    return role ? roleMap[role] || role : '';
  }
}

