import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { Restaurant, OpeningHours } from '../../models/restaurant.model';
import { MenuItem, MenuCategory } from '../../models/menu.model';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-admin-restaurant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-restaurant.component.html',
  styleUrl: './admin-restaurant.component.scss'
})
export class AdminRestaurantComponent implements OnInit, OnDestroy {
  restaurants = signal<Restaurant[]>([]);
  selectedRestaurant = signal<Restaurant | null>(null);
  menuItems = signal<MenuItem[]>([]);
  orders = signal<Order[]>([]);
  isLoadingOrders = signal(false);
  
  restaurantForm: FormGroup;
  menuForm: FormGroup;
  
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private successMessageTimer: any = null;
  
  showRestaurantForm = false;
  showMenuForm = false;
  editingMenuItem: MenuItem | null = null;
  activeTab: 'menu' | 'reviews' | 'orders' = 'menu';
  selectedOrderStatus: OrderStatus | 'all' = 'all';
  isUpdatingOrderStatus = signal<string | null>(null);
  
  menuCategories: MenuCategory[] = ['Entrée', 'Plat', 'Dessert', 'Boisson', 'Accompagnement', 'Autre'];
  daysOfWeek = [
    { value: 'Mon', label: 'Lundi' },
    { value: 'Tue', label: 'Mardi' },
    { value: 'Wed', label: 'Mercredi' },
    { value: 'Thu', label: 'Jeudi' },
    { value: 'Fri', label: 'Vendredi' },
    { value: 'Sat', label: 'Samedi' },
    { value: 'Sun', label: 'Dimanche' }
  ];

  constructor(
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private menuService: MenuService,
    private orderService: OrderService
  ) {
    this.restaurantForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      cuisine: [''],
      phone: [''],
      openingHours: this.fb.array([])
    });

    this.menuForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['Autre', [Validators.required]],
      image: ['']
    });
  }

  ngOnInit(): void {
    this.loadRestaurants();
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
    this.restaurantService.getMyRestaurants().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.restaurants.set(response.data);
          if (response.data.length > 0 && !this.selectedRestaurant()) {
            this.selectRestaurant(response.data[0]);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des restaurants';
        this.isLoading = false;
      }
    });
  }

  selectRestaurant(restaurant: Restaurant): void {
    // Recharger le restaurant complet avec les reviews à jour
    this.restaurantService.getRestaurantById(restaurant.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedRestaurant.set(response.data);
          const updatedRestaurant = response.data;
          
          this.restaurantForm.patchValue({
            name: updatedRestaurant.name,
            address: updatedRestaurant.address,
            cuisine: updatedRestaurant.cuisine || '',
            phone: updatedRestaurant.phone || ''
          });
          
          // Charger les horaires d'ouverture
          const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
          openingHoursArray.clear();
          
          if (updatedRestaurant.openingHours && updatedRestaurant.openingHours.length > 0) {
            updatedRestaurant.openingHours.forEach(hours => {
              openingHoursArray.push(this.fb.group({
                day: [hours.day, [Validators.required]],
                open: [hours.open, [Validators.required]],
                close: [hours.close, [Validators.required]]
              }));
            });
          }
          
          this.loadMenuItems(updatedRestaurant.id);
          if (this.activeTab === 'orders') {
            this.loadOrders(updatedRestaurant.id);
          }
        } else {
          // Fallback si l'appel échoue, utiliser le restaurant de la liste
          this.selectedRestaurant.set(restaurant);
          this.restaurantForm.patchValue({
            name: restaurant.name,
            address: restaurant.address,
            cuisine: restaurant.cuisine || '',
            phone: restaurant.phone || ''
          });
          
          const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
          openingHoursArray.clear();
          
          if (restaurant.openingHours && restaurant.openingHours.length > 0) {
            restaurant.openingHours.forEach(hours => {
              openingHoursArray.push(this.fb.group({
                day: [hours.day, [Validators.required]],
                open: [hours.open, [Validators.required]],
                close: [hours.close, [Validators.required]]
              }));
            });
          }
          
          this.loadMenuItems(restaurant.id);
          if (this.activeTab === 'orders') {
            this.loadOrders(restaurant.id);
          }
        }
      },
      error: () => {
        // En cas d'erreur, utiliser le restaurant de la liste
        this.selectedRestaurant.set(restaurant);
        this.restaurantForm.patchValue({
          name: restaurant.name,
          address: restaurant.address,
          cuisine: restaurant.cuisine || '',
          phone: restaurant.phone || ''
        });
        
        const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
        openingHoursArray.clear();
        
        if (restaurant.openingHours && restaurant.openingHours.length > 0) {
          restaurant.openingHours.forEach(hours => {
            openingHoursArray.push(this.fb.group({
              day: [hours.day, [Validators.required]],
              open: [hours.open, [Validators.required]],
              close: [hours.close, [Validators.required]]
            }));
          });
        }
        
        this.loadMenuItems(restaurant.id);
        if (this.activeTab === 'orders') {
          this.loadOrders(restaurant.id);
        }
      }
    });
  }

  loadOrders(restaurantId: string): void {
    if (!restaurantId) return;
    
    this.isLoadingOrders.set(true);
    const status = this.selectedOrderStatus === 'all' ? undefined : this.selectedOrderStatus;
    
    this.orderService.getRestaurantOrders(restaurantId, status).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.orders.set(response.data);
        }
        this.isLoadingOrders.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoadingOrders.set(false);
      }
    });
  }

  onOrderStatusFilterChange(status: OrderStatus | 'all'): void {
    this.selectedOrderStatus = status;
    const restaurant = this.selectedRestaurant();
    if (restaurant) {
      this.loadOrders(restaurant.id);
    }
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    if (newStatus === 'Préparée') {
      if (!confirm('Marquer cette commande comme "Préparée" ? Elle sera prête pour la livraison.')) {
        return;
      }
    }

    this.isUpdatingOrderStatus.set(orderId);
    this.errorMessage = null;

    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          this.setSuccessMessage('Statut de la commande mis à jour avec succès');
          const restaurant = this.selectedRestaurant();
          if (restaurant) {
            this.loadOrders(restaurant.id);
          }
        } else {
          this.errorMessage = response.message || 'Erreur lors de la mise à jour du statut';
        }
        this.isUpdatingOrderStatus.set(null);
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du statut';
        this.isUpdatingOrderStatus.set(null);
      }
    });
  }

  getOrderId(order: Order): string {
    return order._id || order.id || '';
  }

  getCustomerName(order: Order): string {
    if (typeof order.user === 'string') return '';
    return order.user.name || '';
  }

  getDeliveryAddress(order: Order): string {
    if (!order.deliveryAddress) return '';
    const addr = order.deliveryAddress;
    let address = addr.line1;
    if (addr.line2) {
      address += ', ' + addr.line2;
    }
    address += `, ${addr.city}, ${addr.region} ${addr.postalCode}`;
    return address;
  }

  canUpdateToPrepared(order: Order): boolean {
    return order.status === 'Confirmée';
  }

  canCancelOrder(order: Order): boolean {
    // Peut annuler si la commande n'est pas déjà annulée ou livrée
    return order.status !== 'Annulée' && order.status !== 'Livrée';
  }

  cancelOrder(orderId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ? Le client sera notifié de l\'annulation.')) {
      return;
    }

    this.isUpdatingOrderStatus.set(orderId);
    this.errorMessage = null;

    // Utiliser updateOrderStatus pour mettre le statut à "Annulée"
    // Cela enverra automatiquement une notification au client
    this.orderService.updateOrderStatus(orderId, 'Annulée').subscribe({
      next: (response) => {
        if (response.success) {
          this.setSuccessMessage('Commande annulée avec succès. Le client a été notifié.');
          const restaurant = this.selectedRestaurant();
          if (restaurant) {
            this.loadOrders(restaurant.id);
          }
        } else {
          this.errorMessage = response.message || 'Erreur lors de l\'annulation de la commande';
        }
        this.isUpdatingOrderStatus.set(null);
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'annulation de la commande';
        this.isUpdatingOrderStatus.set(null);
      }
    });
  }

  getStatusClass(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'En attente': 'pending',
      'Confirmée': 'confirmed',
      'Préparée': 'prepared',
      'En livraison': 'delivering',
      'Livrée': 'delivered',
      'Annulée': 'cancelled'
    };
    return statusMap[status] || 'unknown';
  }

  formatOrderDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  loadMenuItems(restaurantId: string): void {
    this.menuService.getMenuItems(restaurantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.menuItems.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
      }
    });
  }

  openCreateForm(): void {
    // Forcer la création d'un nouveau restaurant
    this.selectedRestaurant.set(null);
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    openingHoursArray.clear();
    
    this.restaurantForm.reset({
      name: '',
      address: '',
      cuisine: '',
      phone: '',
      openingHours: []
    });
    this.menuItems.set([]);
    this.showRestaurantForm = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  toggleRestaurantForm(): void {
    const wasOpen = this.showRestaurantForm;
    const hadSelectedRestaurant = !!this.selectedRestaurant();
    this.showRestaurantForm = !this.showRestaurantForm;
    
    if (this.showRestaurantForm && !wasOpen) {
      // Ouvrir le formulaire pour modifier un restaurant existant
      const restaurant = this.selectedRestaurant();
      if (restaurant) {
        this.restaurantForm.patchValue({
          name: restaurant.name,
          address: restaurant.address,
          cuisine: restaurant.cuisine || '',
          phone: restaurant.phone || ''
        });
        
        // Charger les horaires d'ouverture
        const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
        openingHoursArray.clear();
        
        if (restaurant.openingHours && restaurant.openingHours.length > 0) {
          restaurant.openingHours.forEach(hours => {
            openingHoursArray.push(this.fb.group({
              day: [hours.day, [Validators.required]],
              open: [hours.open, [Validators.required]],
              close: [hours.close, [Validators.required]]
            }));
          });
        }
      }
    } else if (!this.showRestaurantForm && wasOpen) {
      // Fermer le formulaire
      if (!hadSelectedRestaurant) {
        // Si on annulait la création d'un nouveau restaurant, resélectionner le premier restaurant
        if (this.restaurants().length > 0) {
          this.selectRestaurant(this.restaurants()[0]);
        }
      } else {
        // Si on modifiait un restaurant existant, restaurer ses valeurs dans le formulaire
        const restaurant = this.selectedRestaurant();
        if (restaurant) {
          this.restaurantForm.patchValue({
            name: restaurant.name,
            address: restaurant.address,
            cuisine: restaurant.cuisine || '',
            phone: restaurant.phone || ''
          });
          
          // Restaurer les horaires d'ouverture
          const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
          openingHoursArray.clear();
          
          if (restaurant.openingHours && restaurant.openingHours.length > 0) {
            restaurant.openingHours.forEach(hours => {
              openingHoursArray.push(this.fb.group({
                day: [hours.day, [Validators.required]],
                open: [hours.open, [Validators.required]],
                close: [hours.close, [Validators.required]]
              }));
            });
          }
        }
      }
    }
  }

  toggleMenuForm(menuItem?: MenuItem): void {
    if (menuItem) {
      this.editingMenuItem = menuItem;
      this.menuForm.patchValue({
        name: menuItem.name,
        description: menuItem.description || '',
        price: menuItem.price,
        category: menuItem.category,
        image: menuItem.image || ''
      });
    } else {
      this.editingMenuItem = null;
      this.menuForm.reset({
        category: 'Autre'
      });
    }
    this.showMenuForm = !this.showMenuForm;
  }

  onCreateRestaurant(): void {
    if (this.restaurantForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.restaurantForm.value;
    if (!formValue.cuisine) delete formValue.cuisine;
    if (!formValue.phone) delete formValue.phone;
    
    // Nettoyer les horaires d'ouverture vides
    if (formValue.openingHours && formValue.openingHours.length > 0) {
      formValue.openingHours = formValue.openingHours.filter((hours: any) => hours.day && hours.open && hours.close);
      if (formValue.openingHours.length === 0) {
        delete formValue.openingHours;
      }
    } else {
      delete formValue.openingHours;
    }

    this.restaurantService.createRestaurant(formValue).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.setSuccessMessage('Restaurant créé avec succès');
          this.showRestaurantForm = false;
          // Recharger les restaurants et sélectionner le nouveau restaurant créé
          this.isLoading = true;
          this.restaurantService.getMyRestaurants().subscribe({
            next: (listResponse) => {
              if (listResponse.success && listResponse.data) {
                this.restaurants.set(listResponse.data);
                // Sélectionner automatiquement le nouveau restaurant créé
                const newRestaurant = listResponse.data.find(r => r.id === response.data.id);
                if (newRestaurant) {
                  this.selectRestaurant(newRestaurant);
                } else if (listResponse.data.length > 0) {
                  // Si on ne trouve pas le nouveau restaurant, sélectionner le premier
                  this.selectRestaurant(listResponse.data[0]);
                }
              }
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la création';
        this.isLoading = false;
      }
    });
  }

  onUpdateRestaurant(): void {
    const restaurant = this.selectedRestaurant();
    if (!restaurant || this.restaurantForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.restaurantForm.value;
    if (!formValue.cuisine) delete formValue.cuisine;
    if (!formValue.phone) delete formValue.phone;
    
    // Nettoyer les horaires d'ouverture vides
    if (formValue.openingHours && formValue.openingHours.length > 0) {
      formValue.openingHours = formValue.openingHours.filter((hours: any) => hours.day && hours.open && hours.close);
      if (formValue.openingHours.length === 0) {
        delete formValue.openingHours;
      }
    } else {
      delete formValue.openingHours;
    }

    this.restaurantService.updateRestaurant(restaurant.id, formValue).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedRestaurant.set(response.data);
          this.setSuccessMessage('Restaurant mis à jour avec succès');
          this.showRestaurantForm = false;
          this.loadRestaurants();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour';
        this.isLoading = false;
      }
    });
  }

  onSaveMenuItem(): void {
    const restaurant = this.selectedRestaurant();
    if (!restaurant || this.menuForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.menuForm.value;
    formValue.price = parseFloat(formValue.price);
    
    // Gérer les champs vides : supprimer ou mettre à null
    if (!formValue.description || formValue.description.trim() === '') {
      formValue.description = null;
    }
    if (!formValue.image || formValue.image.trim() === '') {
      formValue.image = null;
    }

    if (this.editingMenuItem) {
      // Mise à jour
      this.menuService.updateMenuItem(this.editingMenuItem.id, formValue).subscribe({
        next: (response) => {
          if (response.success) {
            this.setSuccessMessage('Item de menu mis à jour avec succès');
            this.showMenuForm = false;
            this.loadMenuItems(restaurant.id);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour';
          this.isLoading = false;
        }
      });
    } else {
      // Création
      formValue.restaurantId = restaurant.id;
      this.menuService.createMenuItem(formValue).subscribe({
        next: (response) => {
          if (response.success) {
            this.setSuccessMessage('Item de menu ajouté avec succès');
            this.showMenuForm = false;
            this.loadMenuItems(restaurant.id);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la création';
          this.isLoading = false;
        }
      });
    }
  }

  onDeleteMenuItem(menuItem: MenuItem): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
      return;
    }

    this.menuService.deleteMenuItem(menuItem.id).subscribe({
      next: () => {
        const restaurant = this.selectedRestaurant();
        if (restaurant) {
          this.loadMenuItems(restaurant.id);
          this.setSuccessMessage('Item supprimé avec succès');
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  get openingHoursArray(): FormArray {
    return this.restaurantForm.get('openingHours') as FormArray;
  }

  hasHoursForDay(dayValue: string): boolean {
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    return openingHoursArray.controls.some(control => control.get('day')?.value === dayValue);
  }

  getHoursForDay(dayValue: string): { open: string; close: string } | null {
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    const control = openingHoursArray.controls.find(c => c.get('day')?.value === dayValue);
    if (control) {
      return {
        open: control.get('open')?.value || '09:00',
        close: control.get('close')?.value || '21:00'
      };
    }
    return null;
  }

  toggleDayHours(dayValue: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    
    if (checked) {
      // Ajouter les horaires pour ce jour
      const existingIndex = openingHoursArray.controls.findIndex(c => c.get('day')?.value === dayValue);
      if (existingIndex === -1) {
        openingHoursArray.push(this.fb.group({
          day: [dayValue, [Validators.required]],
          open: ['09:00', [Validators.required]],
          close: ['21:00', [Validators.required]]
        }));
      }
    } else {
      // Supprimer les horaires pour ce jour
      const index = openingHoursArray.controls.findIndex(c => c.get('day')?.value === dayValue);
      if (index !== -1) {
        openingHoursArray.removeAt(index);
      }
    }
  }

  updateDayHours(dayValue: string, field: 'open' | 'close', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    const control = openingHoursArray.controls.find(c => c.get('day')?.value === dayValue);
    
    if (control) {
      control.get(field)?.setValue(value);
    }
  }

  addOpeningHours(): void {
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    openingHoursArray.push(this.fb.group({
      day: ['Mon', [Validators.required]],
      open: ['09:00', [Validators.required]],
      close: ['21:00', [Validators.required]]
    }));
  }

  removeOpeningHours(index: number): void {
    const openingHoursArray = this.restaurantForm.get('openingHours') as FormArray;
    openingHoursArray.removeAt(index);
  }

  getDayLabel(dayValue: string): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : dayValue;
  }

  getSortedOpeningHours(): OpeningHours[] {
    const restaurant = this.selectedRestaurant();
    if (!restaurant || !restaurant.openingHours) {
      return [];
    }
    
    // Trier les horaires selon l'ordre des jours de la semaine
    return [...restaurant.openingHours].sort((a, b) => {
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  }

  getReviewUserName(review: any): string {
    if (review.user && typeof review.user === 'object') {
      return review.user.name || 'Utilisateur anonyme';
    }
    return 'Utilisateur anonyme';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  setActiveTab(tab: 'menu' | 'reviews' | 'orders'): void {
    this.activeTab = tab;
    const restaurant = this.selectedRestaurant();
    if (tab === 'orders' && restaurant) {
      this.loadOrders(restaurant.id);
    }
  }
}

