import React, { useState } from 'react';
import { Customer, RedemptionRequest, AuditLog, MockEmail } from '../types.js';
import { ShieldCheck, Users, Banknote, ClipboardList, Check, X, FileText, RefreshCw, Sparkles, Database, Mail, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminDashboardProps {
  customers: Customer[];
  redemptionRequests: RedemptionRequest[];
  auditLogs: AuditLog[];
  mockEmails?: MockEmail[];
  referrals?: any[];
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
  onAdminAction
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'payouts' | 'customers' | 'audit' | 'emails' | 'referrals' | 'reset'>('payouts');
  
  // Action control states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [refNumbers, setRefNumbers] = useState<{ [key: string]: string }>({});

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

    </div>
  );
}
