import React, { useState } from 'react';
import { Customer, PointTransaction, RedemptionRequest, PayoutMethod, MockEmail } from '../types.js';
import { Coins, Wallet, Send, Percent, History, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Landmark, Share2, Gift, Copy, Check, Mail, ChevronDown, ChevronUp, Users, QrCode } from 'lucide-react';

interface CustomerDashboardProps {
  customer: Customer;
  pointTransactions: PointTransaction[];
  redemptionRequests: RedemptionRequest[];
  mockEmails?: MockEmail[];
  referrals?: any[];
  onRedeemSuccess: () => void;
}

function MailItem({ email }: { email: MockEmail; key?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`p-4 hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50/50' : ''}`}>
      <div className="flex items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full ${email.status === 'Approved' ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{email.subject}</p>
            <p className="text-[10px] text-slate-400 font-mono">
              Sent: {new Date(email.sentAt).toLocaleString()} • Recipient: {email.recipientEmail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full font-mono ${
            email.status === 'Approved' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border border-rose-105'
          }`}>
            {email.status}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans bg-white p-3.5 rounded-xl border border-slate-100 shadow-inner leading-relaxed">
            {email.body}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard({
  customer,
  pointTransactions,
  redemptionRequests,
  mockEmails = [],
  referrals = [],
  onRedeemSuccess
}: CustomerDashboardProps) {
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('GCash');
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('100');
  
  // Form fields
  const [accountName, setAccountName] = useState<string>(customer.name);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('BDO Unibank');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Conversion rates (1 Points = ₱1 PHP)
  const cashEquivalent = customer.pointsBalance; // Formula: (points / 1) * 1

  const [copied, setCopied] = useState<boolean>(false);
  const handleCopyLink = () => {
    const link = `https://referral.appstle.com/9iz7wyll7pc1byum?ref=${customer.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const pointsNum = parseInt(pointsToRedeem, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      setErrorMsg('Please select a valid whole number of points.');
      return;
    }

    // 1. Validation: minimum redemption of 100 points
    if (pointsNum < 100) {
      setErrorMsg('The minimum redemption limit is 100 points.');
      return;
    }

    // 2. Validation: check if they have enough points
    if (pointsNum > customer.pointsBalance) {
      setErrorMsg(`Insufficient points. You only have ${customer.pointsBalance} points available.`);
      return;
    }

    // 3. Number formatting checks for PH mobile wallets
    if ((payoutMethod === 'GCash' || payoutMethod === 'Maya') && !/^09\d{9}$/.test(accountNumber.trim())) {
      setErrorMsg(`Invalid mobile wallet number. PH mobile numbers must follow the 11-digit format (e.g., 09171234567).`);
      return;
    }

    if (payoutMethod === 'QRPh' && !/^\d{5,16}$/.test(accountNumber.trim().replace(/[-\s]/g, ''))) {
      setErrorMsg(`Invalid account format. Associated QR Ph account/mobile number must be between 5 and 16 digits.`);
      return;
    }

    if (!accountName.trim() || !accountNumber.trim()) {
      setErrorMsg('All payout account details are required.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        customerId: customer.id,
        points: pointsNum,
        payoutMethod,
        payoutDetails: {
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          ...(payoutMethod === 'Bank' ? { bankName } : {})
        }
      };

      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`₱${pointsNum}.00 PHP payout request created! 100% of the redeemed points have been deferred to security review storage.`);
        setPointsToRedeem('100');
        setAccountNumber('');
        onRedeemSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to submit redemption request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 uppercase">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid Out
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase">
            <AlertTriangle className="w-3.5 h-3.5" /> Rejected (Refunded)
          </span>
        );
      default:
        return null;
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

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Points Display Balance */}
        <div className="bg-linear-to-br from-indigo-900 via-slate-900 to-zinc-950 text-white rounded-3xl p-6 shadow-xs relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
            <Percent className="w-40 h-40 text-indigo-400" />
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider font-mono">Loyalty Stars Balance</span>
            <span className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors border border-white/5">
              <Wallet className="w-4 h-4 text-indigo-300" />
            </span>
          </div>
          <p className="text-4xl font-black font-display leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            {customer.pointsBalance.toLocaleString()}
          </p>
          <span className="text-indigo-200/80 text-xs">Points earned from Shopify paid orders</span>
        </div>

        {/* Cash Equivalent Balance */}
        <div className="bg-linear-to-br from-slate-900 via-emerald-950 to-zinc-950 text-white rounded-3xl p-6 shadow-xs relative overflow-hidden border border-emerald-900">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
            <Coins className="w-40 h-40 text-emerald-500" />
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider font-mono">Cash Value equivalent</span>
            <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/60 font-mono">₱1 = 1 Point</span>
          </div>
          <p className="text-4xl font-black font-display leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-300">
            ₱{cashEquivalent.toLocaleString()}.00
          </p>
          <span className="text-emerald-300/80 text-xs">100% convertible to PHP payouts</span>
        </div>

        {/* Digital Wallet Badge */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-slate-350 transition-colors duration-200">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-mono">Account Identity</span>
              <span className="text-[10px] text-indigo-700 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">SHPFY ID</span>
            </div>
            <h3 className="text-base font-bold text-slate-850 leading-tight">{customer.name}</h3>
            <p className="text-xs text-slate-500">{customer.email}</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
            <span>Linked to Shopify Registry</span>
          </div>
        </div>

      </div>

      {/* Referral Hub: Invite & Earn Program */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50/50 rounded-3xl border border-indigo-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase font-mono">
              <Gift className="w-3.5 h-3.5" /> Refer & Earn Program
            </div>
            <h2 className="text-xl font-bold text-slate-800">Invite Friends, Earn ₱500.00 PHP referral bonus</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Share your custom referral invite URL with partners or friends. When they register and purchase the <strong className="text-indigo-805">Recommended Product (Shopify Premium Glow Bundle)</strong> on the Shopify store, you earn a flat <strong className="text-indigo-800">500 Loyalty points (value of ₱500 PHP)</strong> credited instantly to your available balance!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs flex-1 max-w-md w-full">
            <label className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">Your Unique Referral Invite Link</label>
            <div className="flex gap-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-650 font-mono flex-1 select-all truncate">
                https://referral.appstle.com/9iz7wyll7pc1byum?ref={customer.id}
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Your referral stats:</span>
              <span className="font-bold text-indigo-600 font-mono">
                {pointTransactions.filter(t => t.source === 'referral').length} friends invited • ₱{pointTransactions.filter(t => t.source === 'referral').reduce((sum, t) => sum + t.points, 0).toLocaleString()} PHP earned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Analytics Tracking System */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600 animate-pulse" /> Referral Activity & Status Tracking
            </h3>
            <p className="text-[10px] text-slate-500">Track every friend who used your link, their registry status, and points earned.</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
            {referrals.length} friend{referrals.length !== 1 ? 's' : ''} tracked
          </span>
        </div>

        {referrals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700 mb-0.5">No referrals tracked yet</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Share your invite link above! When friends register or purchase on the store, they will automatically populate here so you can trace your cash rewards.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-6">ID / Code</th>
                  <th className="py-3 px-6">Referred Friend (Account)</th>
                  <th className="py-3 px-6">Friend's wallet Balance</th>
                  <th className="py-3 px-6">Your Incentive Reward</th>
                  <th className="py-3 px-6">Reward Timestamp</th>
                  <th className="py-3 px-6 text-right">Shop Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-[10px] text-slate-450">
                      {ref.id.startsWith('ref-pending-') ? 'PENDINGSYNC' : ref.id}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-705 flex items-center gap-1.5">
                        <span>{ref.name || 'Anonymous User'}</span>
                        {ref.status === 'active' ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                            ✓ Verified Referral
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-blue-200">
                            👤 Account Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{ref.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ₱{(ref.friendPointsBalance !== undefined ? ref.friendPointsBalance : 100).toFixed(2)} PHP
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {ref.status === 'active' ? (
                        <span className="font-bold text-emerald-600 font-mono bg-emerald-50/80 px-2.5 py-0.5 rounded border border-emerald-100">
                          + {ref.pointsEarned} pts (₱500)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 font-medium animate-pulse">
                          <Clock className="w-2.5 h-2.5" /> ₱500 pending welcome pack purchase
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 text-[10px]">
                      {new Date(ref.dateRewarded).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {ref.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-2.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active (Glow Bundle Purchased)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-2.5 py-0.5">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Recommended Purchase
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

      {/* Mock Email Alerts Mailbox */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <Mail className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">📬 Customer Email Inbox (Live Simulation)</h2>
              <p className="text-[10px] text-slate-400">Mock email confirmations sent on redemption status updates ('Approved' or 'Rejected')</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-900 font-bold shrink-0">
            {mockEmails.length} Email{mockEmails.length !== 1 ? 's' : ''} Received
          </span>
        </div>

        {mockEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-550 text-xs">
            <p className="font-semibold mb-1 text-slate-700">Inbox is empty</p>
            <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
              Request a points redemption cash out below. When the merchant administrator approves or rejects it in the Admin Control Desk, a dynamic confirmation email alert will trigger and render instantly here!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {mockEmails.map((email) => (
              <MailItem key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>

      {/* 2. Redemption Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Redemption Box widget */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 font-display">Redeem Points for Cash payouts</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl mb-4 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl mb-4 font-medium leading-relaxed">
              🎉 {successMsg}
            </div>
          )}

          {customer.pointsBalance < 100 ? (
            <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-900 rounded-xl mb-5 text-xs flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Under Minimum Limit Threshold</p>
                <p className="leading-normal">
                  Our digital loyalty rules require a minimum of <strong>100 points (₱100 PHP)</strong> before you can trigger a transfer. Keep purchasing items from the Shopify checkout to earn further points automatically!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              
              {/* Method switch */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Select Philippine Payout Destination</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('GCash'); setAccountNumber(''); }}
                    className={`py-3 px-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      payoutMethod === 'GCash'
                        ? 'border-blue-600 bg-blue-50/30 text-gcash-blue font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-650'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-gcash-blue" />
                    <span className="text-xs">GCash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('Maya'); setAccountNumber(''); }}
                    className={`py-3 px-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      payoutMethod === 'Maya'
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-650'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-900 flex items-center justify-center text-[10px] font-black">M</span>
                    <span className="text-xs">PayMaya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('QRPh'); setAccountNumber(''); setBankName('GCash (QR Ph)'); }}
                    className={`py-3 px-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      payoutMethod === 'QRPh'
                        ? 'border-rose-500 bg-rose-50/30 text-rose-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-650'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-rose-600" />
                    <span className="text-xs">QR Ph</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPayoutMethod('Bank'); setAccountNumber(''); setBankName('BDO Unibank'); }}
                    className={`py-3 px-4 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      payoutMethod === 'Bank'
                        ? 'border-slate-700 bg-slate-100 text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-650'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-slate-700" />
                    <span className="text-xs">Local Bank</span>
                  </button>
                </div>
              </div>

              {/* Point Allocation Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Points to Convert</label>
                  <div className="relative rounded-lg shadow-xs">
                    <input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(e.target.value)}
                      max={customer.pointsBalance}
                      min="100"
                      className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium font-mono"
                      placeholder="e.g. 150"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs">pts</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Cash proceeds equivalent: <strong>₱{parseInt(pointsToRedeem || '0', 10) || 0} PHP</strong></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    placeholder="Enter Registered Legal Name"
                    required
                  />
                </div>
              </div>

              {/* Destination inputs based on method Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payoutMethod === 'Bank' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Bank Union</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        <option value="BDO Unibank">BDO Unibank (Banco de Oro)</option>
                        <option value="BPI (Bank of Philippine Islands)">BPI (Bank of Philippine Islands)</option>
                        <option value="Metrobank">Metrobank (Metropolitan Bank)</option>
                        <option value="Landbank of the Philippines">Landbank</option>
                        <option value="UnionBank of the Philippines">UnionBank</option>
                        <option value="RCBC">RCBC (Yuchengco Group)</option>
                        <option value="Security Bank">Security Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        placeholder="e.g., 001234567890"
                        required
                      />
                    </div>
                  </>
                ) : payoutMethod === 'QRPh' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">QR Ph Provider Bank/Wallet</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        <option value="GCash (QR Ph)">GCash (via QR Ph)</option>
                        <option value="Maya (QR Ph)">Maya (via QR Ph)</option>
                        <option value="GoTyme Bank (QR Ph)">GoTyme Bank (via QR Ph)</option>
                        <option value="UnionBank (QR Ph)">UnionBank (via QR Ph)</option>
                        <option value="BDO Unibank (QR Ph)">BDO Unibank (via QR Ph)</option>
                        <option value="BPI (QR Ph)">BPI (via QR Ph)</option>
                        <option value="SeaBank (QR Ph)">SeaBank (via QR Ph)</option>
                        <option value="GrabPay (QR Ph)">GrabPay (via QR Ph)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">QR Ph Mobile / Account No.</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                        placeholder="e.g. 09171234567"
                        required
                      />
                    </div>

                    {/* Fun QR Ph styled generated mockup section */}
                    <div className="col-span-1 md:col-span-2 bg-linear-to-r from-red-50/60 via-white to-blue-50/60 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center mt-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 via-yellow-400 to-red-600"></div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">Simulated National QR Ph Merchant Code</p>
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs relative flex flex-col items-center justify-center">
                        {/* Mock QR Code Pattern with Philippine national palette center */}
                        <div className="w-28 h-28 bg-slate-100 flex items-center justify-center relative border border-slate-200 rounded-lg">
                          <QrCode className="w-24 h-24 text-slate-800" />
                          <div className="absolute inset-0 m-auto w-7 h-7 bg-white rounded-md border border-slate-300 flex items-center justify-center shadow-xs">
                            {/* Inner custom Ph flag palette representation */}
                            <div className="grid grid-cols-2 grid-rows-2 w-5 h-5 rounded-sm overflow-hidden">
                              <div className="bg-blue-600"></div>
                              <div className="bg-yellow-400 flex items-center justify-center text-[5px] text-white font-bold font-mono">★</div>
                              <div className="bg-red-600 col-span-2"></div>
                            </div>
                          </div>
                        </div>
                        <span className="mt-2 text-[9px] font-mono text-slate-500 font-semibold uppercase">QR Ph Code Generator</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 max-w-sm font-sans">
                        Instantly generates a unified QR Ph code for <strong>{accountName || 'Customer'}</strong> mapped to <strong>{bankName || 'GCash (QR Ph)'}</strong> (Account Number: {accountNumber || 'Pending Input'}). Any Philippine banking or wallet app can scan this code to distribute funds!
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {payoutMethod} Registered Mobile Number
                    </label>
                    <div className="relative rounded-lg shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-gray-400 font-mono">
                        PH (+63)
                      </div>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="block w-full pl-22 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                        placeholder="e.g. 09171234567"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Requires 11-digit verified GCash/Maya mobile number</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? 'Processing security validation...' : `Trigger Cash Payout (₱${pointsToRedeem} PHP)`}
                </button>
              </div>

            </form>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4 flex items-center gap-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Secure encryption in operation. Double redemption and concurrent API loops are prevented.</span>
          </div>

        </div>

        {/* FAQ list for Filipino target markets */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Percent className="w-4 h-4 text-indigo-600" /> Payout Mechanics
            </h3>
            
            <ul className="space-y-4 text-xs text-slate-650 leading-relaxed">
              <li>
                <strong className="block text-slate-800 font-bold mb-0.5">🌟 Real PHP Conversion</strong>
                Every single point you earn represents exactly ₱1.00 Philippine Pesos. Earn with any paid order checkout.
              </li>
              <li>
                <strong className="block text-slate-800 font-bold mb-0.5">💸 Minimum Payout Limit</strong>
                Redemption limits are capped at a minimum value of 100 points per event. Standard digital ledger rule.
              </li>
              <li>
                <strong className="block text-slate-800 font-bold mb-0.5">🚀 Payout Processing Speed</strong>
                Approved cash transfers reach your GCash number, Maya profile, or Bank instantly within 24 working hours.
              </li>
              <li>
                <strong className="block text-slate-800 font-bold mb-0.5">🔒 Double-Redemption Defence</strong>
                A client cannot trigger double payout payloads and cannot spend points that are locked in pending approvals.
              </li>
            </ul>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
            Current PH local time: {new Date().toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
          </div>
        </div>

      </div>

      {/* 3. Transaction History & Redemptions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ledger point transactions list */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Reward Point Transactions Ledger</h3>
            </div>
            <span className="text-[10px] text-indigo-700 font-mono bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full font-bold">{pointTransactions.length} Items</span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            {pointTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-450">
                No point transactions exist in this ledger registry yet.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-550 text-left border-b border-slate-100 pb-2">
                    <th className="font-semibold py-2">Date</th>
                    <th className="font-semibold py-2">Txn Category</th>
                    <th className="font-semibold py-2 text-right">Points Delta</th>
                    <th className="font-semibold py-2 text-right">Cash Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pointTransactions.map((t) => {
                    const isPositive = t.points > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-2 text-slate-450 font-mono text-[10px]">{formatDateTime(t.createdAt)}</td>
                        <td className="py-2 font-medium">
                          {t.type === 'earn' ? (
                            t.source === 'referral' ? (
                              <span className="text-indigo-800 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-semibold text-[11px] inline-flex items-center gap-1">
                                <Gift className="w-3 h-3 text-indigo-500" /> Referral reward: {t.referredEmail || 'Invited friend'}
                              </span>
                            ) : (
                              <span className="text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                                Store Purchase {t.orderId ? `#${t.orderId}` : ''}
                              </span>
                            )
                          ) : (
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                              Cash Out Payout
                            </span>
                          )}
                        </td>
                        <td className={`py-2 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? '+' : ''}{t.points.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-slate-500 font-mono">
                          ₱{t.cashAmount.toLocaleString()}.00
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cash Payout Requests Progress Tracker */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-800">Your Cash Payout Requests</h3>
            </div>
            <span className="text-[10px] text-violet-700 font-mono bg-violet-50 border border-violet-100/50 px-2.5 py-0.5 rounded-full font-bold">{redemptionRequests.length} Events</span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            {redemptionRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-450">
                You haven't initiated any cash conversion events yet.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-550 text-left border-b border-slate-100 pb-2">
                    <th className="font-semibold py-2">Requested On</th>
                    <th className="font-semibold py-2">Transfer Destination</th>
                    <th className="font-semibold py-2 text-right">Amount</th>
                    <th className="font-semibold py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 col-span-4">
                  {redemptionRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-2 text-slate-450 font-mono text-[10px]">{formatDateTime(r.createdAt)}</td>
                      <td className="py-2">
                        <div className="font-semibold text-slate-800">{r.payoutMethod}</div>
                        <div className="text-[10px] text-slate-450 font-mono">{r.payoutDetails.accountNumber}</div>
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono">
                        ₱{r.cashAmount.toLocaleString()}.00
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {getStatusBadge(r.status)}
                          {r.remarks && (
                            <span className="text-[9px] text-slate-400 leading-tight italic max-w-[130px] truncate block" title={r.remarks}>
                              "{r.remarks}"
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
