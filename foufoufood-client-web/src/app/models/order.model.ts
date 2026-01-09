import { Address } from './user.model';
import { MenuItem } from './menu.model';

export type OrderStatus = 'En attente' | 'Confirmée' | 'Préparée' | 'En livraison' | 'Livrée' | 'Annulée';

export interface OrderItem {
  menuItem: MenuItem | string; // Can be populated or just ID
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Order {
  _id?: string;
  id?: string; // Some APIs might use id instead of _id
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    phone?: string;
  } | string; // Can be populated or just ID
  restaurant: {
    _id?: string;
    id?: string;
    name: string;
    address?: string;
    cuisine?: string;
    phone?: string;
  } | string; // Can be populated or just ID
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  deliveryPartner?: {
    _id?: string;
    id?: string;
    user?: {
      name: string;
      email: string;
    };
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  deliveryAddress: DeliveryAddress;
  useCart?: boolean;
  restaurantId?: string;
  items?: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

