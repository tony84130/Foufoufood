import { Address } from './user.model';

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
}

export interface Review {
  user?: {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
  } | string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine?: string;
  phone?: string;
  openingHours?: OpeningHours[];
  menu?: string[];
  rating: number;
  adminUser?: string;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRestaurantRequest {
  name: string;
  address: string;
  cuisine?: string;
  phone?: string;
  openingHours?: OpeningHours[];
}

export interface UpdateRestaurantRequest {
  name?: string;
  address?: string;
  cuisine?: string;
  phone?: string;
  openingHours?: OpeningHours[];
}

export interface CreateRestaurantWithAdminRequest {
  restaurant: CreateRestaurantRequest;
  admin: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: Address;
  };
}

export interface RestaurantReviewRequest {
  rating: number;
  comment?: string;
}

