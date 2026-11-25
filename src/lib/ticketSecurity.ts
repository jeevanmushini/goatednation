import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'goatednation_secure_ticket_key_fallback';

/**
 * Generates an unguessable 24-character cryptographic access token for a ticket.
 */
export function generateTicketAccessToken(ticketId: string, email: string): string {
  const data = `${ticketId.toLowerCase().trim()}:${email.toLowerCase().trim()}`;
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex').substring(0, 24);
}

/**
 * Validates whether the provided token matches the ticket's signature.
 */
export function verifyTicketAccessToken(
  ticketId: string,
  email: string,
  providedToken?: string | null
): boolean {
  if (!providedToken) return false;
  const expected = generateTicketAccessToken(ticketId, email);
  if (expected.length !== providedToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(providedToken));
}
