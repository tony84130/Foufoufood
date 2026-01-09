import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'restaurants',
        loadComponent: () => import('./features/restaurants-list/restaurants-list.component').then(m => m.RestaurantsListComponent)
      },
      {
        path: 'favorites',
        loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
      },
      {
        path: 'restaurants/:id',
        loadComponent: () => import('./features/restaurant-detail/restaurant-detail.component').then(m => m.RestaurantDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
        canActivate: [authGuard]
      },
      {
        path: 'order-confirmation/:id',
        loadComponent: () => import('./features/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent),
        canActivate: [authGuard]
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders-list/orders-list.component').then(m => m.OrdersListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        canActivate: [authGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin-platform/admin-platform.component').then(m => m.AdminPlatformComponent),
        canActivate: [roleGuard(['platform_admin'])]
      },
      {
        path: 'restaurant-admin',
        loadComponent: () => import('./features/admin-restaurant/admin-restaurant.component').then(m => m.AdminRestaurantComponent),
        canActivate: [roleGuard(['restaurant_admin'])]
      },
      {
        path: 'delivery-orders',
        loadComponent: () => import('./features/delivery-orders/delivery-orders.component').then(m => m.DeliveryOrdersComponent),
        canActivate: [roleGuard(['delivery_partner'])]
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
