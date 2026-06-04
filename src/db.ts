import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Customer, PointTransaction, RedemptionRequest, AuditLog, PayoutMethod, PayoutDetails, ShopifySettings } from './types.js';

const DEFAULT_SETTINGS: ShopifySettings = {
  storeName: 'Artisan Bakery Manila',
  shopifyDomain: 'potopotostudio.myshopify.com',
  apiAccessToken: 'shpat_9182736450abcde123456789f',
  webhookSecret: 'whsec_9876543210abcdef0123456789',
  pointsPerPesoSpent: 1,
  minPointsToRedeem: 100,
  pointsToPesoRate: 1,
  allowGCash: true,
  allowMaya: true,
  allowBank: true,
  allowQRPh: true,
  widgetLauncherText: '🇵🇭 Rewards & Cashouts',
  widgetThemeColor: '#4f46e5',
  widgetPosition: 'bottom-right',
  showWelcomeBubble: true,
  isConnected: false
};

const DB_FILE = path.join(process.cwd(), 'data-store.json');

// Helper to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-1',
    shopifyCustomerId: 'gid://shopify/Customer/91827364501',
    email: 'juan.delacruz@gmail.com',
    name: 'Juan dela Cruz',
    pointsBalance: 1250,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 'CUST-2',
    shopifyCustomerId: 'gid://shopify/Customer/91827364502',
    email: 'maria.santos@yahoo.com',
    name: 'Maria Santos',
    pointsBalance: 80, // Less than minimum 100
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
  },
  {
    id: 'CUST-3',
    shopifyCustomerId: 'gid://shopify/Customer/91827364503',
    email: 'jose.rizal@philippines.net',
    name: 'Dr. Jose Rizal',
    pointsBalance: 3450,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'TXN-101',
    customerId: 'CUST-1',
    points: 1500,
    type: 'earn',
    cashAmount: 1500,
    orderId: 'gid://shopify/Order/7766551',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TXN-102',
    customerId: 'CUST-1',
    points: -250,
    type: 'redeem',
    cashAmount: 250,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TXN-201',
    customerId: 'CUST-2',
    points: 80,
    type: 'earn',
    cashAmount: 80,
    orderId: 'gid://shopify/Order/7766552',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'TXN-301',
    customerId: 'CUST-3',
    points: 3450,
    type: 'earn',
    cashAmount: 3450,
    orderId: 'gid://shopify/Order/7766553',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_REDEMPTIONS: RedemptionRequest[] = [
  {
    id: 'REDEEM-001',
    customerId: 'CUST-1',
    pointsRedeemed: 250,
    cashAmount: 250,
    payoutMethod: 'GCash',
    payoutDetails: {
      accountName: 'Juan dela Cruz',
      accountNumber: '09171234567'
    },
    status: 'paid',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    remarks: 'GCash Reference No: 887165525'
  }
];

const DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'SYSTEM_INIT',
    actor: 'system',
    details: 'Database initialized with Philippine target configurations.'
  }
];

// Read from JSON file
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        customers: DEFAULT_CUSTOMERS,
        pointTransactions: DEFAULT_TRANSACTIONS,
        redemptionRequests: DEFAULT_REDEMPTIONS,
        auditLogs: DEFAULT_LOGS,
        mockEmails: [],
        settings: DEFAULT_SETTINGS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.mockEmails) {
      parsed.mockEmails = [];
    }
    if (!parsed.settings) {
      parsed.settings = DEFAULT_SETTINGS;
    }
    return parsed;
  } catch (error) {
    console.error('Error reading database file, returning default schema:', error);
    return {
      customers: DEFAULT_CUSTOMERS,
      pointTransactions: DEFAULT_TRANSACTIONS,
      redemptionRequests: DEFAULT_REDEMPTIONS,
      auditLogs: DEFAULT_LOGS,
      mockEmails: [],
      settings: DEFAULT_SETTINGS
    };
  }
}

// Write to JSON file
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// Low-level write lock emulator via in-memory mutator wrapper
export function mutateDb(callback: (db: DatabaseSchema) => void): DatabaseSchema {
  const db = readDb();
  callback(db);
  writeDb(db);
  return db;
}

// DATABASE LAYER OPERATIONS (PRISMA-EQUIVALENT REPO PATTERN)

export const dbRepo = {
  // Reset database state (useful for user resetting in workspace UI)
  reset(): void {
    const initialDb: DatabaseSchema = {
      customers: DEFAULT_CUSTOMERS,
      pointTransactions: DEFAULT_TRANSACTIONS,
      redemptionRequests: DEFAULT_REDEMPTIONS,
      auditLogs: [
        {
          id: 'LOG-' + generateId(),
          timestamp: new Date().toISOString(),
          action: 'DATABASE_RESET',
          actor: 'admin',
          details: 'Merchant reset database mock to seed state.'
        }
      ],
      mockEmails: [],
      settings: DEFAULT_SETTINGS
    };
    writeDb(initialDb);
  },

  // Audit Logger
  log(action: string, actor: string, details: string): void {
    mutateDb((db) => {
      const newLog: AuditLog = {
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action,
        actor,
        details
      };
      db.auditLogs.unshift(newLog); // Put recent edits first
    });
  },

  getAuditLogs(): AuditLog[] {
    return readDb().auditLogs;
  },

  // Customer repo
  getCustomers(): Customer[] {
    return readDb().customers;
  },

  getCustomerById(id: string): Customer | undefined {
    return readDb().customers.find(c => c.id === id);
  },

  getCustomerByShopifyId(shopifyId: string): Customer | undefined {
    return readDb().customers.find(c => c.shopifyCustomerId === shopifyId);
  },

  getCustomerByEmail(email: string): Customer | undefined {
    return readDb().customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  },

  createCustomer(shopifyCustomerId: string, email: string, name: string, initialPoints = 0, referredByCustomerId?: string): Customer {
    let createdCustomerObj!: Customer;
    mutateDb((db) => {
      // Avoid duplicates
      const exists = db.customers.find(c => c.shopifyCustomerId === shopifyCustomerId);
      if (exists) {
        createdCustomerObj = exists;
        return;
      }
      
      const newCustomer: Customer = {
        id: 'CUST-' + generateId(),
        shopifyCustomerId,
        email,
        name,
        pointsBalance: initialPoints,
        createdAt: new Date().toISOString(),
        referredByCustomerId
      };
      db.customers.push(newCustomer);
      createdCustomerObj = newCustomer;

      // Add audit log
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: 'CUSTOMER_CREATED',
        actor: 'shopify_webhook',
        details: `Customer ${name} with email ${email} created via Shopify hook/seed.${referredByCustomerId ? ` Referred by Customer ID: ${referredByCustomerId}.` : ''}`
      });
    });
    return createdCustomerObj;
  },

  // Earn or Redeem Points with proper ledger checks and Audit Logs + Transaction Ledger records
  addPointsTransaction(
    customerId: string,
    points: number, // positive for earn, negative for redeem
    type: 'earn' | 'redeem',
    orderId?: string,
    source?: 'purchase' | 'referral',
    referredEmail?: string
  ): { success: boolean; newBalance: number; error?: string } {
    let result = { success: false, newBalance: 0, error: '' };

    mutateDb((db) => {
      const customer = db.customers.find(c => c.id === customerId);
      if (!customer) {
        result = { success: false, newBalance: 0, error: 'Customer not found' };
        return;
      }

      // If redeeming, make sure they have enough points (double redemption defense)
      if (type === 'redeem' && customer.pointsBalance + points < 0) {
        result = { success: false, newBalance: customer.pointsBalance, error: 'Insufficient balance' };
        return;
      }

      // Update balance
      const originalBalance = customer.pointsBalance;
      customer.pointsBalance += points;

      // Create transaction ledger record
      const txn: PointTransaction = {
        id: 'TXN-' + generateId(),
        customerId,
        points,
        type,
        cashAmount: Math.abs(points), // 1 point = 1 PHP
        createdAt: new Date().toISOString(),
        orderId,
        source: source || (type === 'earn' ? 'purchase' : undefined),
        referredEmail
      };
      db.pointTransactions.unshift(txn);

      // Customize audit log message based on source
      let logAction = type === 'earn' ? 'POINTS_AWARDED' : 'POINTS_DEDUCTED';
      let logSender = type === 'earn' ? 'shopify_webhook' : `customer:${customerId}`;
      let logDetails = `Customer ID ${customerId} points balance updated from ₱${originalBalance} to ₱${customer.pointsBalance}. Difference: ₱${points} PHP (Order: ${orderId || 'N/A'})`;

      if (source === 'referral') {
        logAction = 'REFERRAL_POINTS_AWARDED';
        logSender = 'referral_system';
        logDetails = `Referral bonus of ${points} pts awarded to ${customer.name} (ID: ${customerId}) for referring ${referredEmail || 'anonymous'}. Balance updated from ${originalBalance} to ${customer.pointsBalance} pts.`;
      } else if (source === 'purchase') {
        logAction = 'PURCHASE_POINTS_AWARDED';
        logDetails = `Purchase loyalty credit of ${points} pts awarded to ${customer.name} for Order #${orderId || 'N/A'}. Balance updated from ${originalBalance} to ${customer.pointsBalance} pts.`;
      }

      // Audit Log
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: logAction,
        actor: logSender,
        details: logDetails
      });

      result = { success: true, newBalance: customer.pointsBalance, error: undefined };
    });

    return result;
  },

  // Refund points reversal
  reversePointsTransaction(orderId: string): { success: boolean; reversedPoints: number; error?: string } {
    let result = { success: false, reversedPoints: 0, error: '' };

    mutateDb((db) => {
      // Find the earning transaction for this order
      const earningTxnIndex = db.pointTransactions.findIndex(t => t.orderId === orderId && t.type === 'earn');
      if (earningTxnIndex === -1) {
        result = { success: false, reversedPoints: 0, error: `No original point transaction found for order: ${orderId}` };
        return;
      }

      const originalTxn = db.pointTransactions[earningTxnIndex];
      const customer = db.customers.find(c => c.id === originalTxn.customerId);
      if (!customer) {
        result = { success: false, reversedPoints: 0, error: 'Customer corresponding to transaction not found' };
        return;
      }

      // Check if refund was already handled
      const refundExists = db.pointTransactions.some(t => t.orderId === orderId && t.type === 'redeem' && t.points === -originalTxn.points);
      if (refundExists) {
        result = { success: false, reversedPoints: 0, error: `Refund already reversed/computed for order: ${orderId}` };
        return;
      }

      // Reverse points (deduct what was earned)
      const reversedPoints = originalTxn.points;
      const originalBalance = customer.pointsBalance;
      customer.pointsBalance = Math.max(0, customer.pointsBalance - reversedPoints); // Cap points balance at 0

      // Add reverse transaction
      const reverseTxn: PointTransaction = {
        id: 'TXN-' + generateId(),
        customerId: customer.id,
        points: -reversedPoints,
        type: 'redeem',
        cashAmount: reversedPoints,
        createdAt: new Date().toISOString(),
        orderId: `refund-${orderId}`
      };
      db.pointTransactions.unshift(reverseTxn);

      // Audit Log
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: 'POINTS_REFUNDED_REVERSAL',
        actor: 'shopify_webhook',
        details: `Shopify order ${orderId} refunded. Reversing ₱${reversedPoints} points from Customer ${customer.name}. Balance changed from ₱${originalBalance} to ₱${customer.pointsBalance}.`
      });

      result = { success: true, reversedPoints, error: undefined };
    });

    return result;
  },

  // Get Point Ledger
  getTransactions(customerId?: string): PointTransaction[] {
    const list = readDb().pointTransactions;
    if (customerId) {
      return list.filter(t => t.customerId === customerId);
    }
    return list;
  },

  // Redemption request processing
  getRedemptionRequests(customerId?: string): RedemptionRequest[] {
    const list = readDb().redemptionRequests;
    if (customerId) {
      return list.filter(t => t.customerId === customerId);
    }
    return list;
  },

  createRedemptionRequest(
    customerId: string,
    pointsToRedeem: number,
    payoutMethod: PayoutMethod,
    payoutDetails: PayoutDetails
  ): { success: boolean; request?: RedemptionRequest; error?: string } {
    if (pointsToRedeem < 100) {
      return { success: false, error: 'Minimum redemption limit is 100 points.' };
    }

    let result: { success: boolean; request?: RedemptionRequest; error?: string } = { success: false };

    mutateDb((db) => {
      const customer = db.customers.find(c => c.id === customerId);
      if (!customer) {
        result = { success: false, error: 'Customer not found.' };
        return;
      }

      // Safety check: point sufficiency
      if (customer.pointsBalance < pointsToRedeem) {
        result = { success: false, error: `Insufficient points balance. You have ${customer.pointsBalance} points, requested ${pointsToRedeem}.` };
        return;
      }

      // Check if duplicate pending requests exist for the same amount/details in the last 15 seconds to prevent spamming
      const now = Date.now();
      const duplicate = db.redemptionRequests.some(r => 
        r.customerId === customerId && 
        r.status === 'pending' && 
        r.pointsRedeemed === pointsToRedeem &&
        r.payoutMethod === payoutMethod &&
        (now - new Date(r.createdAt).getTime()) < 15000
      );

      if (duplicate) {
        result = { success: false, error: 'Duplicate redemption request detected. Please wait dynamic checkout timer.' };
        return;
      }

      // Immediately deduct customer balance
      customer.pointsBalance -= pointsToRedeem;

      // Write redemptions structure
      const newRequest: RedemptionRequest = {
        id: 'REDEEM-' + generateId(),
        customerId,
        pointsRedeemed: pointsToRedeem,
        cashAmount: pointsToRedeem, // 1 point = ₱1 PHP
        payoutMethod,
        payoutDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      db.redemptionRequests.unshift(newRequest);

      // Create negative points txn ledger entry to clear it from available balance
      const txnRecord: PointTransaction = {
        id: 'TXN-' + generateId(),
        customerId,
        points: -pointsToRedeem,
        type: 'redeem',
        cashAmount: pointsToRedeem,
        createdAt: new Date().toISOString()
      };
      db.pointTransactions.unshift(txnRecord);

      // Audit Log
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: 'REDEMPTION_REQUESTED',
        actor: `customer:${customerId}`,
        details: `Customer requested ₱${pointsToRedeem} PHP payout via ${payoutMethod} (${payoutDetails.accountNumber}). Balance debited from points pool.`
      });

      result = { success: true, request: newRequest };
    });

    return result;
  },

  // Update redemption status: approve, reject, mark paid
  updateRedemptionStatus(
    requestId: string,
    status: 'approved' | 'rejected' | 'paid',
    remarks?: string
  ): { success: boolean; request?: RedemptionRequest; error?: string } {
    let result: { success: boolean; request?: RedemptionRequest; error?: string } = { success: false };

    mutateDb((db) => {
      const req = db.redemptionRequests.find(r => r.id === requestId);
      if (!req) {
        result = { success: false, error: 'Redemption request not found.' };
        return;
      }

      const customer = db.customers.find(c => c.id === req.customerId);
      if (!customer) {
        result = { success: false, error: `Customer corresponding to request (${req.customerId}) not found.` };
        return;
      }

      const prevStatus = req.status;

      // Handle transitions
      if (status === 'rejected') {
        // If transitioning from state where points were already deducted (like pending/approved):
        // Rejection returns the points back into safety pool!
        if (prevStatus === 'pending' || prevStatus === 'approved') {
          customer.pointsBalance += req.pointsRedeemed;

          // Add reversal debit/credit record
          const refundTxn: PointTransaction = {
            id: 'TXN-' + generateId(),
            customerId: customer.id,
            points: req.pointsRedeemed,
            type: 'earn',
            cashAmount: req.pointsRedeemed,
            createdAt: new Date().toISOString()
          };
          db.pointTransactions.unshift(refundTxn);

          // Audit log points return
          db.auditLogs.unshift({
            id: 'LOG-' + generateId(),
            timestamp: new Date().toISOString(),
            action: 'REDEMPTION_REVERSED_POINTS_RETURNED',
            actor: 'admin',
            details: `Points of request ${requestId} refunded back to Customer ${customer.name} (Qty: ${req.pointsRedeemed} pts) due to REJECTION.`
          });
        }
      }

      // Update state
      req.status = status;
      req.processedAt = new Date().toISOString();
      if (remarks) req.remarks = remarks;

      // Send Mock Email on status change
      if (status === 'approved' || status === 'rejected') {
        const subject = status === 'approved'
          ? `🎉 PHP Redemption Approved! Request #${req.id}`
          : `⚠️ Point Redemption Request Rejected - Request #${req.id}`;

        let body = '';
        if (status === 'approved') {
          body = `Dear ${customer.name},

Good news! Your point redemption request #${req.id} for ₱${req.pointsRedeemed.toFixed(2)} PHP has been approved by our administrators.

Details:
- Amount: ₱${req.pointsRedeemed.toFixed(2)} PHP (${req.pointsRedeemed} loyalty points)
- Payout Channel: ${req.payoutMethod}
- Account Holder: ${req.payoutDetails.accountName}
- Account/Reference: ${req.payoutDetails.accountNumber}
${req.payoutDetails.bankName ? `- Bank Name: ${req.payoutDetails.bankName}\n` : ''}- Status: Approved and pending transmission.

${remarks ? `Remarks/Reference: ${remarks}\n\n` : ''}Your funds are being prepared for payout via our GCash/Maya automatic payout dispatcher. You will receive the credit shortly!

Thank you for being a valued store member!
- Shopify loyalty cash reward program`;
        } else {
          body = `Dear ${customer.name},

Your point redemption request #${req.id} for ${req.pointsRedeemed} loyalty points (₱${req.pointsRedeemed.toFixed(2)} PHP value) was not approved.

Reason / Remarks:
${remarks || 'We could not confirm your payout details. Please double check your account information and try again.'}

Good News: Your ${req.pointsRedeemed} points have been refunded and returned to your points account. You can request a new redemption at any time with updated payout details.

Best regards,
- Shopify loyalty cash reward program`;
        }

        const newEmail = {
          id: 'EML-' + generateId(),
          recipientEmail: customer.email,
          recipientName: customer.name,
          subject,
          body,
          sentAt: new Date().toISOString(),
          status: status === 'approved' ? 'Approved' as const : 'Rejected' as const,
          requestId: req.id
        };

        if (!db.mockEmails) {
          db.mockEmails = [];
        }
        db.mockEmails.unshift(newEmail);
      }

      // Audit Log for status change
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: `REDEMPTION_${status.toUpperCase()}`,
        actor: 'admin',
        details: `Redemption Request ${requestId} by ${customer.name} was marked as ${status.toUpperCase()}. Remarks: ${remarks || 'None'}`
      });

      result = { success: true, request: req };
    });

    return result;
  },

  getMockEmails(customerId?: string) {
    const db = readDb();
    const emails = db.mockEmails || [];
    if (customerId) {
      const customer = db.customers.find(c => c.id === customerId);
      if (!customer) return [];
      return emails.filter(e => e.recipientEmail.toLowerCase() === customer.email.toLowerCase());
    }
    return emails;
  },

  getReferrals(customerId?: string) {
    const db = readDb();
    const mappedReferrals: any[] = [];
    const matchedTxnIds = new Set<string>();

    // Phase 1: Scan all Customers that have referredByCustomerId set
    db.customers.forEach(friend => {
      if (friend.referredByCustomerId) {
        const referrer = db.customers.find(c => c.id === friend.referredByCustomerId);
        // Find matching referral reward points transaction
        const rt = db.pointTransactions.find(t => 
          t.customerId === friend.referredByCustomerId &&
          t.type === 'earn' &&
          t.source === 'referral' &&
          t.referredEmail?.toLowerCase() === friend.email.toLowerCase()
        );

        let status: 'registered' | 'active' = 'registered';
        let pointsEarned = 0;
        let dateRewarded = friend.createdAt;
        let id = `ref-pending-${friend.id}`;

        if (rt) {
          status = 'active';
          pointsEarned = rt.points;
          dateRewarded = rt.createdAt;
          id = rt.id;
          matchedTxnIds.add(rt.id);
        }

        mappedReferrals.push({
          id,
          referrerId: friend.referredByCustomerId,
          referrerName: referrer ? referrer.name : 'Unknown Referrer',
          referrerEmail: referrer ? referrer.email : '',
          referrerPointsBalance: referrer ? referrer.pointsBalance : 0,
          friendId: friend.id,
          email: friend.email,
          name: friend.name,
          status,
          joinedAt: friend.createdAt,
          pointsEarned,
          dateRewarded,
          friendPointsBalance: friend.pointsBalance
        });
      }
    });

    // Phase 2: Add any remaining direct 'referral' points transactions
    const refTxns = db.pointTransactions.filter(t => t.type === 'earn' && t.source === 'referral');
    refTxns.forEach(t => {
      if (!matchedTxnIds.has(t.id)) {
        const friendEmail = t.referredEmail || '';
        const friendCust = db.customers.find(c => c.email.toLowerCase() === friendEmail.toLowerCase());
        const referrer = db.customers.find(c => c.id === t.customerId);

        let status: 'registered' | 'active' = 'active';
        let joinedAt = t.createdAt;
        let friendId = friendCust?.id;
        let name = friendCust?.name;

        mappedReferrals.push({
          id: t.id,
          referrerId: t.customerId,
          referrerName: referrer ? referrer.name : 'Unknown Referrer',
          referrerEmail: referrer ? referrer.email : '',
          referrerPointsBalance: referrer ? referrer.pointsBalance : 0,
          friendId,
          email: friendEmail,
          name,
          status,
          joinedAt,
          pointsEarned: t.points,
          dateRewarded: t.createdAt,
          friendPointsBalance: friendCust ? friendCust.pointsBalance : 0
        });
      }
    });

    if (customerId) {
      return mappedReferrals.filter(r => r.referrerId === customerId);
    }
    return mappedReferrals;
  },

  getSettings(): ShopifySettings {
    const db = readDb();
    return db.settings || DEFAULT_SETTINGS;
  },

  updateSettings(newSettings: Partial<ShopifySettings>): ShopifySettings {
    let result!: ShopifySettings;
    mutateDb((db) => {
      const current = db.settings || DEFAULT_SETTINGS;
      db.settings = { ...current, ...newSettings };
      result = db.settings;
      
      // Add audit log
      db.auditLogs.unshift({
        id: 'LOG-' + generateId(),
        timestamp: new Date().toISOString(),
        action: 'SETTINGS_UPDATED',
        actor: 'admin',
        details: `Shopify settings updated. Store: "${db.settings.storeName}", Target Domain: "${db.settings.shopifyDomain}", Min points redeemable: ${db.settings.minPointsToRedeem}, Points rate: 1 pt = ₱${db.settings.pointsToPesoRate} PHP.`
      });
    });
    return result;
  }
};
