import nodemailer, { Transporter } from 'nodemailer';
import {
  getWelcomeEmailHtml,
  getOtpEmailHtml,
  getPasswordChangedEmailHtml,
  getOrderConfirmationEmailHtml,
  getShippingUpdateEmailHtml,
  getNewDropEmailHtml,
  OrderConfirmationParams,
  ShippingUpdateParams,
  NewDropEmailParams,
} from './templates';

let cachedTransporter: Transporter | null = null;

/**
 * Returns a singleton Nodemailer transporter configured for Gmail SMTP.
 */
export function getEmailTransporter(): Transporter | null {
  const user = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !rawPass) {
    return null;
  }

  const pass = rawPass.trim().replace(/\s+/g, '');
  if (pass.startsWith('xxxx') || pass === 'your_app_password') {
    // Unconfigured or placeholder App Password
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass,
      },
    });
  }

  return cachedTransporter;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface MailerResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Central Resilient Email Dispatcher.
 * Guarantees that failures in SMTP transport never block core business logic.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<MailerResult> {
  const recipient = Array.isArray(to) ? to.join(', ') : to;
  const from = process.env.EMAIL_FROM || `GOATED NATION <${process.env.EMAIL_USER || 'goatednation@gmail.com'}>`;

  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn(
      `[Mailer] SMTP not fully configured in environment (EMAIL_USER / EMAIL_APP_PASSWORD). Simulated send to [${recipient}] with subject: "${subject}"`
    );
    return {
      success: true,
      simulated: true,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html,
      text: text || subject,
    });

    console.log(`[Mailer] Email dispatched successfully to [${recipient}]:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Mailer] Error dispatching email to [${recipient}]:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Dispatches Welcome + 10% Discount Coupon Email on customer registration.
 */
export async function sendWelcomeEmail(to: string, name?: string): Promise<MailerResult> {
  const html = getWelcomeEmailHtml({ name, discountCode: 'WELCOME10' });
  return sendEmail({
    to,
    subject: 'WELCOME TO THE SYNDICATE // GOATED NATION (10% OFF VOUCHER INSIDE)',
    html,
  });
}

/**
 * Dispatches 6-digit Cryptographic Security Code for Password Reset.
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  name?: string,
  ttlMinutes = 10
): Promise<MailerResult> {
  const html = getOtpEmailHtml({ name, otp, ttlMinutes });
  return sendEmail({
    to,
    subject: `SECURITY CODE: ${otp} // GOATED NATION PASSWORD RESET`,
    html,
  });
}

/**
 * Dispatches Security Alert after Password Reset.
 */
export async function sendPasswordChangedEmail(
  to: string,
  name?: string,
  timestamp?: string,
  device?: string
): Promise<MailerResult> {
  const html = getPasswordChangedEmailHtml({ name, timestamp, device });
  return sendEmail({
    to,
    subject: 'SECURITY ALERT: Password Updated // GOATED NATION',
    html,
  });
}

/**
 * Dispatches Visual Itemized Order Confirmation & Payment Receipt.
 */
export async function sendOrderConfirmationEmail(
  params: OrderConfirmationParams & { to: string }
): Promise<MailerResult> {
  const html = getOrderConfirmationEmailHtml(params);
  return sendEmail({
    to: params.to,
    subject: `ORDER CONFIRMED: #${params.orderId} // GOATED NATION`,
    html,
  });
}

/**
 * Dispatches Logistics Tracking Update on Shiprocket Events.
 */
export async function sendShippingUpdateEmail(
  params: ShippingUpdateParams & { to: string }
): Promise<MailerResult> {
  const html = getShippingUpdateEmailHtml(params);
  const statusLabel = params.status.toUpperCase().replace(/_/g, ' ');
  return sendEmail({
    to: params.to,
    subject: `SHIPMENT UPDATE: #${params.orderId} [${statusLabel}] // GOATED NATION`,
    html,
  });
}

/**
 * Dispatches New Collection Capsule Drop Announcement.
 */
export async function sendNewDropEmail(
  params: NewDropEmailParams & { to: string | string[] }
): Promise<MailerResult> {
  const html = getNewDropEmailHtml(params);
  return sendEmail({
    to: params.to,
    subject: `NEW DROP: ${params.dropTitle} // GOATED NATION`,
    html,
  });
}
