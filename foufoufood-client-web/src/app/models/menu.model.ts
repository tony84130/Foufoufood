export type MenuCategory = 'Entrée' | 'Plat' | 'Dessert' | 'Boisson' | 'Accompagnement' | 'Autre';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  image?: string;
  restaurant: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  category?: MenuCategory;
  image?: string;
  restaurantId: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: MenuCategory;
  image?: string;
}

