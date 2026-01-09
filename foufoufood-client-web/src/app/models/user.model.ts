export type UserRole = 'client' | 'delivery_partner' | 'restaurant_admin' | 'platform_admin';

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  role: UserRole;
  restaurants?: string[];
  orders?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  role?: 'client' | 'delivery_partner';
  phone?: string;
  address?: Address;
}

export interface SignInRequest {
  email: string;
  password: string;
}

