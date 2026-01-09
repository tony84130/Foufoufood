import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  isOpen = signal<boolean>(false);
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  
  private subscriptions = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // S'abonner aux notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications.set(notifications);
      })
    );

    // S'abonner au compteur de non lues
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount.set(count);
      })
    );

    // Charger les notifications existantes
    this.notificationService.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      // Marquer toutes comme lues quand on ouvre
      this.notificationService.markAllAsRead();
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  markAsRead(notification: Notification): void {
    if (notification.id) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  removeNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (notification.id) {
      this.notificationService.removeNotification(notification.id);
    }
  }

  clearAll(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      this.notificationService.clearAll();
    }
  }

  goToOrder(orderId: string): void {
    this.closeDropdown();
    // Navigation vers la page de détails de la commande
    window.location.href = `/orders/${orderId}`;
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'En attente':
        return '⏳';
      case 'Confirmée':
        return '✅';
      case 'Préparée':
        return '👨‍🍳';
      case 'En livraison':
        return '🚚';
      case 'Livrée':
        return '🎉';
      case 'Annulée':
        return '❌';
      default:
        return '📦';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'status_update':
        return '🔄';
      case 'order_confirmation':
        return '✅';
      case 'delivery_assignment':
        return '🚚';
      default:
        return '📬';
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return 'À l\'instant';
    } else if (minutes < 60) {
      return `Il y a ${minutes} min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else if (days < 7) {
      return `Il y a ${days}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Fermer le dropdown si on clique en dehors du composant de notifications
    if (this.isOpen() && !target.closest('.notifications-container')) {
      this.closeDropdown();
    }
  }
}

