import { Resend } from 'resend';
import {
  getWelcomeEmailHtml,
  getOtpEmailHtml,
  getPasswordChangedEmailHtml,
  getOrderConfirmationEmailHtml,
  getShippingUpdateEmailHtml,
  getNewDropEmailHtml,
  getTicketCreatedEmailHtml,
  getTicketUpdateEmailHtml,
  getTicketResolvedEmailHtml,
  OrderConfirmationParams,
  ShippingUpdateParams,
  NewDropEmailParams,
  TicketCreatedEmailParams,
  TicketUpdateEmailParams,
  TicketResolvedEmailParams,
} from './templates';
import { Ticket } from '../../types/ticket';

let cachedResend: Resend | null = null;

/**
 * Returns a singleton Resend client configured with RESEND_API_KEY.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  const cleanKey = apiKey.trim();
  if (
    cleanKey.startsWith('xxxx') ||
    cleanKey === 'your_resend_api_key' ||
    cleanKey === 're_placeholder'
  ) {
    // Unconfigured or placeholder key
    return null;
  }

  if (!cachedResend) {
    cachedResend = new Resend(cleanKey);
  }

  return cachedResend;
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
 * Central Resilient Email Dispatcher powered by Resend.
 * Guarantees that failures in email transport never block core business logic.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<MailerResult> {
  const recipient = Array.isArray(to) ? to : [to];
  const recipientStr = Array.isArray(to) ? to.join(', ') : to;

  // Default to verified sender or Resend sandbox address (onboarding@resend.dev)
  const from =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    'GOATED NATION <onboarding@resend.dev>';

  const resend = getResendClient();
  if (!resend) {
    console.warn(
      `[Mailer: Resend] RESEND_API_KEY not configured in environment. Simulated dispatch to [${recipientStr}] with subject: "${subject}"`
    );
    return {
      success: true,
      simulated: true,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject,
      html,
      text: text || subject,
    });

    if (error) {
      console.error(`[Mailer: Resend] Error dispatching email to [${recipientStr}]:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Mailer: Resend] Email dispatched successfully to [${recipientStr}]:`, data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Mailer: Resend] Unexpected error dispatching to [${recipientStr}]:`, errorMsg);
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

/**
 * Dispatches Support Ticket Logged Confirmation.
 */
export async function sendTicketCreatedEmail(ticket: Ticket): Promise<MailerResult> {
  const html = getTicketCreatedEmailHtml({ ticket });
  return sendEmail({
    to: ticket.customerEmail,
    subject: `TICKET ${ticket.ticketNumber} LOGGED // GOATED NATION SUPPORT`,
    html,
  });
}

/**
 * Dispatches Support Ticket Progress / Admin Message Update.
 */
export async function sendTicketUpdateEmail(
  params: TicketUpdateEmailParams
): Promise<MailerResult> {
  const html = getTicketUpdateEmailHtml(params);
  return sendEmail({
    to: params.ticket.customerEmail,
    subject: `UPDATE: Ticket ${params.ticket.ticketNumber} // GOATED NATION SUPPORT`,
    html,
  });
}

/**
 * Dispatches Support Ticket Resolution & CSAT Feedback Notice.
 */
export async function sendTicketResolvedEmail(
  params: TicketResolvedEmailParams
): Promise<MailerResult> {
  const html = getTicketResolvedEmailHtml(params);
  return sendEmail({
    to: params.ticket.customerEmail,
    subject: `RESOLVED: Ticket ${params.ticket.ticketNumber} // GOATED NATION SUPPORT`,
    html,
  });
}
