import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../models/api-response.model';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id?: string;
  type: 'status_update' | 'order_confirmation' | 'delivery_assignment';
  orderId: string;
  message: string;
  oldStatus?: string;
  newStatus?: string;
  timestamp: string;
  read: boolean;
  order?: {
    id: string;
    status: string;
    restaurant?: string;
    deliveryPartner?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = 'http://localhost:3000/foufoufood';
  private socket: Socket | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Écouter les changements d'authentification
    // Utiliser un effet pour surveiller les changements d'authentification
    this.checkAuthAndConnect();
    
    // Vérifier périodiquement l'état d'authentification
    setInterval(() => {
      this.checkAuthAndConnect();
    }, 5000);
  }

  private checkAuthAndConnect(): void {
    const isAuthenticated = this.authService.isAuthenticated();
    if (isAuthenticated) {
      if (!this.socket?.connected) {
        this.connect();
      } else {
        // Même si déjà connecté, charger les notifications au cas où
        this.loadNotifications();
      }
    } else if (this.socket?.connected) {
      this.disconnect();
    }
  }

  /**
   * Se connecte à Socket.IO pour recevoir les notifications en temps réel
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    const user = this.authService.user();

    if (!token || !user) {
      return;
    }

    // Se connecter à Socket.IO
    this.initializeSocket(token, user);
  }

  private initializeSocket(token: string, user: any): void {
    this.socket = io('http://localhost:3000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    // Authentifier avec le serveur
    const userId = (user as any).id || (user as any)._id || user.email;
    this.socket.emit('authenticate', {
      userId,
      token
    });

    // Écouter les événements
    this.socket.on('connect', () => {
      console.log('🔌 Connecté à Socket.IO');
    });

    this.socket.on('authenticated', () => {
      console.log('✅ Authentifié pour les notifications');
      this.loadNotifications();
    });

    this.socket.on('status_updated', (data: any) => {
      console.log('📬 Notification reçue:', data);
      this.addNotification({
        type: 'status_update',
        orderId: data.orderId,
        message: data.message,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        timestamp: new Date().toISOString(),
        read: false,
        order: data.order
      });
    });

    this.socket.on('order_confirmed', (data: any) => {
      console.log('📬 Confirmation de commande reçue:', data);
      this.addNotification({
        type: 'order_confirmation',
        orderId: data.orderId,
        message: data.message || 'Votre commande a été confirmée',
        timestamp: new Date().toISOString(),
        read: false,
        order: data.order
      });
    });

    this.socket.on('delivery_assigned', (data: any) => {
      console.log('📬 Livreur assigné:', data);
      this.addNotification({
        type: 'delivery_assignment',
        orderId: data.orderId,
        message: data.message || 'Un livreur a été assigné à votre commande',
        timestamp: new Date().toISOString(),
        read: false,
        order: data.order
      });
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
    });
  }

  /**
   * Se déconnecte de Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  /**
   * Charge les notifications depuis le serveur
   */
  loadNotifications(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Charger depuis le serveur
    this.http.get<ApiResponse<Notification[]>>(`${this.API_URL}/notifications`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Fusionner avec les notifications locales (priorité aux serveur)
            const serverNotifications = response.data.map(n => ({
              ...n,
              read: n.read || false
            }));
            
            // Charger aussi depuis localStorage pour les notifications en temps réel
            const stored = localStorage.getItem('notifications');
            let localNotifications: Notification[] = [];
            if (stored) {
              try {
                localNotifications = JSON.parse(stored);
              } catch (error) {
                console.error('Erreur lors du chargement des notifications locales:', error);
              }
            }

            // Fusionner : serveur en priorité, puis locales non présentes dans le serveur
            const serverIds = new Set(serverNotifications.map(n => n.id));
            const uniqueLocal = localNotifications.filter(n => n.id && !serverIds.has(n.id));
            const merged = [...serverNotifications, ...uniqueLocal]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 50); // Limiter à 50

            this.notificationsSubject.next(merged);
            this.saveNotifications();
            this.updateUnreadCount();
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des notifications:', err);
          // Fallback sur localStorage en cas d'erreur
          const stored = localStorage.getItem('notifications');
          if (stored) {
            try {
              const notifications = JSON.parse(stored);
              this.notificationsSubject.next(notifications);
              this.updateUnreadCount();
            } catch (error) {
              console.error('Erreur lors du chargement des notifications locales:', error);
            }
          }
        }
      });
  }

  /**
   * Ajoute une nouvelle notification
   */
  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    const newNotification: Notification = {
      ...notification,
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Ajouter en début de liste
    const updated = [newNotification, ...current];
    
    // Limiter à 50 notifications
    if (updated.length > 50) {
      updated.splice(50);
    }
    
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
    
    // Afficher une notification toast (optionnel)
    this.showToast(newNotification);
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(notif => ({ ...notif, read: true }));
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
    
    // Appeler l'API pour marquer comme lu côté serveur (cela supprime les notifications Redis)
    // Note: On garde les notifications locales marquées comme lues
    this.http.delete<ApiResponse<any>>(`${this.API_URL}/notifications/clear`).subscribe({
      next: () => {
        console.log('✅ Notifications marquées comme lues côté serveur');
        // Recharger pour synchroniser
        this.loadNotifications();
      },
      error: (err) => console.error('Erreur lors du marquage des notifications:', err)
    });
  }

  /**
   * Supprime une notification
   */
  removeNotification(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.filter(notif => notif.id !== notificationId);
    this.notificationsSubject.next(updated);
    this.saveNotifications();
    this.updateUnreadCount();
  }

  /**
   * Supprime toutes les notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    localStorage.removeItem('notifications');
    this.updateUnreadCount();
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Récupère toutes les notifications
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Met à jour le compteur de notifications non lues
   */
  private updateUnreadCount(): void {
    const unread = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unread);
  }

  /**
   * Sauvegarde les notifications dans localStorage
   */
  private saveNotifications(): void {
    const notifications = this.notificationsSubject.value;
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  /**
   * Affiche une notification toast (optionnel)
   */
  private showToast(notification: Notification): void {
    // Vous pouvez implémenter un système de toast ici
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FoufouFood', {
        body: notification.message,
        icon: '/assets/icons/icon-192x192.png'
      });
    }
  }

  /**
   * Demande la permission pour les notifications du navigateur
   */
  requestPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

