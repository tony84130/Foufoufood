import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { UserService } from '../../core/services/user.service';
import { Restaurant } from '../../models/restaurant.model';
import { User } from '../../models/user.model';
import { Address } from '../../models/user.model';

@Component({
  selector: 'app-admin-platform',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-platform.component.html',
  styleUrl: './admin-platform.component.scss'
})
export class AdminPlatformComponent implements OnInit, OnDestroy {
  restaurantForm: FormGroup;
  restaurants = signal<Restaurant[]>([]);
  users = signal<User[]>([]);
  searchQuery = signal<string>('');
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private successMessageTimer: any = null;
  selectedTab: 'users' | 'restaurants' | 'create' = 'users';

  // Computed signals for filtered lists
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.users();
    }
    return this.users().filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      this.getRoleDisplay(user.role).toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  filteredRestaurants = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.restaurants();
    }
    return this.restaurants().filter(restaurant => 
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query) ||
      (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query)) ||
      (restaurant.phone && restaurant.phone.toLowerCase().includes(query))
    );
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private restaurantService: RestaurantService,
    private userService: UserService
  ) {
    this.restaurantForm = this.fb.group({
      restaurant: this.fb.group({
        name: ['', [Validators.required]],
        address: ['', [Validators.required]],
        cuisine: [''],
        phone: ['']
      }),
      admin: this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phone: [''],
        address: this.fb.group({
          line1: [''],
          line2: [''],
          city: [''],
          region: [''],
          postalCode: [''],
          country: ['']
        })
      })
    });
  }

  ngOnInit(): void {
    this.loadRestaurants();
    this.loadUsers();
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

  loadRestaurants(): void {
    this.isLoading = true;
    this.restaurantService.getRestaurants().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.restaurants.set(response.data);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des restaurants';
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  selectTab(tab: 'users' | 'restaurants' | 'create'): void {
    this.selectedTab = tab;
    if (tab !== 'create') {
      this.restaurantForm.reset();
      this.errorMessage = null;
      this.successMessage = null;
    }
    // Clear search when switching tabs
    this.searchQuery.set('');
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  private safeTrim(value: any): string | null {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== '' ? trimmed : null;
    }
    return null;
  }

  onSubmit(): void {
    if (this.restaurantForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.restaurantForm.controls).forEach(key => {
        const control = this.restaurantForm.get(key);
        if (control) {
          control.markAsTouched();
          if (control instanceof FormGroup) {
            Object.keys(control.controls).forEach(nestedKey => {
              control.get(nestedKey)?.markAsTouched();
              const nestedControl = control.get(nestedKey);
              if (nestedControl instanceof FormGroup) {
                Object.keys(nestedControl.controls).forEach(deepKey => {
                  nestedControl.get(deepKey)?.markAsTouched();
                });
              }
            });
          }
        }
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.restaurantForm.value;
    
    // Vérifier que les valeurs existent
    if (!formValue.restaurant || !formValue.admin) {
      this.errorMessage = 'Erreur: données du formulaire invalides';
      this.isLoading = false;
      return;
    }

    // Construire l'objet de requête proprement
    const request: any = {
      restaurant: {
        name: formValue.restaurant.name || '',
        address: formValue.restaurant.address || ''
      },
      admin: {
        name: formValue.admin.name || '',
        email: formValue.admin.email || '',
        password: formValue.admin.password || ''
      }
    };

    // Ajouter les champs optionnels seulement s'ils ne sont pas vides
    const cuisine = this.safeTrim(formValue.restaurant.cuisine);
    if (cuisine) {
      request.restaurant.cuisine = cuisine;
    }
    
    const restaurantPhone = this.safeTrim(formValue.restaurant.phone);
    if (restaurantPhone) {
      request.restaurant.phone = restaurantPhone;
    }
    
    const adminPhone = this.safeTrim(formValue.admin.phone);
    if (adminPhone) {
      request.admin.phone = adminPhone;
    }

    // Nettoyer l'adresse de l'admin
    if (formValue.admin.address) {
      const address: any = {};
      let hasAddress = false;
      
      const line1 = this.safeTrim(formValue.admin.address.line1);
      if (line1) {
        address.line1 = line1;
        hasAddress = true;
      }
      
      const line2 = this.safeTrim(formValue.admin.address.line2);
      if (line2) {
        address.line2 = line2;
        hasAddress = true;
      }
      
      const city = this.safeTrim(formValue.admin.address.city);
      if (city) {
        address.city = city;
        hasAddress = true;
      }
      
      const region = this.safeTrim(formValue.admin.address.region);
      if (region) {
        address.region = region;
        hasAddress = true;
      }
      
      const postalCode = this.safeTrim(formValue.admin.address.postalCode);
      if (postalCode) {
        address.postalCode = postalCode;
        hasAddress = true;
      }
      
      const country = this.safeTrim(formValue.admin.address.country);
      if (country) {
        address.country = country;
        hasAddress = true;
      }

      if (hasAddress) {
        request.admin.address = address;
      }
    }

    this.adminService.createRestaurantWithAdmin(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.setSuccessMessage('Restaurant et administrateur créés avec succès');
          this.restaurantForm.reset();
          this.selectedTab = 'restaurants';
          this.loadRestaurants();
          this.loadUsers();
        } else {
          this.errorMessage = response.message || 'Erreur lors de la création';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating restaurant:', error);
        this.errorMessage = error.error?.message || error.error?.error || error.message || 'Erreur lors de la création';
        this.isLoading = false;
      }
    });
  }

  deleteRestaurant(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ?')) {
      return;
    }

    this.restaurantService.deleteRestaurant(id).subscribe({
      next: () => {
        this.loadRestaurants();
        this.setSuccessMessage('Restaurant supprimé avec succès');
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  deleteUser(id: string, userName: string): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userName} ?`)) {
      return;
    }

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.setSuccessMessage('Utilisateur supprimé avec succès');
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  canDeleteUser(user: User): boolean {
    // L'admin platform peut supprimer tous les utilisateurs sauf les autres admins platform
    return user.role !== 'platform_admin';
  }

  get restaurantGroup() {
    return this.restaurantForm.get('restaurant') as FormGroup;
  }

  get adminGroup() {
    return this.restaurantForm.get('admin') as FormGroup;
  }

  get adminAddressGroup() {
    return this.adminGroup.get('address') as FormGroup;
  }

  getRoleDisplay(role: string): string {
    const roleMap: Record<string, string> = {
      'client': 'Client',
      'delivery_partner': 'Partenaire de livraison',
      'restaurant_admin': 'Admin Restaurant',
      'platform_admin': 'Admin Plateforme'
    };
    return roleMap[role] || role;
  }
}

