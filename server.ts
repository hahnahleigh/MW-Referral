import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbRepo } from './src/db.js';
import { PayoutMethod, PayoutDetails } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Log incoming API calls or webhooks for simulation visualizers
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[HTTP API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ==========================================
  // CUSTOMER / CORE UTILITY ENDPOINTS
  // ==========================================

  // Get active customers list (to allow easy toggling between users in our front-end simulator)
  app.get('/api/customers', (req, res) => {
    try {
      const customers = dbRepo.getCustomers();
      res.json({ success: true, customers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register brand new customer
  app.post('/api/customers/create', (req, res) => {
    const { name, email, shopifyId, initialPoints, referredByCustomerId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    try {
      const mockShopifyId = shopifyId || `gid://shopify/Customer/${Date.now()}`;
      const points = initialPoints !== undefined ? Number(initialPoints) : 100;
      const customer = dbRepo.createCustomer(mockShopifyId, email, name, points, referredByCustomerId);
      
      // Only establish the link, wait for purchase to award referral points
      if (referredByCustomerId) {
        const referrer = dbRepo.getCustomerById(referredByCustomerId);
        if (referrer) {
          dbRepo.log(
            'REFERRAL_REGISTERED',
            'shopify_webhook',
            `Referred friend ${name} (${email}) has registered. Referrer ${referrer.name}'s ₱500 bonus is pending recommended product purchase.`
          );
        }
      }

      res.json({ success: true, customer });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/referrals/simulate - Trigger point rewards from referral connections
  app.post('/api/referrals/simulate', (req, res) => {
    const { referrerId, referredEmail, points } = req.body;
    if (!referrerId || !referredEmail) {
      return res.status(400).json({ success: false, error: 'Both referrerId and referredEmail are required.' });
    }

    try {
      const referrer = dbRepo.getCustomerById(referrerId);
      if (!referrer) {
        return res.status(404).json({ success: false, error: `Referrer customer profile with ID ${referrerId} was not found.` });
      }

      // Check if the referred buyer already exists as a customer. If not, auto-create their account.
      let friendAccount = dbRepo.getCustomers().find(c => c.email.toLowerCase() === referredEmail.toLowerCase());
      let autoCreatedMsg = '';
      if (!friendAccount) {
        const friendPrefix = referredEmail.split('@')[0];
        const rawName = friendPrefix.replace(/[^a-zA-Z0-9]/g, ' ');
        const friendName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Simulated Buyer';
        
        // Auto-create account with a starter balance of 100 points
        friendAccount = dbRepo.createCustomer(
          `gid://shopify/Customer/ref-${Date.now()}`,
          referredEmail,
          `${friendName} (Buyer)`,
          100, // starter balance
          referrerId
        );
        autoCreatedMsg = ` (A buyer account with 100 starter points was automatically established for ${referredEmail})`;
      } else if (!friendAccount.referredByCustomerId) {
        // Associate their existing account as being referred by this referrer
        friendAccount.referredByCustomerId = referrerId;
      }

      // Referral points default to 500 PHP / points if not specified
      const pointsToAward = points ? Number(points) : 500;
      const result = dbRepo.addPointsTransaction(referrerId, pointsToAward, 'earn', undefined, 'referral', referredEmail);

      res.json({
        success: true,
        message: `Successfully processed referral bonus reward for inviting ${referredEmail}!${autoCreatedMsg}`,
        awardedPoints: pointsToAward,
        newBalance: result.newBalance
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // REWARDS API (COMPLIANT WITH SPECIFICATION)
  // ==========================================

  // GET /api/rewards/balance
  app.get('/api/rewards/balance', (req, res) => {
    const customerId = req.query.customerId as string;
    if (!customerId) {
      return res.status(400).json({ success: false, error: 'shopifyCustomerId or custom customerId in request query is required.' });
    }

    try {
      const customer = dbRepo.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, error: `Customer with ID ${customerId} not found.` });
      }

      // Conversion rules: 1 point = ₱1 PHP cash value
      const cashEquivalent = customer.pointsBalance; // points * 1

      res.json({
        success: true,
        customerId: customer.id,
        name: customer.name,
        pointsBalance: customer.pointsBalance,
        cashEquivalent,
        currency: 'PHP'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/rewards/history
  app.get('/api/rewards/history', (req, res) => {
    const customerId = req.query.customerId as string;
    if (!customerId) {
      return res.status(400).json({ success: false, error: 'customerId in request query is required.' });
    }

    try {
      const transactions = dbRepo.getTransactions(customerId);
      const redemptions = dbRepo.getRedemptionRequests(customerId);
      res.json({
        success: true,
        customerId,
        pointsTransactions: transactions,
        redemptionRequests: redemptions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/rewards/redeem
  app.post('/api/rewards/redeem', (req, res) => {
    const { customerId, points, payoutMethod, payoutDetails } = req.body;

    if (!customerId || !points || !payoutMethod || !payoutDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: customerId, points, payoutMethod, payoutDetails.'
      });
    }

    const pointsToRedeem = Number(points);
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      return res.status(400).json({ success: false, error: 'Points quantum to redeem must be a valid positive integer.' });
    }

    // Input validations
    if (pointsToRedeem < 100) {
      return res.status(400).json({ success: false, error: 'Minimum redemption limit is 100 points.' });
    }

    const validMethods: PayoutMethod[] = ['GCash', 'Maya', 'Bank'];
    if (!validMethods.includes(payoutMethod)) {
      return res.status(400).json({ success: false, error: `Invalid payout method. Choose from: ${validMethods.join(', ')}` });
    }

    const details = payoutDetails as PayoutDetails;
    if (!details.accountName || !details.accountNumber) {
      return res.status(400).json({ success: false, error: 'payoutDetails must include accountName and accountNumber.' });
    }

    if (payoutMethod === 'Bank' && !details.bankName) {
      return res.status(400).json({ success: false, error: 'bankName is required when selected payoutMethod is Bank.' });
    }

    try {
      // Execute the redemption request transactional creation
      const result = dbRepo.createRedemptionRequest(customerId, pointsToRedeem, payoutMethod, details);
      if (result.success) {
        return res.json({
          success: true,
          message: 'Redemption request recorded successfully.',
          request: result.request
        });
      } else {
        return res.status(400).json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ADMIN DASHBOARD API
  // ==========================================

  // GET /api/admin/redemptions
  app.get('/api/admin/redemptions', (req, res) => {
    try {
      const redemptions = dbRepo.getRedemptionRequests();
      const customers = dbRepo.getCustomers();
      
      // Enhance requests with customer details
      const enrichedRedemptions = redemptions.map(r => {
        const customer = customers.find(c => c.id === r.customerId);
        return {
          ...r,
          customerName: customer ? customer.name : 'Unknown Customer',
          customerEmail: customer ? customer.email : 'N/A'
        };
      });

      res.json({ success: true, redemptions: enrichedRedemptions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/redemptions/approve
  app.post('/api/admin/redemptions/approve', (req, res) => {
    const { requestId, remarks } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is a required field.' });
    }

    try {
      const result = dbRepo.updateRedemptionStatus(requestId, 'approved', remarks || 'Approved by system Admin');
      if (result.success) {
        res.json({ success: true, message: 'Request approved.', request: result.request });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/redemptions/reject
  app.post('/api/admin/redemptions/reject', (req, res) => {
    const { requestId, remarks } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is a required field.' });
    }

    try {
      const result = dbRepo.updateRedemptionStatus(requestId, 'rejected', remarks || 'Rejected by Admin. Points refunded.');
      if (result.success) {
        res.json({ success: true, message: 'Request rejected and points safely refunded to customer ledger balance.', request: result.request });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/redemptions/mark-paid
  app.post('/api/admin/redemptions/mark-paid', (req, res) => {
    const { requestId, remarks } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId is a required field.' });
    }

    try {
      const result = dbRepo.updateRedemptionStatus(requestId, 'paid', remarks || 'Paid and verified.');
      if (result.success) {
        res.json({ success: true, message: 'Request marked as successfully paid out.', request: result.request });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/admin/audit-logs
  app.get('/api/admin/audit-logs', (req, res) => {
    try {
      const logs = dbRepo.getAuditLogs();
      res.json({ success: true, auditLogs: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/admin/emails
  app.get('/api/admin/emails', (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const emails = dbRepo.getMockEmails(customerId);
      res.json({ success: true, emails });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/referrals
  app.get('/api/referrals', (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const referrals = dbRepo.getReferrals(customerId);
      res.json({ success: true, referrals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/reset
  app.post('/api/admin/reset', (req, res) => {
    try {
      dbRepo.reset();
      res.json({ success: true, message: 'Database reset to default seed state successful.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // SHOPIFY WEBHOOK HANDLERS (COMPLIANT)
  // ==========================================

  // POST /api/webhooks/orders/paid
  app.post('/api/webhooks/orders/paid', (req, res) => {
    const payload = req.body;
    if (!payload || !payload.id || !payload.customer) {
      dbRepo.log('WEBHOOK_FAILED', 'shopify_webhook', 'Received invalid/blank orders/paid payload');
      return res.status(400).json({ success: false, error: 'Invalid Shopify orders/paid payload format.' });
    }

    const { id: orderId, total_price, currency, customer, line_items } = payload;
    const shopifyCustomerId = `gid://shopify/Customer/${customer.id}`;
    const email = customer.email || `${customer.first_name?.toLowerCase()}@mock.shopify.com`;
    const name = `${customer.first_name || 'Anonymous'} ${customer.last_name || ''}`.trim();

    // 1 Purchase on Shopify Store = 1,600 points earned flat
    const pricePhp = Number(total_price);
    if (isNaN(pricePhp) || pricePhp <= 0) {
      dbRepo.log('WEBHOOK_FAILED', 'shopify_webhook', `Order ${orderId} has invalid total price: ${total_price}`);
      return res.status(400).json({ success: false, error: 'Invalid total order spending price.' });
    }

    const awardedPoints = 1600; // Flat 1600 points per store buy

    try {
      // Find or create customer
      let customerRecord = dbRepo.getCustomerByShopifyId(shopifyCustomerId);
      if (!customerRecord) {
        // Try locating by email
        customerRecord = dbRepo.getCustomerByEmail(email);
        if (!customerRecord) {
          customerRecord = dbRepo.createCustomer(shopifyCustomerId, email, name, 0);
        }
      }

      // Add points transaction dynamically with 'purchase' source
      const txn = dbRepo.addPointsTransaction(customerRecord.id, awardedPoints, 'earn', String(orderId), 'purchase');
      
      console.log(`[Shopify Webhook] Awarded ${awardedPoints} points to Customer ${customerRecord.name} for Order #${orderId}`);
      
      // Check if they purchased the RECOMMENDED product
      const boughtRecommended = line_items && line_items.some((item: any) => item.sku === 'SKU-RECOMMENDED-PROD');
      let referralMsg = '';

      if (boughtRecommended && customerRecord.referredByCustomerId) {
        // Find if they have already been rewarded for referring this friend
        const existingRef = dbRepo.getReferrals(customerRecord.referredByCustomerId).find(
          r => r.friendId === customerRecord.id && r.status === 'active'
        );

        if (!existingRef) {
          const referrer = dbRepo.getCustomerById(customerRecord.referredByCustomerId);
          if (referrer) {
            dbRepo.addPointsTransaction(customerRecord.referredByCustomerId, 500, 'earn', undefined, 'referral', customerRecord.email);
            referralMsg = ` Unlocked ₱500.00 referral bonus for your referrer (${referrer.name}) by purchasing the recommended product!`;
            dbRepo.log(
              'REFERRAL_REWARDED',
              'shopify_webhook',
              `Referred friend ${customerRecord.name} (${customerRecord.email}) bought the Recommended product. Referrer ${referrer.name} credited 500 PHP instantly.`
            );
          }
        }
      }

      res.json({
        success: true,
        message: `Order points awarded successfully.${referralMsg}`,
        awardedPoints,
        customerId: customerRecord.id,
        newBalance: txn.newBalance
      });
    } catch (err: any) {
      dbRepo.log('WEBHOOK_ERROR', 'shopify_webhook', `Internal error handling orders/paid: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/webhooks/orders/refunded
  app.post('/api/webhooks/orders/refunded', (req, res) => {
    const payload = req.body;
    if (!payload || !payload.order_id) {
      dbRepo.log('WEBHOOK_FAILED', 'shopify_webhook', 'Received invalid/blank orders/refunded payload');
      return res.status(400).json({ success: false, error: 'Invalid Shopify orders/refunded payload.' });
    }

    const orderId = String(payload.order_id);

    try {
      const result = dbRepo.reversePointsTransaction(orderId);
      if (result.success) {
        res.json({
          success: true,
          message: 'Order point reversal completed successfully.',
          reversedPoints: result.reversedPoints
        });
      } else {
        // Log trace and notify status
        dbRepo.log('WEBHOOK_WARNING', 'shopify_webhook', `Order refund points reversal skipped: ${result.error}`);
        res.json({ success: false, message: result.error });
      }
    } catch (err: any) {
      dbRepo.log('WEBHOOK_ERROR', 'shopify_webhook', `Internal error handling orders/refunded: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // VITE SERVER CONNECTION
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Shopify Philippines Loyalty App running on port ${PORT}`);
    console.log(`👉 Environment Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start loyalty rewards backend server:', err);
});
