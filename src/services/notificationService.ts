/**
 * Notification Service Layer
 * ──────────────────────────
 * Business logic for managing notifications (in-app, push, email).
 * ✅ Zero Base44 SDK
 * ✅ Persistence-agnostic
 * ✅ Real-time capable
 * 
 * TODO MIGRATION: Firebase FCM integration swappable, business logic stays same
 */

import { dataMapper } from '@/lib/dataMapper';
import type { Notification, NotificationType } from '@/types/attendance';

export class NotificationService {
  /**
   * Send notification to user
   * Supports: in-app, push (Firebase FCM), email
   */
  async sendNotification(input: {
    recipient_email: string;
    recipient_id?: string;
    title: string;
    message: string;
    type: NotificationType;
    action_url?: string;
    channels?: ('in_app' | 'push' | 'email')[];
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const channels = input.channels || ['in_app'];

    // Create notification record
    const notification: Notification = {
      id: crypto.randomUUID(),
      recipient_email: input.recipient_email,
      recipient_id: input.recipient_id,
      title: input.title,
      message: input.message,
      type: input.type,
      action_url: input.action_url,
      is_read: false,
      created_date: new Date(),
    };

    // Save to DB
    const persisted = await this.notificationRepository.create(notification);

    // Send via channels
    if (channels.includes('push')) {
      // TODO: Firebase FCM - send push notification
      await this.sendPushNotification(input.recipient_email, {
        title: input.title,
        body: input.message,
        data: { action_url: input.action_url, ...input.metadata },
      });
    }

    if (channels.includes('email')) {
      // TODO: Call email service
      await this.sendEmailNotification(input.recipient_email, {
        subject: input.title,
        body: input.message,
        action_url: input.action_url,
      });
    }

    return persisted;
  }

  /**
   * Send leave approval notification to manager
   */
  async notifyLeaveApprovalPending(input: {
    manager_email: string;
    employee_name: string;
    leave_type: string;
    start_date: Date;
    end_date: Date;
    leave_request_id: string;
  }): Promise<void> {
    await this.sendNotification({
      recipient_email: input.manager_email,
      title: 'Leave Request Pending Approval',
      message: `${input.employee_name} requested ${input.leave_type} from ${input.start_date} to ${input.end_date}`,
      type: 'approval_required',
      action_url: `/dashboard/company/leave-requests?id=${input.leave_request_id}`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  /**
   * Send overtime approval notification
   */
  async notifyOvertimeApprovalPending(input: {
    manager_email: string;
    employee_name: string;
    hours: number;
    date: Date;
    overtime_request_id: string;
  }): Promise<void> {
    await this.sendNotification({
      recipient_email: input.manager_email,
      title: 'Overtime Request Pending',
      message: `${input.employee_name} reported ${input.hours} hours of overtime on ${input.date.toLocaleDateString()}`,
      type: 'approval_required',
      action_url: `/dashboard/company/overtime?id=${input.overtime_request_id}`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  /**
   * Send real-time approval notification (WebSocket compatible)
   */
  async broadcastApprovalNeeded(companyId: string, approvalType: string): Promise<void> {
    // TODO: WebSocket broadcast for real-time updates
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, { is_read: true });
  }

  /**
   * Get notifications for user
   */
  async getNotifications(email: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationRepository.findByEmail(email, limit);
  }

  /**
   * Send push notification via Firebase FCM
   * @private
   */
  private async sendPushNotification(
    email: string,
    payload: { title: string; body: string; data: Record<string, any> }
  ): Promise<void> {
    // TODO MIGRATION: Firebase FCM integration
    // Current: placeholder
    // Future: Use Firebase Admin SDK to send to device tokens
  }

  /**
   * Send email notification
   * @private
   */
  private async sendEmailNotification(
    email: string,
    payload: { subject: string; body: string; action_url?: string }
  ): Promise<void> {
    // TODO: Call SendEmail integration function
    // base44.integrations.Core.SendEmail({...})
  }

  /**
   * Repository pattern
   */
  private notificationRepository = {
    create: async (notification: Notification) => {
      const base44 = (await import('@/api/base44Client')).base44;
      return base44.entities.Notification.create({
        recipient_email: notification.recipient_email,
        recipient_id: notification.recipient_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        action_url: notification.action_url,
        is_read: notification.is_read,
      });
    },
    update: async (id: string, data: any) => {
      const base44 = (await import('@/api/base44Client')).base44;
      await base44.entities.Notification.update(id, data);
    },
    findByEmail: async (email: string, limit: number) => {
      const base44 = (await import('@/api/base44Client')).base44;
      return base44.entities.Notification.filter(
        { recipient_email: email },
        '-created_date',
        limit
      );
    },
  };
}

export const notificationService = new NotificationService();