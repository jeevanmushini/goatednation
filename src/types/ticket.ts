export type TicketCategory =
  | 'SIZE_EXCHANGE'
  | 'ORDER_STATUS'
  | 'DEFECT_DAMAGE'
  | 'PAYMENT_ISSUE'
  | 'WEBSITE_BUG'
  | 'BULK_GENERAL';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export interface TicketExchangeDetails {
  currentSize?: string;
  desiredSize?: string;
  unwornTagsVerified?: boolean;
  selectedItemTitle?: string;
  selectedItemSku?: string;
}

export interface TicketPaymentDetails {
  utrNumber?: string;
  paymentId?: string;
  amount?: number;
  paymentMethod?: string;
}

export interface TicketTelemetry {
  userAgent?: string;
  os?: string;
  browser?: string;
  screenSize?: string;
  path?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  initialMessage: string;
  attachments: string[];
  telemetry: TicketTelemetry;
  exchangeDetails: TicketExchangeDetails;
  paymentDetails: TicketPaymentDetails;
  shiprocketAwb?: string;
  resolutionNotes?: string;
  customerRating?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  senderName: string;
  senderEmail?: string;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface TicketMetrics {
  totalOpen: number;
  urgentSla: number;
  inProgress: number;
  resolvedToday: number;
  averageCsat: number;
}
