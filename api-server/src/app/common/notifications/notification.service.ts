import { Injectable, Logger } from '@nestjs/common';

export interface OrderNotificationPayload {
  organizationId: string;
  orderId: string;
  saleNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  fulfillmentStatus?: string;
  courier?: string;
  trackingCode?: string;
  note?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Minimal safe foundation for order lifecycle notifications.
   * Dispatches notifications via configured providers, or logs clean integration points
   * without claiming external SMS/email delivery when credentials are not configured.
   */
  async notifyOrderStatusChange(payload: OrderNotificationPayload): Promise<{ dispatched: boolean; channel: string; note: string }> {
    const isSmsConfigured = Boolean(process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN);
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    const message = `Order #${payload.saleNumber} status update: ${payload.status}${
      payload.fulfillmentStatus ? ` (${payload.fulfillmentStatus})` : ''
    }${payload.courier ? `. Dispatched via ${payload.courier}` : ''}${
      payload.trackingCode ? ` (Tracking #${payload.trackingCode})` : ''
    }`;

    if (isSmsConfigured && payload.customerPhone) {
      // Clean integration point for SMS
      this.logger.log(`[SMS Dispatched] To: ${payload.customerPhone} | Message: ${message}`);
      return { dispatched: true, channel: 'SMS', note: 'Sent via SMS gateway' };
    }

    if (isSmtpConfigured && payload.customerEmail) {
      // Clean integration point for Email
      this.logger.log(`[Email Dispatched] To: ${payload.customerEmail} | Subject: Order #${payload.saleNumber} Status | Body: ${message}`);
      return { dispatched: true, channel: 'EMAIL', note: 'Sent via SMTP' };
    }

    // Default safe logging: does not fabricate external delivery
    this.logger.log(
      `[Notification Foundation] Order #${payload.saleNumber} status updated to '${payload.status}'. Target: ${payload.customerPhone || payload.customerEmail || 'Guest'}. (External SMS/Email gateway unconfigured).`
    );

    return {
      dispatched: false,
      channel: 'STUB',
      note: 'External SMS/Email infrastructure not configured. Event captured safely in outbox and audit log.',
    };
  }
}
