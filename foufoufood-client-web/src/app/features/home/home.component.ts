import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    public router: Router,
    public authService: AuthService
  ) {}

  navigateToSignup(role: 'client' | 'delivery_partner'): void {
    this.router.navigate(['/auth/signup'], { queryParams: { role } });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRestaurants(): void {
    this.router.navigate(['/restaurants']);
  }

  getRoleDisplay(role: string | null): string {
    switch (role) {
      case 'client':
        return 'Client';
      case 'delivery_partner':
        return 'Livreur';
      case 'restaurant_admin':
        return 'Administrateur Restaurant';
      case 'platform_admin':
        return 'Administrateur Plateforme';
      default:
        return 'Utilisateur';
    }
  }

  getWelcomeMessage(role: string | null): string {
    switch (role) {
      case 'client':
        return 'Découvrez nos restaurants partenaires et commandez vos plats préférés en quelques clics !';
      case 'delivery_partner':
        return 'Consultez les commandes disponibles et commencez à livrer dès maintenant !';
      case 'restaurant_admin':
        return 'Gérez vos restaurants, vos menus et vos commandes depuis votre tableau de bord.';
      case 'platform_admin':
        return 'Administrez la plateforme, gérez les utilisateurs et les restaurants.';
      default:
        return 'Bienvenue sur FoufouFood !';
    }
  }
}

