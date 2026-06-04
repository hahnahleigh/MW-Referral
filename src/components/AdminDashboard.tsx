import React, { useState, useEffect } from 'react';
import { Customer, RedemptionRequest, AuditLog, MockEmail, ShopifySettings } from '../types.js';
import { ShieldCheck, Users, Banknote, ClipboardList, Check, X, FileText, RefreshCw, Sparkles, Database, Mail, ChevronDown, ChevronUp, Settings2, Sliders, Palette, Link, Eye, Copy, Monitor, Code2 } from 'lucide-react';
import StorefrontWidget from './StorefrontWidget.js';
import ShopifyThemeEditor from './ShopifyThemeEditor.js';

interface AdminDashboardProps {
  customers: Customer[];
  redemptionRequests: RedemptionRequest[];
  auditLogs: AuditLog[];
  mockEmails?: MockEmail[];
  referrals?: any[];
  settings: ShopifySettings | null;
  onAdminAction: () => void;
}

function AdminMailItem({ email }: { email: MockEmail; key?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-4 hover:bg-white bg-slate-50/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
              email.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {email.status}
            </span>
            <span className="text-xs font-bold text-gray-950 font-mono text-[11px]">{email.id}</span>
            <span className="text-xs text-gray-450 font-mono">To: {email.recipientName} ({email.recipientEmail})</span>
          </div>
          <h4 className="text-xs font-bold text-slate-800 mt-1.5">{email.subject}</h4>
          <span className="text-[10px] text-gray-450 font-mono">Dispatched Timestamp: {new Date(email.sentAt).toLocaleString()} ({email.requestId})</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold font-mono">SMTP Mock</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-150 animate-in slide-in-from-top-1 duration-150">
          <pre className="text-xs text-slate-750 font-mono bg-white p-4 rounded-xl border border-gray-200 shadow-sm whitespace-pre-wrap leading-relaxed">
            {email.body}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({
  customers,
  redemptionRequests,
  auditLogs,
  mockEmails = [],
  referrals = [],
  settings,
  onAdminAction
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'payouts' | 'customers' | 'audit' | 'emails' | 'referrals' | 'settings' | 'reset'>('payouts');
  
  // Action control states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [refNumbers, setRefNumbers] = useState<{ [key: string]: string }>({});
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Shopify customizable configurations form states
  const [storeName, setStoreName] = useState('Artisan Bakery Manila');
  const [shopifyDomain, setShopifyDomain] = useState('potopotostudio.myshopify.com');
  const [apiAccessToken, setApiAccessToken] = useState('shpat_v12489');
  const [webhookSecret, setWebhookSecret] = useState('whsec_v12489');
  const [pointsPerPesoSpent, setPointsPerPesoSpent] = useState(1);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(100);
  const [pointsToPesoRate, setPointsToPesoRate] = useState(1);
  const [allowGCash, setAllowGCash] = useState(true);
  const [allowMaya, setAllowMaya] = useState(true);
  const [allowBank, setAllowBank] = useState(true);
  const [allowQRPh, setAllowQRPh] = useState(true);
  const [widgetLauncherText, setWidgetLauncherText] = useState('🇵🇭 Rewards & Cashouts');
  const [widgetThemeColor, setWidgetThemeColor] = useState('#4f46e5');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [appEmbedEnabled, setAppEmbedEnabled] = useState(true);
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  // Sync settings when loaded from main API
  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setShopifyDomain(settings.shopifyDomain || '');
      setApiAccessToken(settings.apiAccessToken || '');
      setWebhookSecret(settings.webhookSecret || '');
      setPointsPerPesoSpent(settings.pointsPerPesoSpent !== undefined ? settings.pointsPerPesoSpent : 1);
      setMinPointsToRedeem(settings.minPointsToRedeem !== undefined ? settings.minPointsToRedeem : 100);
      setPointsToPesoRate(settings.pointsToPesoRate !== undefined ? settings.pointsToPesoRate : 1);
      setAllowGCash(settings.allowGCash !== undefined ? settings.allowGCash : true);
      setAllowMaya(settings.allowMaya !== undefined ? settings.allowMaya : true);
      setAllowBank(settings.allowBank !== undefined ? settings.allowBank : true);
      setAllowQRPh(settings.allowQRPh !== undefined ? settings.allowQRPh : true);
      setWidgetLauncherText(settings.widgetLauncherText || '🇵🇭 Rewards & Cashouts');
      setWidgetThemeColor(settings.widgetThemeColor || '#4f46e5');
      setWidgetPosition(settings.widgetPosition || 'bottom-right');
      setShowWelcomeBubble(settings.showWelcomeBubble !== undefined ? settings.showWelcomeBubble : true);
      setIsConnected(settings.isConnected !== undefined ? settings.isConnected : false);
      setAppEmbedEnabled(settings.appEmbedEnabled !== undefined ? settings.appEmbedEnabled : true);
    }
  }, [settings]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const payload = {
      storeName,
      shopifyDomain,
      apiAccessToken,
      webhookSecret,
      pointsPerPesoSpent: Number(pointsPerPesoSpent) || 1,
      minPointsToRedeem: Number(minPointsToRedeem) || 100,
      pointsToPesoRate: Number(pointsToPesoRate) || 1,
      allowGCash,
      allowMaya,
      allowBank,
      allowQRPh,
      widgetLauncherText,
      widgetThemeColor,
      widgetPosition,
      showWelcomeBubble,
      isConnected,
      appEmbedEnabled
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setActionSuccess('Shopify Settings saved successfully! Embedded widget live styles updated in real-time.');
        onAdminAction();
      } else {
        setActionError(data.error || 'Failed to update settings parameters.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while saving settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary statistics
  const totalCustomerPoints = customers.reduce((sum, c) => sum + c.pointsBalance, 0);
  const pendingRequests = redemptionRequests.filter(r => r.status === 'pending');
  const approvedRequests = redemptionRequests.filter(r => r.status === 'approved');
  const paidRequests = redemptionRequests.filter(r => r.status === 'paid');
  
  const pendingVolumePhp = pendingRequests.reduce((sum, r) => sum + r.cashAmount, 0);
  const approvedVolumePhp = approvedRequests.reduce((sum, r) => sum + r.cashAmount, 0);
  const paidVolumePhp = paidRequests.reduce((sum, r) => sum + r.cashAmount, 0);

  const handleApprove = async (requestId: string) => {
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch('/api/admin/redemptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          remarks: `Approved for payout processing by Admin at ${new Date().toLocaleTimeString()}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccess(`Request ${requestId} approved successfully! Point allocation locked.`);
        onAdminAction();
      } else {
        setActionError(data.error || 'Failed to approve request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const remark = prompt('Please enter rejection reason (points will automatically be returned to the customer):', 'Payout details invalid or wallet unverified');
    if (remark === null) {
      setIsSubmitting(false);
      return; // Canceled
    }

    try {
      const response = await fetch('/api/admin/redemptions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          remarks: remark || 'Rejected by Admin. Points returned.'
        })
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccess(`Request ${requestId} rejected. Point balance has been fully refunded back to the buyer.`);
        onAdminAction();
      } else {
        setActionError(data.error || 'Failed to reject request.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    const receiptRef = refNumbers[requestId]?.trim();
    if (!receiptRef) {
      alert('Please enter a release reference code (like GCash Ref No or Bank Transfer ID) for the audit log receipts trail first.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch('/api/admin/redemptions/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          remarks: `Paid Out. Ref Number/Details: ${receiptRef}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccess(`Request ${requestId} marked as PAID. Receipt reference recorded.`);
        onAdminAction();
        setRefNumbers(prev => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
        });
      } else {
        setActionError(data.error || 'Failed to mark as paid.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDb = async () => {
    const confirm = window.confirm('Are you absolutely sure you want to clear simulated balances and restore the default database state?');
    if (!confirm) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setActionSuccess('Database restored to default seed state successful.');
        onAdminAction();
      } else {
        setActionError(data.error || 'Reset failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 font-bold uppercase rounded-full">Pending</span>;
      case 'approved':
        return <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold uppercase rounded-full font-display">Approved</span>;
      case 'paid':
        return <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 font-bold uppercase rounded-full font-display">Paid Out</span>;
      case 'rejected':
        return <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 font-bold uppercase rounded-full font-display">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Admin Metrics Grid summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/60">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono">Pending Payouts</p>
            <p className="text-xl font-bold font-display text-slate-900">{pendingRequests.length} Requests</p>
            <p className="text-xs text-amber-600 font-semibold font-mono">Vol: ₱{pendingVolumePhp.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono">Approved Queue</p>
            <p className="text-xl font-bold font-display text-slate-900">{approvedRequests.length} Locked</p>
            <p className="text-xs text-emerald-600 font-semibold font-mono">Vol: ₱{approvedVolumePhp.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/60">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono">Disbursed Paid</p>
            <p className="text-xl font-bold font-display text-slate-900">{paidRequests.length} Settled</p>
            <p className="text-xs text-indigo-600 font-semibold font-mono">Vol: ₱{paidVolumePhp.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center gap-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100/60">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-mono">Customer Liability</p>
            <p className="text-xl font-bold font-display text-slate-900">{customers.length} Accounts</p>
            <p className="text-xs text-violet-600 font-semibold font-mono">Bal: {totalCustomerPoints.toLocaleString()} pts</p>
          </div>
        </div>

      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-2xl font-medium">
          ⚠️ Action Failed: {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-2xl font-medium">
          ✅ Action Success: {actionSuccess}
        </div>
      )}

      {/* 2. Admin Segment Tabs */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6">
        
        <div className="flex border-b border-slate-150 pb-3 mb-5 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'payouts'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Redemptions Processing ({pendingRequests.length + approvedRequests.length})
          </button>
          
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Registered Shopify Customers ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            Security Audit Trail ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'emails'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            📬 System Email Logs ({mockEmails.length})
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'referrals'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            👥 Global Referrals ({referrals.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold font-display'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            ⚙️ Shopify Settings & Stylings
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`pb-2 text-sm font-semibold tracking-tight transition-all whitespace-nowrap cursor-pointer text-rose-600 ${
              activeTab === 'reset' ? 'border-b-2 border-rose-600 font-bold' : 'hover:text-rose-700 font-medium'
            }`}
          >
            System Hard Reset
          </button>
        </div>

        {/* TAB 1: Payouts and Approvals */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 mb-2 font-display">Redemption Request Operations Ledger</h3>
            <p className="text-xs text-gray-500 mb-4 font-normal">
              Review pending cash conversions. Approve requests to freeze funds, then dispense cash via GCash/Maya/QR Ph and record reference receipts to settle.
            </p>

            <div className="overflow-x-auto">
              {redemptionRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No payout transfer requests recorded in database.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 text-left font-mono">
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">ID / Date</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Customer Details</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Payout details</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Points / Cash value</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Status</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {redemptionRequests.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 font-mono text-[10px]">{r.id}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{formatDateTime(r.createdAt)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{r.customerName}</div>
                          <div className="text-[10px] text-gray-400">{r.customerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              r.payoutMethod === 'GCash' ? 'bg-blue-100 text-gcash-blue' :
                              r.payoutMethod === 'Maya' ? 'bg-emerald-100 text-emerald-800' :
                              r.payoutMethod === 'QRPh' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {r.payoutMethod}
                            </span>
                            <span className="font-mono">{r.payoutDetails.accountNumber}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 italic">Name: {r.payoutDetails.accountName}</div>
                          {r.payoutDetails.bankName && <div className="text-[9px] text-emerald-800 font-medium">Bank: {r.payoutDetails.bankName}</div>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-gray-950 font-mono text-sm">{r.pointsRedeemed.toLocaleString()} pts</div>
                          <div className="text-[10.5px] text-emerald-700 font-semibold font-mono">₱{r.cashAmount.toLocaleString()}.00</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {getStatusBadge(r.status)}
                            {r.remarks && <span className="text-[9px] text-gray-400 font-semibold leading-tight block">"{r.remarks}"</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {/* PENDING OPERATIONS */}
                          {r.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprove(r.id)}
                                disabled={isSubmitting}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-1 px-2.5 rounded-md text-xs border border-emerald-100 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve Payout
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                disabled={isSubmitting}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-1 px-2.5 rounded-md text-xs border border-rose-100 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Reject / Refund
                              </button>
                            </div>
                          )}

                          {/* APPROVED COMPLETED OPERATIONS - Settle with reference receipt values */}
                          {r.status === 'approved' && (
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex gap-1 shadow-2xs">
                                <input
                                  type="text"
                                  value={refNumbers[r.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setRefNumbers(prev => ({ ...prev, [r.id]: val }));
                                  }}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-hidden focus:border-blue-500 w-[140px]"
                                  placeholder="GCash Ref / Bank Tx ID..."
                                />
                                <button
                                  onClick={() => handleMarkPaid(r.id)}
                                  disabled={isSubmitting}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-md text-xs flex items-center gap-0.5 whitespace-nowrap cursor-pointer"
                                >
                                  Settle Paid
                                </button>
                              </div>
                              <button
                                onClick={() => handleReject(r.id)}
                                disabled={isSubmitting}
                                className="text-[10px] text-rose-700 hover:underline cursor-pointer"
                              >
                                Reject & Return Points
                              </button>
                            </div>
                          )}

                          {/* COMPLETED STATUSES */}
                          {r.status === 'paid' && (
                            <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1">
                              ✓ Disbursed Settle
                            </span>
                          )}

                          {r.status === 'rejected' && (
                            <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded">
                              Returned Balance
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Customers list */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 font-display">Registered Loyalty Customer Liability Ledger</h3>
            <p className="text-xs text-gray-500">
              Overview of all customer records synchronized with local SQLite emulation. Spend totals are tracked to avoid double redemptions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 text-left font-mono">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Internal ID</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Shopify Customer GID</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Buyer Directory</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Points balance</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Cash equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">{c.id}</td>
                      <td className="py-3 px-4 font-mono text-gray-500 text-[10px]">{c.shopifyCustomerId}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-950">{c.name}</div>
                        <div className="text-[10px] text-gray-400">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-800">
                        {c.pointsBalance.toLocaleString()} pts
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-gray-500">
                        ₱{c.pointsBalance.toLocaleString()}.00 PHP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Live Security & Compliance Audit Log</h3>
                <p className="text-xs text-gray-500">
                  Verifiable audit trails showing Shopify webhook captures, payout approvals, point refund reversals, and administrator actions.
                </p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[450px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-600 font-mono text-[10px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Timestamp No.</th>
                    <th className="py-2 px-3 font-semibold">Security Action</th>
                    <th className="py-2 px-3 font-semibold">Initiated Actor</th>
                    <th className="py-2 px-3 font-semibold">Audit Record Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('REJECT') ? 'bg-rose-50 text-rose-700' :
                          log.action.includes('AWARD') ? 'bg-emerald-50 text-emerald-700' :
                          log.action.includes('PAID') ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500 select-all font-semibold">{log.actor}</td>
                      <td className="py-2 px-3 text-gray-900 font-sans max-w-[400px] break-words">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3.5: Mock Email Logs */}
        {activeTab === 'emails' && (
          <div className="space-y-4 font-sans text-xs">
            <h3 className="text-base font-bold text-gray-900 font-display">System Outbox: Triggered Email Confirmations</h3>
            <p className="text-xs text-slate-500">
              Historical ledger of mock emails automatically dispatched to registered customers when status updates transition to approved or rejected.
            </p>

            {mockEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-550 border border-dashed border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-700">No mock emails sent yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  When you approve or reject a pending redemption request, the backend automatically triggers a corresponding confirmation alert email. Try processing a request inside the Redemptions tab!
                </p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl divide-y divide-slate-150 overflow-hidden bg-slate-50/20">
                {mockEmails.map((email) => (
                  <AdminMailItem key={email.id} email={email} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3.7: Global Referrals Network */}
        {activeTab === 'referrals' && (
          <div className="space-y-4 font-sans text-xs animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">👥 Global Referral Tracking Desk</h3>
                <p className="text-xs text-slate-500">
                  Observe and track all system-wide invite links clicked, users referred, registration status, and reward disbursements.
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl px-3 py-1.5 text-xs text-indigo-850 font-semibold font-mono self-start sm:self-center shrink-0">
                💰 Total Paid Referral Rewards: {(referrals.reduce((sum, r) => sum + r.pointsEarned, 0)).toLocaleString()} PHP
              </div>
            </div>

            {referrals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                <p className="font-semibold text-slate-700">No active referrals recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  When a customer shares their custom referral invite link and simulated buyers register or place orders, the refer-and-earn engine registers them. Try triggering one with the simulator!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">Referral ID</th>
                      <th className="py-3 px-4">Referrer (Earner Account)</th>
                      <th className="py-3 px-4">Referred Buyer Account</th>
                      <th className="py-3 px-4 font-mono">Commission Paid</th>
                      <th className="py-3 px-4">Rewarding Date</th>
                      <th className="py-3 px-4 text-right">Shopify Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {ref.id.startsWith('ref-pending-') ? 'PENDING' : ref.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{ref.referrerName}</span>
                            <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-700 font-bold px-1 py-0.2 rounded">Referrer</span>
                          </div>
                          <div className="text-[10px] text-slate-450 font-mono mt-0.5">{ref.referrerEmail}</div>
                          <div className="text-[9px] text-indigo-700 font-semibold font-mono mt-0.5">
                            💼 Account Balance: ₱{(ref.referrerPointsBalance !== undefined ? ref.referrerPointsBalance : 0).toLocaleString()} PHP
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{ref.name || 'Anonymous Guest'}</span>
                            {ref.status === 'active' ? (
                              <span className="text-[8px] border border-emerald-250 bg-emerald-50 text-emerald-800 font-bold px-1 py-0.2 rounded">Verified Buyer</span>
                            ) : (
                              <span className="text-[8px] border border-blue-200 bg-blue-50 text-blue-800 font-bold px-1 py-0.2 rounded">Account Created</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ref.email}</div>
                          <div className="text-[9px] text-emerald-700 font-semibold font-mono mt-0.5">
                            🛒 Account Balance: ₱{(ref.friendPointsBalance !== undefined ? ref.friendPointsBalance : 100).toLocaleString()} PHP
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {ref.status === 'active' ? (
                            <span className="font-bold text-emerald-600 font-mono">
                              ₱{ref.pointsEarned.toFixed(2)} PHP
                            </span>
                          ) : (
                            <span className="text-amber-600 font-mono font-medium text-[11px] flex items-center gap-0.5">
                              ₱0.00 <span className="text-[9px] text-slate-400">(Pending Recommended Purchase)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(ref.dateRewarded).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ref.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md px-2 py-0.5 uppercase tracking-wide">
                              Active Buyer (Order Verified)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded-md px-2 py-0.5 uppercase tracking-wide">
                              Pending Recommended Buy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3.8: Shopify Settings & Stylings Customizer */}
        {activeTab === 'settings' && (
          <div className="space-y-6 font-sans text-xs animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                Shopify Integration & Stylings Control Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your store credentials, adjust Filippine wallet payout triggers, and personalize the floating storefront rewards widget.
              </p>
            </div>

            {/* Shopify Theme Editor App Embedded customizer callout banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-50/5 to-indigo-50/20 border border-emerald-355 p-5 rounded-3xl shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono">
                  🎨 Storefront App Embed Integration Active
                </span>
                <h4 className="text-xs font-extrabold text-neutral-900 leading-snug">
                  Install Widget via Shopify Theme Customizer Extension
                </h4>
                <p className="text-[11px] text-slate-550 leading-relaxed">
                  In modern Shopify Online Store 2.0 Themes (like Dawn v15.0), your points & checkout widgets are loaded instantly as high-performance <strong>App Embedded Blocks</strong>. Toggle the widget on/off, customize brand colors, adjust positions, and test direct orders right in our theme preview.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowThemeEditor(true)}
                className="bg-[#008060] hover:bg-[#006e52] text-white font-extrabold text-xs px-5 py-3 rounded-2xl cursor-pointer flex items-center gap-2 tracking-wide font-display self-stretch md:self-auto text-center justify-center border border-emerald-400 shadow-xs shrink-0 transition-all hover:scale-[1.02] font-semibold"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Open Shopify Theme Editor (App Embeds)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: API & Rules */}
              <div className="space-y-6">
                
                {/* 1. Shopify Connection API Section */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-205 pb-2">
                    <Link className="w-4 h-4 text-slate-500" />
                    Shopify Credentials & Webhooks
                  </h4>

                  {/* Production mode toggle */}
                  <div className="bg-indigo-50/55 border border-indigo-100 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-indigo-950 text-xs block">🔌 Connect Shopify Production Store</span>
                      <span className="text-[10px] text-indigo-600 block leading-relaxed">
                        Disable local Sandbox view and track real Shopify customers on your live store.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isConnected}
                        onChange={(e) => setIsConnected(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Store Name Identifier
                      </label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. PH Artisan Bakery"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Shopify Domain (*.myshopify.com)
                      </label>
                      <input
                        type="text"
                        value={shopifyDomain}
                        onChange={(e) => setShopifyDomain(e.target.value)}
                        className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        placeholder="store-name.myshopify.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Admin API Access Token (shpat_***)
                    </label>
                    <input
                      type="password"
                      value={apiAccessToken}
                      onChange={(e) => setApiAccessToken(e.target.value)}
                      className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="shpat_abcdefg..."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Webhook Secret Signatures Key (whsec_***)
                    </label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                      placeholder="whsec_abcdefg..."
                      required
                    />
                  </div>
                </div>

                {/* 2. Points Rules and Valuations */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-205 pb-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    Loyalty Credit & Exchange Ledger Rules
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Earning multiplier
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={pointsPerPesoSpent}
                          onChange={(e) => setPointsPerPesoSpent(Number(e.target.value))}
                          min="0.1"
                          step="0.1"
                          className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1"
                        />
                        <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">pts/₱</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Min redeem points
                      </label>
                      <input
                        type="number"
                        value={minPointsToRedeem}
                        onChange={(e) => setMinPointsToRedeem(Number(e.target.value))}
                        min="1"
                        className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Point Value Rate (PHP)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={pointsToPesoRate}
                          onChange={(e) => setPointsToPesoRate(Number(e.target.value))}
                          min="0.01"
                          step="0.01"
                          className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl"
                        />
                        <span className="absolute right-3 top-2 text-[11px] font-bold text-emerald-600 font-mono">₱/pt</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    With current setup: 1 spent cashout credit conversion evaluates at <b>1 Point = ₱{pointsToPesoRate.toFixed(2)} PHP</b>, with a minimum required checkpoint of <b>{minPointsToRedeem} points</b>.
                  </p>
                </div>

              </div>

              {/* Right Column: Payout Channels & Widget Styling */}
              <div className="space-y-6">

                {/* 3. Payout Channels Toggle */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-205 pb-2">
                    <Banknote className="w-4 h-4 text-slate-500" />
                    Whitelabled PH Mobile Wallets & Gateways
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allowGCash ? 'bg-blue-50/50 text-blue-900 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={allowGCash}
                        onChange={(e) => setAllowGCash(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <div>
                        <span className="font-bold text-xs">GCash Wallet</span>
                        <span className="text-[9px] block text-slate-400">PH Mobile Number</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allowMaya ? 'bg-emerald-50/50 text-emerald-900 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={allowMaya}
                        onChange={(e) => setAllowMaya(e.target.checked)}
                        className="rounded accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-xs">Maya Wallet</span>
                        <span className="text-[9px] block text-slate-400">PH Mobile wallet</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allowBank ? 'bg-indigo-50/50 text-indigo-900 border-indigo-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={allowBank}
                        onChange={(e) => setAllowBank(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <div>
                        <span className="font-bold text-xs">Bank Transfer</span>
                        <span className="text-[9px] block text-slate-400">BPI/BDO Peso account</span>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allowQRPh ? 'bg-violet-50/50 text-violet-900 border-violet-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={allowQRPh}
                        onChange={(e) => setAllowQRPh(e.target.checked)}
                        className="rounded accent-violet-600"
                      />
                      <div>
                        <span className="font-bold text-xs">QR Ph Code</span>
                        <span className="text-[9px] block text-slate-400">Standard PH QR Code</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Widget Stylings */}
                <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-205 pb-2">
                    <Palette className="w-4 h-4 text-slate-500" />
                    Embedded Storefront Widget Visual Stylings
                  </h4>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                      Floating Launcher Text
                    </label>
                    <input
                      type="text"
                      value={widgetLauncherText}
                      onChange={(e) => setWidgetLauncherText(e.target.value)}
                      className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-xl"
                      placeholder="e.g. 🇵🇭 Earn Rewards"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Primary Widget Brand Color (HEX)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={widgetThemeColor}
                          onChange={(e) => setWidgetThemeColor(e.target.value)}
                          className="w-10 h-8 border border-slate-300 rounded-lg shrink-0 cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={widgetThemeColor}
                          onChange={(e) => setWidgetThemeColor(e.target.value)}
                          className="w-full bg-white text-slate-800 py-1.5 px-3 border border-slate-250 font-mono uppercase text-xs rounded-xl"
                          placeholder="#4F46E5"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Storefront Anchor Position
                      </label>
                      <select
                        value={widgetPosition}
                        onChange={(e) => setWidgetPosition(e.target.value as any)}
                        className="w-full bg-white text-slate-850 py-2 px-3 border border-slate-250 rounded-xl focus:outline-hidden"
                      >
                        <option value="bottom-right">Bottom Right of Web Screen</option>
                        <option value="bottom-left">Bottom Left of Web Screen</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={showWelcomeBubble}
                      onChange={(e) => setShowWelcomeBubble(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="text-slate-600 font-semibold select-none">
                      Show initial welcome bubble notification on browser load
                    </span>
                  </label>
                </div>

              </div>

              {/* Right Column: Code Embed & Sandbox or Real Customer Track */}
              <div className="space-y-6">
                
                {/* Shopify Embedded Integration Setup & Live Sandbox Preview or Real Customer Tracking */}
                <div className="bg-white rounded-3xl p-6 border border-slate-205 shadow-xs space-y-6">
                  
                  {!isConnected ? (
                    <>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Code2 className="w-4 h-4 text-indigo-600" />
                      🔌 Shopify Theme Embed Code & Script Installation
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      The floating Points & Cashback client widget is designed specifically for your <strong>Shopify Storefront (buyers' environment)</strong>. It remains completely hidden inside your merchant dashboard app and central portals. Install it on your active shopify site by adding this asynchronous script to your layout:
                    </p>
                  </div>

                  {/* Code Snippet Block */}
                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-2xl overflow-x-auto border border-slate-850 select-all leading-relaxed whitespace-pre-wrap">
{`<!-- Place this code snippet right before the </body> tag inside your Shopify's layout/theme.liquid file -->
<script
  src="https://cdn.artisanrewards.ph/widget/embedded-loyalty.js"
  data-shopify-shop="${shopifyDomain || 'storename.myshopify.com'}"
  data-theme-color="${widgetThemeColor}"
  data-position="${widgetPosition}"
  data-bubble="${showWelcomeBubble}"
  async>
</script>`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `<!-- Place this code snippet right before the </body> tag inside your Shopify's layout/theme.liquid file -->\n<script\n  src="https://cdn.artisanrewards.ph/widget/embedded-loyalty.js"\n  data-shopify-shop="${shopifyDomain || 'storename.myshopify.com'}"\n  data-theme-color="${widgetThemeColor}"\n  data-position="${widgetPosition}"\n  data-bubble="${showWelcomeBubble}"\n  async>\n</script>`;
                        navigator.clipboard.writeText(code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded-lg p-1.5 transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-white/15"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-450">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                          <span>Copy Embed Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Sandbox Container */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-550" />
                          👁️ Storefront Embedded Sandbox (Live Preview Simulator)
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Interact with your loyalty widget as a buyer inside this simulated Shopify Storefront browser frame below:
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-indigo-750 font-mono">LIVE STYLES BOUNDED</span>
                      </div>
                    </div>

                    {/* Mock Browser Frame */}
                    <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs bg-slate-50 flex flex-col relative h-[520px]">
                      
                      {/* Browser URL bar / header */}
                      <div className="bg-slate-50 border-b border-slate-205 px-4 py-3 flex items-center gap-3 shrink-0">
                        {/* Dots */}
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                        </div>
                        {/* URL Bar */}
                        <div className="flex-1 max-w-md bg-white border border-slate-200 rounded-xl px-4 py-1 flex items-center gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono">HTTPS</span>
                          <span className="text-[11px] text-slate-600 font-mono truncate select-all">{shopifyDomain || 'storename.myshopify.com'}/shop/products</span>
                        </div>
                        {/* Status badge */}
                        <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-mono uppercase">Storefront Live</span>
                      </div>

                      {/* Browser Body Area representing a mock layout */}
                      <div className="flex-1 bg-white p-5 overflow-y-auto relative flex flex-col justify-between">
                        <div>
                          {/* Store banner */}
                          <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center bg-slate-50 -mx-5 -mt-5 px-5 py-4">
                            <div className="flex items-center gap-2 mr-2">
                              <span className="text-xl">🎪</span>
                              <div>
                                <span className="font-extrabold text-slate-805 block text-xs tracking-tight">{storeName || 'Artisan Bakery Manila'}</span>
                                <span className="text-[9px] text-slate-400 block font-mono">Craft Bakery Specialty Shop</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-lg font-bold">🛒 Cart (0)</span>
                          </div>

                          {/* Store Mock Content */}
                          <div className="space-y-4">
                            <div>
                              <h6 className="font-bold text-slate-800 text-xs">Recommended Artisan Breads & Pastries</h6>
                              <p className="text-[10px] text-slate-400 mt-0.5">Order below or simulate webhook purchases to see point rewards in the floating widget!</p>
                            </div>

                            {/* Product Grid Mock */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              
                              {/* Item 1 */}
                              <div className="border border-slate-150 p-3 rounded-2xl flex gap-3 bg-white hover:border-slate-300 transition-colors">
                                <span className="text-2xl bg-amber-50 p-2.5 rounded-xl self-center">🥐</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase block w-max font-mono mb-1">P500 Promo</span>
                                  <span className="font-bold text-xs text-slate-805 block truncate">Purple Yam Ube Pandesal Bundle</span>
                                  <span className="text-[10px] text-slate-450 block font-bold font-mono mt-0.5">₱750.00 PHP</span>
                                </div>
                              </div>

                              {/* Item 2 */}
                              <div className="border border-slate-150 p-3 rounded-2xl flex gap-3 bg-white hover:border-slate-300 transition-colors">
                                <span className="text-2xl bg-amber-50 p-2.5 rounded-xl self-center">🍰</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] bg-slate-100 text-slate-650 font-bold px-1.5 py-0.5 rounded uppercase block w-max font-mono mb-1">Bestseller</span>
                                  <span className="font-bold text-xs text-slate-805 block truncate">Leche Flan Custard Bread basket</span>
                                  <span className="text-[10px] text-slate-450 block font-bold font-mono mt-0.5">₱480.00 PHP</span>
                                </div>
                              </div>

                            </div>

                            {/* Informational Hint */}
                            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 text-[11px] text-slate-600 leading-relaxed space-y-1">
                              <p className="font-bold text-slate-850 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                How do customers use this widget on Shopify?
                              </p>
                              <p className="text-slate-550">
                                1. They click the launcher button: <b>"{widgetLauncherText}"</b> to view points.<br/>
                                2. They can directly convert their loyalty balance to local PH Payout channels (GCash, Maya, Bank) right from the floating card.<br/>
                                3. They receive SMTP notifications and check status ledger logs securely inside their viewport.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Inline Storefront widget rendered here exclusively */}
                        <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none">
                          <div className="relative w-full h-full pointer-events-auto overflow-hidden">
                            <StorefrontWidget
                              activeCustomer={customers[0]}
                              customers={customers}
                              pointTransactions={[]}
                              redemptionRequests={redemptionRequests}
                              settings={{
                                storeName,
                                shopifyDomain,
                                apiAccessToken,
                                webhookSecret,
                                pointsPerPesoSpent,
                                minPointsToRedeem,
                                pointsToPesoRate,
                                allowGCash,
                                allowMaya,
                                allowBank,
                                allowQRPh,
                                widgetLauncherText,
                                widgetThemeColor,
                                widgetPosition,
                                showWelcomeBubble
                              }}
                              onAction={onAdminAction}
                              isInline={true}
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* REAL CUSTOMER TRACKING PRODUCTION VIEW */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          🎯 Real-Time Shopify Customer Sync Ledger
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Track real registration logs, points balances, and checkout behaviors live from your active shopify shop storefront.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 bg-emerald-550/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span className="text-[10px] font-extrabold text-emerald-400 font-mono tracking-wider uppercase">LIVE RECORD SYNCHRONIZER</span>
                      </div>
                    </div>

                    {/* Quick Synced Shopify Customer Database card list */}
                    <div className="bg-slate-50/55 rounded-2xl p-5 border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-slate-700 uppercase font-mono tracking-wider">👥 Synced Profiles ({customers.length} Active Accounts)</span>
                        <span className="text-[10px] text-slate-450 font-mono bg-white border border-slate-150 px-2.5 py-1 rounded-lg">Real-Time Sync Activated</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((c) => {
                          const cashEq = c.pointsBalance * pointsToPesoRate;
                          const hasPendingRedemption = redemptionRequests.some(r => r.customerId === c.id && r.status === 'pending');
                          return (
                            <div key={c.id} className="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs p-4 rounded-xl transition-all space-y-3 relative group">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-indigo-650 transition-colors">{c.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono block truncate" title={c.email}>{c.email}</span>
                                </div>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                                  {c.id}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Loyalty Points</span>
                                  <span className="text-xs font-black text-indigo-705 font-mono">{c.pointsBalance} pts</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Cash Value</span>
                                  <span className="text-xs font-black text-emerald-600 font-mono">₱{cashEq.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-1 text-[10px]">
                                <span className="text-slate-450 font-mono truncate max-w-[190px]">
                                  Shopify: {c.shopifyCustomerId.replace('gid://shopify/Customer/', '#')}
                                </span>
                                {hasPendingRedemption ? (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-extrabold uppercase text-[9px] tracking-wide animate-pulse">
                                    Cashout request
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1 font-mono">
                                    <Check className="w-3.5 h-3.5" /> SYNCED
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Informational Production Guide */}
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                          <Check className="w-4 h-4 text-indigo-600" /> Active Webhook Handlers
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Your live theme extension triggers point earnings whenever Shopify webhook calls are sent to:
                        </p>
                        <pre className="p-2 bg-slate-900 text-slate-200 rounded-lg text-[9px] font-mono leading-tight whitespace-pre-wrap select-all">
                          {`https://${window.location.host}/api/webhooks/orders/paid`}
                        </pre>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                          <Check className="w-4 h-4 text-indigo-600" /> Automated Cashouts
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Once buyers submit points cashouts requests in the storefront widget, they occur in your main Payouts tab instantly. Approve or reject transactions to dispatch real logs securely.
                        </p>
                      </div>
                    </div>

                  </div>
                </>
              )}

            </div>

          </div>

        </div>

      {/* Actions Row */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSettingsSubmit}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                {isSubmitting ? 'Saving changes...' : 'Save Shopify Configuration Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Hard Reset database state */}
        {activeTab === 'reset' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-bold text-rose-700 font-display">Simulated Sandbox Operations</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              When configuring Shopify integrations, resetting database parameters allows you to clean historical ledger balances and restore pre-existing test customer roles ("Juan dela Cruz", "Maria Santos", and "Dr. Jose Rizal") which helps demonstrate checkout limits easily.
            </p>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 mt-4">
              <h4 className="text-xs font-bold text-rose-950 uppercase mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-rose-800" /> Cautionary System warning
              </h4>
              <p className="text-[11px] text-rose-900 mb-3 leading-relaxed">
                Resetting the database sweeps the `data-store.json` database. All points and transactions added via the simulated purchase headers will be cleared. Only seed accounts will be preserved with precalculated balances.
              </p>

              <button
                onClick={handleResetDb}
                disabled={isSubmitting}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isSubmitting ? 'Resetting core store...' : 'Execute Database Hard Reset'}
              </button>
            </div>
          </div>
        )}

      </div>

      {showThemeEditor && (
        <ShopifyThemeEditor
          customers={customers}
          redemptionRequests={redemptionRequests}
          settings={settings}
          onClose={() => setShowThemeEditor(false)}
          onSettingsSaved={() => {
            onAdminAction();
          }}
        />
      )}

    </div>
  );
}
