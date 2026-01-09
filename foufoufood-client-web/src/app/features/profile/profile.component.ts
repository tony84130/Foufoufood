import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Address } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  user = signal<User | null>(null);
  isLoading = false;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private successMessageTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: this.fb.group({
        line1: [''],
        line2: [''],
        city: [''],
        region: [''],
        postalCode: [''],
        country: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private setSuccessMessage(message: string, duration: number = 5000): void {
    // Nettoyer le timer précédent s'il existe
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }
    
    this.successMessage = message;
    
    // Masquer automatiquement le message après la durée spécifiée
    this.successMessageTimer = setTimeout(() => {
      this.successMessage = null;
      this.successMessageTimer = null;
    }, duration);
  }

  ngOnDestroy(): void {
    // Nettoyer le timer lors de la destruction du composant
    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const user = response.data;
          this.user.set(user);
          this.populateForm(user);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement du profil';
        this.isLoading = false;
      }
    });
  }

  populateForm(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: {
        line1: user.address?.line1 || '',
        line2: user.address?.line2 || '',
        city: user.address?.city || '',
        region: user.address?.region || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || ''
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Réinitialiser le formulaire si on annule
      const user = this.user();
      if (user) {
        this.populateForm(user);
      }
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.profileForm.value;
    
    // Nettoyer les champs vides de l'adresse
    if (formValue.address) {
      const address = Object.fromEntries(
        Object.entries(formValue.address).filter(([_, v]) => v !== '')
      );
      formValue.address = Object.keys(address).length > 0 ? address : undefined;
    }

    // Supprimer les champs vides
    if (!formValue.phone) {
      delete formValue.phone;
    }

    this.userService.updateCurrentUser(formValue).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user.set(response.data);
          this.authService.getCurrentUser(); // Mettre à jour le service d'auth
          this.setSuccessMessage('Profil mis à jour avec succès');
          this.isEditing = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour du profil';
        this.isLoading = false;
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }

    this.isLoading = true;
    this.userService.deleteCurrentUser().subscribe({
      next: () => {
        this.authService.signOut().subscribe(() => {
          this.router.navigate(['/']);
        });
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression du compte';
        this.isLoading = false;
      }
    });
  }

  get name() {
    return this.profileForm.get('name');
  }

  get email() {
    return this.profileForm.get('email');
  }

  get roleDisplay(): string {
    const role = this.user()?.role;
    const roleMap: Record<string, string> = {
      'client': 'Client',
      'delivery_partner': 'Partenaire de livraison',
      'restaurant_admin': 'Administrateur de restaurant',
      'platform_admin': 'Administrateur de la plateforme'
    };
    return role ? roleMap[role] || role : '';
  }
}

