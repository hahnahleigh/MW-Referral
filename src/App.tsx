import React, { useState, useEffect } from 'react';
import { Customer, PointTransaction, RedemptionRequest, AuditLog, MockEmail } from './types.js';
import CustomerDashboard from './components/CustomerDashboard.js';
import AdminDashboard from './components/AdminDashboard.js';
import ShopifySimulator from './components/ShopifySimulator.js';
import { Sparkles, Users, User, Shield, Terminal, ShoppingBag, Landmark, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Roles toggler: 'admin' or customer unique ID (e.g., 'CUST-1')
  const [activeRole, setActiveRole] = useState<string>('CUST-1');
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allRedemptions, setAllRedemptions] = useState<RedemptionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mockEmails, setMockEmails] = useState<MockEmail[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  
  // Active Customer specific state
  const [customerPointsTransactions, setCustomerPointsTransactions] = useState<PointTransaction[]>([]);
  const [customerRedemptionRequests, setCustomerRedemptionRequests] = useState<RedemptionRequest[]>([]);
  
  // App UI indicators
  const [isLgSimulatorOpen, setIsLgSimulatorOpen] = useState<boolean>(true);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Core helper to fetch and parse JSON safely, avoiding HTML and network parse crashes
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, error: 'Response is not JSON' };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Fetch failed' };
    }
  };

  // Core data synchronization hook
  const syncServerData = async () => {
    setIsFetchingData(true);
    setNetworkError(null);
    
    let customerFetchError = false;

    // 1. Fetch all customer accounts
    try {
      const custData = await safeFetch('/api/customers');
      if (custData && custData.success) {
        setCustomers(custData.customers);
      } else {
        customerFetchError = true;
      }
    } catch (e) {
      customerFetchError = true;
    }

    // 2. Fetch all redemptions list (for administrative panel metrics)
    try {
      const redData = await safeFetch('/api/admin/redemptions');
      if (redData && redData.success) {
        setAllRedemptions(redData.redemptions);
      }
    } catch (e) {}

    // 3. Fetch audit logging database
    try {
      const auditData = await safeFetch('/api/admin/audit-logs');
      if (auditData && auditData.success) {
        setAuditLogs(auditData.auditLogs);
      }
    } catch (e) {}

    // 4. Fetch mock email notifications
    try {
      const emailUrl = activeRole === 'admin' 
        ? '/api/admin/emails' 
        : `/api/admin/emails?customerId=${activeRole}`;
      const emailData = await safeFetch(emailUrl);
      if (emailData && emailData.success) {
        setMockEmails(emailData.emails);
      }
    } catch (e) {}

    // 5. Fetch referral info
    try {
      const refUrl = activeRole === 'admin'
        ? '/api/referrals'
        : `/api/referrals?customerId=${activeRole}`;
      const refData = await safeFetch(refUrl);
      if (refData && refData.success) {
        setReferrals(refData.referrals);
      }
    } catch (e) {}

    // 6. If current role is customer-based, fetch their specific ledger logs
    if (activeRole !== 'admin') {
      try {
        const histData = await safeFetch(`/api/rewards/history?customerId=${activeRole}`);
        if (histData && histData.success) {
          setCustomerPointsTransactions(histData.pointsTransactions || []);
          setCustomerRedemptionRequests(histData.redemptionRequests || []);
        }
      } catch (e) {}
    }

    if (customerFetchError && customers.length === 0) {
      setNetworkError('Failed to establish contact with local Node.js database server. Server may be starting up.');
    }

    setIsFetchingData(false);
  };

  // Re-sync whenever role or components trigger events
  useEffect(() => {
    syncServerData();
  }, [activeRole]);

  // Periodic polling safety to reflect incoming Shopify webhooks
  useEffect(() => {
    const interval = setInterval(() => {
      syncServerData();
    }, 8500);
    return () => clearInterval(interval);
  }, [activeRole]);

  const activeCustomer = customers.find(c => c.id === activeRole);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-100">
      
      {/* Dynamic Top Navigation Bar with Bento Theme */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-sm backdrop-blur-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-r from-indigo-600 to-violet-600 text-white px-3 py-1.5 rounded-xl font-extrabold shrink-0 tracking-wider font-display border border-indigo-500/30 shadow-xs select-none text-xs">
                🇵🇭 REWARDS
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight font-display flex items-center gap-1.5 text-slate-100">
                  Shopify Loyalty Portal <span className="text-[10px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-md text-slate-300 font-mono">v1.2</span>
                </h1>
                <p className="text-[10px] text-slate-400">Philippines Cashout Compliance System</p>
              </div>
            </div>

            {/* Quick Refresh Icon */}
            <button
              onClick={syncServerData}
              title="Manual Sync Ledger API"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingData ? 'animate-spin' : ''}`} />
            </button>

            {/* Role Authentication Selector (Simulates OAuth Context in iFrame App) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden md:inline">Simulated Identity:</span>
              <div className="relative">
                <select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className="bg-slate-800 hover:bg-slate-755 text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <optgroup label="🛍️ MERCHANT ACCESS" className="bg-slate-900">
                    <option value="admin">🔒 Merchant Administrator View</option>
                  </optgroup>
                  <optgroup label="🇵🇭 REGISTERED SHOPIFY CUSTOMERS" className="bg-slate-900">
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        👤 {c.name} ({c.pointsBalance} pts)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Banner: Environment notifications & Offline simulation state */}
        {networkError && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs text-rose-800 flex justify-between items-center">
            <span className="font-semibold">⚠️ Connection Alert: {networkError}</span>
            <button
              onClick={syncServerData}
              className="underline hover:no-underline font-bold text-rose-900 cursor-pointer"
            >
              Retry Database Ping
            </button>
          </div>
        )}

        {/* Global Hub Header Indicator with Bento Frame */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active Sandbox View
              </span>
              <span className="text-[10px] text-slate-450 font-mono">
                Session: {activeRole === 'admin' ? 'Merchant Admin Context' : `Shopify Buyer Context (#${activeRole})`}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-2 mt-2">
              {activeRole === 'admin' ? (
                <>
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Merchant Control Desk
                </>
              ) : (
                <>
                  <User className="w-5 h-5 text-indigo-600" />
                  Loyalty Rewards for {activeCustomer?.name || 'Customer Profile'}
                </>
              )}
            </h2>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
              {activeRole === 'admin' 
                ? 'Oversee customer transactions ledger, check security audit logs, approve payout cash requests and emit payout compliance trails.' 
                : `Collect bonus points on Shopify checkouts (₱1 PHP Spent = 1 Star Earned) and transfer point balances to your local mobile GCash/Maya wallets.`
              }
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setIsLgSimulatorOpen(!isLgSimulatorOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isLgSimulatorOpen 
                  ? 'bg-slate-900 text-white border-slate-950 shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              {isLgSimulatorOpen ? 'Hide Simulator' : 'Show Simulator'}
            </button>
          </div>
        </div>

        {/* Anchorable Webhook Events Simulator */}
        {isLgSimulatorOpen && (
          <div className="transition-all animate-in fade-in duration-300">
            <ShopifySimulator 
              customers={customers} 
              pointTransactions={activeRole === 'admin' ? allRedemptions.flatMap(() => []) : customerPointsTransactions} 
              onTriggerWebhook={syncServerData}
              selectedCustomerId={activeRole === 'admin' ? (customers[0]?.id || '') : activeRole}
            />
          </div>
        )}

        {/* Role Content Dispatcher */}
        {activeRole === 'admin' ? (
          <div className="animate-in fade-in duration-300">
            <AdminDashboard 
              customers={customers} 
              redemptionRequests={allRedemptions} 
              auditLogs={auditLogs} 
              mockEmails={mockEmails}
              referrals={referrals}
              onAdminAction={syncServerData} 
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeCustomer ? (
              <CustomerDashboard 
                customer={activeCustomer} 
                pointTransactions={customerPointsTransactions} 
                redemptionRequests={customerRedemptionRequests} 
                mockEmails={mockEmails}
                referrals={referrals}
                onRedeemSuccess={syncServerData} 
              />
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <p className="text-xs text-gray-400">Loading your loyal customer profile state...</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Persistent Information Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left text-[11px] text-gray-400">
            <span>© 2026 Shopify Rewards System (Philippines Corp). 100% compliant with BSP payment wallet rules. All rights reserved.</span>
          </div>

          <div className="flex gap-4 text-[10px] text-gray-400 font-mono">
            <span>Powered by Node.js, Express, & Vite</span>
            <span>📍 Manila, PH</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
