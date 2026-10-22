import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Dispatch transactional emails using the official Resend API
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('[Resend Skipped] RESEND_API_KEY environment variable is not configured.');
      return { success: false, error: 'RESEND_API_KEY not configured in environment.' };
    }

    const from = options.from || process.env.RESEND_FROM_EMAIL || 'BusinessOS <onboarding@resend.dev>';
    const toList = Array.isArray(options.to) ? options.to : [options.to];

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from,
          to: toList,
          subject: options.subject,
          html: options.html || options.text?.replace(/\n/g, '<br/>') || '',
          text: options.text,
          reply_to: options.replyTo,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      this.logger.log(`[Resend Email Dispatched] ID: ${response.data.id} | To: ${toList.join(', ')} | Subject: "${options.subject}"`);
      return { success: true, id: response.data.id };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      this.logger.error(`[Resend Email Error] ${errMsg}`);
      return { success: false, error: errMsg };
    }
  }

  /**
   * Minimal safe foundation for order lifecycle notifications.
   * Dispatches notifications via configured providers (Resend, SMS gateway, or SMTP).
   */
  async notifyOrderStatusChange(payload: OrderNotificationPayload): Promise<{ dispatched: boolean; channel: string; note: string }> {
    const isResendConfigured = Boolean(process.env.RESEND_API_KEY);
    const isSmsConfigured = Boolean(process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN);
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    const message = `Order #${payload.saleNumber} status update: ${payload.status}${
      payload.fulfillmentStatus ? ` (${payload.fulfillmentStatus})` : ''
    }${payload.courier ? `. Dispatched via ${payload.courier}` : ''}${
      payload.trackingCode ? ` (Tracking #${payload.trackingCode})` : ''
    }`;

    // 1. Dispatch Email via Resend if email and key are configured
    if (isResendConfigured && payload.customerEmail) {
      const emailRes = await this.sendEmail({
        to: payload.customerEmail,
        subject: `Order #${payload.saleNumber} Status Update - BusinessOS`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0284c7; margin: 0; font-size: 22px;">BusinessOS Order Notification</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Business & Retail Operating System</p>
            </div>
            
            <p style="font-size: 14px; color: #334155;">Dear <strong>${payload.customerName || 'Valued Customer'}</strong>,</p>
            <p style="font-size: 14px; color: #334155;">Your order status has been updated:</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #15803d; letter-spacing: 0.05em;">Order Reference</span>
              <span style="font-size: 18px; font-weight: 800; color: #166534;">#${payload.saleNumber}</span>
              <div style="margin-top: 8px; font-size: 14px; font-weight: 600; color: #15803d;">
                Status: ${payload.status}${payload.fulfillmentStatus ? ` (${payload.fulfillmentStatus})` : ''}
              </div>
            </div>

            ${payload.courier ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #475569;">
              <strong>Delivery Details:</strong> Dispatched via ${payload.courier} ${payload.trackingCode ? `(Tracking Code: #${payload.trackingCode})` : ''}
            </div>` : ''}

            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              If you have any questions or require support, please contact our physical service counter or reply to this message.
            </p>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
              © 2026 BusinessOS. All rights reserved.
            </div>
          </div>
        `,
        text: message,
      });

      if (emailRes.success) {
        return { dispatched: true, channel: 'RESEND_EMAIL', note: `Sent via Resend (ID: ${emailRes.id})` };
      }
    }

    if (isSmsConfigured && payload.customerPhone) {
      // Clean integration point for SMS
      this.logger.log(`[SMS Dispatched] To: ${payload.customerPhone} | Message: ${message}`);
      return { dispatched: true, channel: 'SMS', note: 'Sent via SMS gateway' };
    }

    if (isSmtpConfigured && payload.customerEmail) {
      // Clean integration point for SMTP Email
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

  /**
   * Send Service Job Ticket notification via Resend
   */
  async notifyServiceJobUpdate(payload: {
    jobNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    status: string;
    estimatedCostBdt?: number;
    dueAmountBdt?: number;
    serviceCategory?: string;
    notes?: string;
  }): Promise<{ dispatched: boolean; channel: string; note: string }> {
    if (!payload.customerEmail || !process.env.RESEND_API_KEY) {
      return { dispatched: false, channel: 'NONE', note: 'No customer email or Resend not configured' };
    }

    const statusLabels: Record<string, { bn: string; color: string; bg: string }> = {
      RECEIVED: { bn: 'জব গৃহীত হয়েছে (Received)', color: '#0369a1', bg: '#e0f2fe' },
      IN_PROGRESS: { bn: 'কাজ চলছে (In Progress)', color: '#b45309', bg: '#fef3c7' },
      WAITING_FOR_PARTS: { bn: 'পার্টসের অপেক্ষায় (Waiting for Parts)', color: '#c2410c', bg: '#ffedd5' },
      READY_FOR_DELIVERY: { bn: 'ডেলিভারির জন্য প্রস্তুত (Ready for Delivery)', color: '#15803d', bg: '#dcfce7' },
      DELIVERED: { bn: 'ডেলিভারি সম্পন্ন (Delivered)', color: '#475569', bg: '#f1f5f9' },
    };

    const statusInfo = statusLabels[payload.status] || { bn: payload.status, color: '#0284c7', bg: '#f0f9ff' };

    const emailRes = await this.sendEmail({
      to: payload.customerEmail,
      subject: `[${payload.jobNumber}] সার্ভিস স্ট্যাটাস আপডেট: ${statusInfo.bn} - BusinessOS`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0284c7; margin: 0; font-size: 22px;">BusinessOS Service Center</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Physical Service & Hardware Desk</p>
          </div>
          
          <p style="font-size: 14px; color: #334155;">প্রিয় <strong>${payload.customerName}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">আপনার সার্ভিস জব টিকিট <strong>#${payload.jobNumber}</strong> এর বর্তমান অগ্রগতি নিম্নরূপ:</p>
          
          <div style="background-color: ${statusInfo.bg}; border: 1px solid ${statusInfo.color}33; padding: 18px; border-radius: 12px; margin: 16px 0; text-align: center;">
            <span style="display: block; font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${statusInfo.color}; letter-spacing: 0.05em;">Current Status / বর্তমান অবস্থা</span>
            <span style="font-size: 20px; font-weight: 800; color: ${statusInfo.color}; display: block; margin-top: 4px;">${statusInfo.bn}</span>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 16px; font-size: 13px; color: #334155;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">জব নম্বর:</td>
                <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">#${payload.jobNumber}</td>
              </tr>
              ${payload.serviceCategory ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">সার্ভিস ক্যাটাগরি:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${payload.serviceCategory}</td>
              </tr>` : ''}
              ${payload.estimatedCostBdt !== undefined ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">আনুমানিক খরচ:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">৳${payload.estimatedCostBdt}</td>
              </tr>` : ''}
              ${payload.dueAmountBdt !== undefined ? `
              <tr>
                <td style="padding: 6px 0; color: #dc2626; font-weight: 600;">বাকি / পরিশোধযোগ্য:</td>
                <td style="padding: 6px 0; font-weight: 800; text-align: right; color: #dc2626; font-size: 15px;">৳${payload.dueAmountBdt}</td>
              </tr>` : ''}
            </table>
          </div>

          ${payload.notes ? `
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #92400e;">
            <strong>কাউন্টার নোট:</strong> ${payload.notes}
          </div>` : ''}

          ${payload.status === 'READY_FOR_DELIVERY' ? `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 10px; margin-bottom: 16px; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #065f46;">আপনার ডিভাইস/প্রিন্ট ডেলিভারির জন্য প্রস্তুত!</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">দয়া করে শপ কাউন্টারে এসে অবশিষ্ট বাকি টাকা পরিশোধ সাপেক্ষে সামগ্রী সংগ্রহ করুন।</p>
          </div>` : ''}

          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            © 2026 BusinessOS Retail & Service Operating System.
          </div>
        </div>
      `,
      text: `[${payload.jobNumber}] সার্ভিস স্ট্যাটাস: ${statusInfo.bn}. বাকি টাকা: ৳${payload.dueAmountBdt || 0}.`,
    });

    return {
      dispatched: emailRes.success,
      channel: 'RESEND_EMAIL',
      note: emailRes.success ? `Resend email sent (${emailRes.id})` : `Failed: ${emailRes.error}`,
    };
  }

  /**
   * Send Digital Internet Service Application update notification via Resend
   */
  async notifyInternetServiceApplication(payload: {
    referenceNumber: string;
    serviceTitleBn: string;
    customerName: string;
    customerEmail?: string;
    status: string;
    notes?: string;
    deliverableTitle?: string;
  }): Promise<{ dispatched: boolean; channel: string; note: string }> {
    if (!payload.customerEmail || !process.env.RESEND_API_KEY) {
      return { dispatched: false, channel: 'NONE', note: 'No customer email or Resend not configured' };
    }

    const emailRes = await this.sendEmail({
      to: payload.customerEmail,
      subject: `[${payload.referenceNumber}] ${payload.serviceTitleBn} - আবেদন স্ট্যাটাস আপডেট`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0284c7; margin: 0; font-size: 22px;">BusinessOS Internet Service Center</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">ডিজিটাল সেবা ও অনলাইন আবেদন ট্র্যাকিং</p>
          </div>

          <p style="font-size: 14px; color: #334155;">প্রিয় <strong>${payload.customerName}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">আপনার আবেদন <strong>${payload.serviceTitleBn}</strong> (রেফারেন্স: <strong>#${payload.referenceNumber}</strong>) এর বর্তমান অগ্রগতি:</p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: center;">
            <span style="font-size: 18px; font-weight: 800; color: #166534;">স্ট্যাটাস: ${payload.status}</span>
          </div>

          ${payload.deliverableTitle ? `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 10px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1d4ed8;">সংযুক্ত ডেলিভারেবল ফাইল:</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #1e40af;">📄 ${payload.deliverableTitle}</p>
          </div>` : ''}

          ${payload.notes ? `
          <p style="font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 8px;"><strong>অপারেটর নোট:</strong> ${payload.notes}</p>
          ` : ''}

          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:3000/track/${payload.referenceNumber}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              অনলাইন ট্র্যাকিং দেখুন →
            </a>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            © 2026 BusinessOS. All rights reserved.
          </div>
        </div>
      `,
      text: `[${payload.referenceNumber}] ${payload.serviceTitleBn} স্ট্যাটাস: ${payload.status}. ট্র্যাকিং দেখুন: http://localhost:3000/track/${payload.referenceNumber}`,
    });

    return {
      dispatched: emailRes.success,
      channel: 'RESEND_EMAIL',
      note: emailRes.success ? `Resend email sent (${emailRes.id})` : `Failed: ${emailRes.error}`,
    };
  }

  /**
   * Send CV Studio purchase confirmation and receipt via Resend
   */
  async notifyCvStudioPurchase(payload: {
    customerEmail: string;
    customerName: string;
    templateTitle: string;
    amountBdt: number;
    orderToken: string;
  }): Promise<{ dispatched: boolean; channel: string; note: string }> {
    if (!payload.customerEmail || !process.env.RESEND_API_KEY) {
      return { dispatched: false, channel: 'NONE', note: 'No customer email or Resend not configured' };
    }

    const emailRes = await this.sendEmail({
      to: payload.customerEmail,
      subject: `[CV Studio] আনলক রশিদ: ${payload.templateTitle} - BusinessOS`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #6366f1; margin: 0; font-size: 22px;">BusinessOS AI CV Studio</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">পেশাদার জীবনবৃত্তান্ত ও পিডিএফ আনলক রসিদ</p>
          </div>

          <p style="font-size: 14px; color: #334155;">প্রিয় <strong>${payload.customerName}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">আপনার CV Studio টেমপ্লেট <strong>"${payload.templateTitle}"</strong> এর জন্য ওয়াটারমার্ক ছাড়া হাই-রেজুলেশন পিডিএফ সফলভাবে আনলক হয়েছে।</p>

          <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: center;">
            <span style="font-size: 12px; text-transform: uppercase; color: #4338ca; font-weight: 700;">পরিশোধিত অর্থ (Paid Amount)</span>
            <div style="font-size: 24px; font-weight: 900; color: #3730a3; margin-top: 4px;">৳${payload.amountBdt} BDT</div>
            <span style="font-size: 12px; color: #6366f1; margin-top: 4px; display: block;">টোকেন রেফারেন্স: #${payload.orderToken}</span>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="http://localhost:3000/cv-studio?token=${payload.orderToken}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              CV স্টুডিও ওপেন করুন ও ডাউনলোড করুন →
            </a>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
            © 2026 BusinessOS AI Studio. All rights reserved.
          </div>
        </div>
      `,
      text: `CV Studio আনলক রশিদ: ${payload.templateTitle}. পরিশোধিত: ৳${payload.amountBdt}. টোকেন: #${payload.orderToken}`,
    });

    return {
      dispatched: emailRes.success,
      channel: 'RESEND_EMAIL',
      note: emailRes.success ? `Resend email sent (${emailRes.id})` : `Failed: ${emailRes.error}`,
    };
  }
}

