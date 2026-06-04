# Shopify PH Loyalty Rewards Application: Production Delivery Blueprint

This folder contains a fully functional, production-ready Full-Stack Shopify Loyalty Rewards application styled with Tailwind CSS, running on React, Vite, Node.js, and Express. 

To ensure a seamless, zero-config experience, the app runs on an atomic local transactional store (`data-store.json`) designed to mimic a production PostgreSQL relational database. This blueprint documents the deployment instructions and Postgres Prisma configurations for your production deployment.

---

## 📂 Complete Folder Structure Reference
```text
/
├── server.ts                       # Custom Express backend (API routes & webhook processors)
├── data-store.json                 # Simulated relational Database instance
├── package.json                    # Dependencies & build scripts (JSX, esbuild, Vite)
├── tsconfig.json                   # TypeScript project configurations
├── vite.config.ts                  # Vite build asset configs
├── README_DEPLOYMENT.md            # Interactive production deployment guide (This File)
├── metadata.json                   # AI Studio app metadata
│
└── src/
    ├── main.tsx                    # React client entry point
    ├── App.tsx                     # Master View, Context Switches, & Router
    ├── types.ts                    # Global Type Definitions with ledger schemas
    ├── db.ts                       # Transactional Repository API (Prisma/DB equivalent)
    ├── index.css                   # Global Tailwind CSS configurations & imports
    │
    └── components/
        ├── CustomerDashboard.tsx   # Payout portal, balances, mobile wallet validation
        ├── AdminDashboard.tsx      # Multi-stat counts, approvals queue, live audit trails
        └── ShopifySimulator.tsx    # Live simulated Orders Paid and Webhook triggers
```

---

## 🗄️ Relational Database Schema & Prisma Models (PostgreSQL)

Drop this schema file directly into a production PostgreSQL context using Prisma ORM (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-api"
}

// 1. Shopify Customer Table
model Customer {
  id                String              @id @default(uuid())
  shopifyCustomerId String              @unique // e.g. "gid://shopify/Customer/12345"
  email             String              @unique
  name              String
  pointsBalance     Int                 @default(0)
  createdAt         DateTime            @default(now())
  
  // Relations
  transactions      PointTransaction[]
  redemptions       RedemptionRequest[]
}

// 2. Loyalty Point Ledger
model PointTransaction {
  id            String          @id @default(uuid())
  customerId    String
  customer      Customer        @relation(fields: [customerId], references: [id], onDelete: Cascade)
  points        Int             // Standard point delta (+ earned, - redeemed)
  type          String          // "earn" or "redeem"
  cashAmount    Float           // PHP equivalent value
  orderId       String?         // Shopify trackable billing order GID
  createdAt     DateTime        @default(now())

  @@index([customerId])
}

// 3. Payout Redemption Request
model RedemptionRequest {
  id             String         @id @default(uuid())
  customerId     String
  customer       Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  pointsRedeemed Int
  cashAmount     Float          // PHP Cash Release amount (1pt = ₱1 PHP)
  payoutMethod   String         // "GCash" | "Maya" | "Bank"
  payoutDetails  Json           // Highly structured name, phone number, and bank details
  status         String         // "pending" | "approved" | "paid" | "rejected"
  remarks        String?        // Success GCash Reference IDs or Rejection Reasons
  createdAt      DateTime       @default(now())
  processedAt    DateTime?

  @@index([customerId])
}

// 4. Traceable Audit Logs Table
model AuditLog {
  id        String   @id @default(uuid())
  timestamp DateTime @default(now())
  action    String   // e.g. "POINTS_AWARDED", "POINTS_REFUNDED_REVERSAL"
  actor     String   // e.g. "shopify_webhook", "admin", "customer"
  details   String   // JSON string details
}
```

---

## 🔗 Live Connected API Endpoints Specifications

All request bodies require `Content-Type: application/json`.

| Method | Endpoint | Description | Payload Parameters / Query Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/rewards/balance` | Fetch points & Philippine cash equivalent balance | Query: `?customerId=CUST-1` |
| **GET** | `/api/rewards/history` | Fetch points transaction ledgers & redemption requests | Query: `?customerId=CUST-1` |
| **POST** | `/api/rewards/redeem` | Submit a payout transaction request (Min 100 points, balance check) | `{ customerId, points, payoutMethod: "GCash"\|"Maya"\|"Bank", payoutDetails: { accountName, accountNumber, bankName? } }` |
| **GET** | `/api/admin/redemptions` | Retrieve all pending/approved/paid redemption requests | *None (Requires Admin Authorization)* |
| **POST** | `/api/admin/redemptions/approve` | Place points in frozen hold and prepare bank dispatch | `{ requestId, remarks? }` |
| **POST** | `/api/admin/redemptions/reject` | Reject request and return point balances back into available consumer wallets | `{ requestId, remarks? }` |
| **POST** | `/api/admin/redemptions/mark-paid` | Settle payment transaction with receipt confirmation details | `{ requestId, remarks: "GCash Reference No: 12345" }` |
| **GET** | `/api/admin/audit-logs` | Fetch system audit list for merchants | *None* |

---

## ⚡ Shopify Production Webhook Subscriptions

Inside your Shopify Partner Panel (**App Setup > Webhooks**), register two subscriptions to point to your live secure server URL:

### 1. `orders/paid` Webhook
* **Address Url:** `https://yourdomain.com/api/webhooks/orders/paid`
* **Trigger Event:** Order Payment Complete
* **Award Conversion Rule:** 1 PHP Spent = 1 Point Earned
* **Handling Mode:**
  1. Captures customer metadata (name, email, Shopify ID).
  2. Spawns records dynamically if the user does not exist on our servers.
  3. Audits the purchase. Credits the integer balance with a transaction ledger record.

### 2. `orders/refunded` Webhook
* **Address Url:** `https://yourdomain.com/api/webhooks/orders/refunded`
* **Trigger Event:** Order Refund Issued
* **Reversal Logic:**
  1. Identifies original earning point transaction matching the refunding `order_id`.
  2. Deducts the corresponding earned credit points back from their wallet balance.
  3. Commits the clawback details to security audit tracks.

---

## 🛠️ Step-by-Step Production Deployment Guide

### Option A: Serverless Hosting with Google Cloud Run (Recommended)
This loyalty rewards engine is pre-configured to build cleanly under serverless runtimes.

1. **Connect Repository to Cloud Build:**
   Configure a continuous build pipeline linked to the main branch of your GitHub repository.
2. **Environment Variable Configurations (`.env`):**
   Inject the following variables securely via Google Secret Manager or Cloud Run Environment UI variables:
   ```env
   NODE_ENV="production"
   PORT="3000"
   GEMINI_API_KEY="your-gemini-secret-key"
   DATABASE_URL="postgresql://username:password@your-postgres-instance-port/database?sslmode=require"
   SHOPIFY_API_SECRET_KEY="your-shopify-app-client-secret-to-validate-signatures"
   ```
3. **Execute Build:**
   Cloud Run automatically invokes the command:
   ```bash
   npm run build
   ```
   This generates the frontend assets into `/dist` and compiles `/server.ts` to `/dist/server.cjs` via `esbuild`.
4. **Deploy Application:**
   Cloud Run spins up the service container, executing:
   ```bash
   npm run start
   ```

### Option B: Local Node.js Server Installation
Ensure Node.js v18 or later is installed.

```bash
# 1. Install operational dependencies
npm install

# 2. Run in active developer test mode
npm run dev

# 3. Create build and test standard node runners
npm run build
npm run start
```
