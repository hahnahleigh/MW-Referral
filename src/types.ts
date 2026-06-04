export interface Customer {
  id: string; // unique identifier
  shopifyCustomerId: string; // e.g. "gid://shopify/Customer/12345678"
  email: string;
  name: string;
  pointsBalance: number;
  createdAt: string;
  referredByCustomerId?: string; // ID of the customer who referred them
}

export type PointTransactionType = 'earn' | 'redeem';

export interface PointTransaction {
  id: string;
  customerId: string;
  points: number;
  type: PointTransactionType;
  cashAmount: number;
  createdAt: string;
  orderId?: string; // Optional trackable Shopify order id
  source?: 'purchase' | 'referral'; // Dynamic credit origin tracking
  referredEmail?: string; // Target email referred
}

export type RedemptionRequestStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type PayoutMethod = 'GCash' | 'Maya' | 'Bank' | 'QRPh';

export interface PayoutDetails {
  accountName: string;
  accountNumber: string; // Mobile number or bank account number
  bankName?: string; // Required if method is 'Bank'
}

export interface RedemptionRequest {
  id: string;
  customerId: string;
  pointsRedeemed: number;
  cashAmount: number;
  payoutMethod: PayoutMethod;
  payoutDetails: PayoutDetails;
  status: RedemptionRequestStatus;
  createdAt: string;
  processedAt?: string;
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string; // "system" | "admin" | "customer-id"
  ipAddress?: string;
  details: string;
}

export interface MockEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Approved' | 'Rejected';
  requestId: string;
}

export interface ShopifySettings {
  storeName: string;
  shopifyDomain: string;
  apiAccessToken: string;
  webhookSecret: string;
  pointsPerPesoSpent: number;
  minPointsToRedeem: number;
  pointsToPesoRate: number; // e.g. 1 point = X PHP
  allowGCash: boolean;
  allowMaya: boolean;
  allowBank: boolean;
  allowQRPh: boolean;
  widgetLauncherText: string;
  widgetThemeColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  showWelcomeBubble: boolean;
  isConnected?: boolean;
}

export interface DatabaseSchema {
  customers: Customer[];
  pointTransactions: PointTransaction[];
  redemptionRequests: RedemptionRequest[];
  auditLogs: AuditLog[];
  mockEmails: MockEmail[];
  settings?: ShopifySettings;
}
