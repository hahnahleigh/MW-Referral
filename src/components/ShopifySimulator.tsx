import React, { useState } from 'react';
import { Customer, PointTransaction } from '../types.js';
import { ShoppingCart, RefreshCw, UserPlus, HelpCircle, ArrowRightLeft, ShieldAlert, Share2, Award } from 'lucide-react';

interface ShopifySimulatorProps {
  customers: Customer[];
  pointTransactions: PointTransaction[];
  onTriggerWebhook: () => void;
  selectedCustomerId: string;
}

export default function ShopifySimulator({
  customers,
  pointTransactions,
  onTriggerWebhook,
  selectedCustomerId
}: ShopifySimulatorProps) {
  const [purchaseAmount, setPurchaseAmount] = useState<string>('750');
  const [selectedTxnId, setSelectedTxnId] = useState<string>('');
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustInitial, setNewCustInitial] = useState<string>('500');
  
  // Referral state hooks
  const [referredEmail, setReferredEmail] = useState<string>('');
  const [referralPoints, setReferralPoints] = useState<string>('500');
  const [referredByCustId, setReferredByCustId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [isRecommendedProduct, setIsRecommendedProduct] = useState<boolean>(true);

  // Active earned transactions ready to be refund-simulated
  const earnTxns = pointTransactions.filter(t => t.type === 'earn' && t.orderId && !t.orderId.startsWith('refund-'));

  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ text: 'Please enter a valid purchase amount in PHP.', isError: true });
      return;
    }

    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!currentCustomer) {
      setMessage({ text: 'Please select or create an active customer first.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const mockOrderId = Math.floor(1000000 + Math.random() * 9000000);
      const splitName = currentCustomer.name.split(' ');
      const firstName = splitName[0] || 'Anonymous';
      const lastName = splitName.slice(1).join(' ') || '';

      const response = await fetch('/api/webhooks/orders/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mockOrderId,
          total_price: amount.toFixed(2),
          currency: 'PHP',
          customer: {
            id: currentCustomer.shopifyCustomerId.replace('gid://shopify/Customer/', ''),
            email: currentCustomer.email,
            first_name: firstName,
            last_name: lastName
          },
          line_items: [
            {
              title: isRecommendedProduct ? 'Recommended Shopify Premium Glow Bundle' : 'Standard Cart Spend',
              price: amount.toFixed(2),
              sku: isRecommendedProduct ? 'SKU-RECOMMENDED-PROD' : 'SKU-REGULAR'
            }
          ]
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({
          text: `Success! Webhook (orders/paid) processed.${isRecommendedProduct ? ' (Recommended Product purchase triggered!)' : ''} Order #${mockOrderId}. ${data.awardedPoints} Points credited to ${currentCustomer.name}! ${data.message ? data.message : ''}`,
          isError: false
        });
        setPurchaseAmount('750');
        onTriggerWebhook();
      } else {
        setMessage({ text: data.error || 'Failed to simulate purchase Webhook.', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnId) {
      setMessage({ text: 'Please select a historical point-earning transaction to refund.', isError: true });
      return;
    }

    const targetTxn = pointTransactions.find(t => t.id === selectedTxnId);
    if (!targetTxn || !targetTxn.orderId) {
      setMessage({ text: 'Invalid transaction chosen.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/webhooks/orders/refunded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: targetTxn.orderId
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({
          text: `Success! Webhook (orders/refunded) processed. Points reversed for Order #${targetTxn.orderId}. Reclaimed Points: ${data.reversedPoints}!`,
          isError: false
        });
        setSelectedTxnId('');
        onTriggerWebhook();
      } else {
        setMessage({ text: data.message || 'Refund processing skipped or rejected.', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error during refund processing.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail) {
      setMessage({ text: 'Name and email are required to pre-install customer record.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          email: newCustEmail,
          initialPoints: Number(newCustInitial) || 0,
          referredByCustomerId: referredByCustId || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({
          text: `New customer registered: ${data.customer.name} with starter ${data.customer.pointsBalance} pts! ${referredByCustId ? '(Referral bonus of ₱500 credited to referrer)' : ''}`,
          isError: false
        });
        setNewCustName('');
        setNewCustEmail('');
        setNewCustInitial('500');
        setReferredByCustId('');
        onTriggerWebhook();
      } else {
        setMessage({ text: data.error || 'Failed to register customer.', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error register.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referredEmail) {
      setMessage({ text: 'Referral friend email is required to award referrer points.', isError: true });
      return;
    }

    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!currentCustomer) {
      setMessage({ text: 'Please select a referrer customer from the selector above first.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/referrals/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: currentCustomer.id,
          referredEmail,
          points: Number(referralPoints) || 500
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({
          text: `Success! Referral treated. Referrer customer ${currentCustomer.name} awarded ${data.awardedPoints} points for successfully inviting ${referredEmail}!`,
          isError: false
        });
        setReferredEmail('');
        onTriggerWebhook();
      } else {
        setMessage({ text: data.error || 'Failed to award referral points.', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error during referral simulation.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Shopify Events Simulator</h2>
          <p className="text-xs text-slate-500">Simulate webhooks sent from the Shopify store in real-time</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm mb-5 ${message.isError ? 'bg-rose-50 text-rose-800 border border-rose-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
          <div className="flex gap-2">
            <span className="font-semibold">{message.isError ? 'Error:' : 'System Alert:'}</span>
            <span className="flex-1">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Simulate Purchase */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-mono">
                Webhook: Order Paid
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Simulate Order Paid</h3>
            <p className="text-xs text-gray-500 mb-4">
              Awards a flat loyalty credit of <strong className="text-emerald-700 font-bold">1,600 Points (₱1,600.00 PHP)</strong> per store checkout instantly!
            </p>

            <form onSubmit={handleSimulatePurchase} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference Cart Amount
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="block w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter Order amount"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ordered Item Type
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-150 rounded-lg p-2 cursor-pointer hover:bg-emerald-50 transition-colors">
                    <input
                      type="radio"
                      name="itemType"
                      checked={isRecommendedProduct}
                      onChange={() => setIsRecommendedProduct(true)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="text-[11px] leading-tight">
                      <p className="font-bold text-emerald-900">🎁 Recommended Product</p>
                      <p className="text-slate-500">Unlocks ₱500 referral credit for the referrer account.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="radio"
                      name="itemType"
                      checked={!isRecommendedProduct}
                      onChange={() => setIsRecommendedProduct(false)}
                      className="mt-1 text-slate-600 focus:ring-slate-500 cursor-pointer"
                    />
                    <div className="text-[11px] leading-tight">
                      <p className="font-semibold text-slate-800">🛒 General Store Item</p>
                      <p className="text-slate-400 font-normal">Regular buyer award only (No referrer reward).</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-gray-100 text-[11px] text-gray-600 mb-2">
                <span className="font-semibold text-gray-800">Assign points to:</span>{' '}
                {currentCustomer ? (
                  <span className="text-emerald-700 font-bold block truncate">{currentCustomer.name}</span>
                ) : (
                  <span className="text-rose-500 block">None selected</span>
                )}
              </div>
            </form>
          </div>

          <button
            onClick={handleSimulatePurchase}
            disabled={isSubmitting || !currentCustomer}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            Simulate Purchase (+1,600 pts)
          </button>
        </div>

        {/* 2. Simulate Refund */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Step 2: Orders / Refunded
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Simulate Order Refund</h3>
            <p className="text-xs text-gray-500 mb-4">
              Reclaim previously issued points immediately from account ledger to model returns.
            </p>

            <form onSubmit={handleSimulateRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Eligible Earned Orders
                </label>
                <select
                  value={selectedTxnId}
                  onChange={(e) => setSelectedTxnId(e.target.value)}
                  className="block w-full py-1.5 px-3 bg-white border border-gray-200 rounded-md text-xs focus:outline-hidden focus:border-red-500"
                >
                  <option value="">-- Select Paid Transaction --</option>
                  {earnTxns.map(t => {
                    const cust = customers.find(c => c.id === t.customerId);
                    return (
                      <option key={t.id} value={t.id}>
                        {cust?.name || 'Customer'}: +{t.points} pts (Order #{t.orderId})
                      </option>
                    );
                  })}
                </select>
              </div>

              {earnTxns.length === 0 && (
                <p className="text-xs text-rose-600 bg-rose-50/50 p-2 rounded">
                  No point transactions with authentic order IDs exist yet. Create a transaction on the left first.
                </p>
              )}
            </form>
          </div>

          <button
            onClick={handleSimulateRefund}
            disabled={isSubmitting || !selectedTxnId}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            Trigger orders/refunded (-points)
          </button>
        </div>

        {/* 3. Simulate Referral */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-mono">
                Referral Invite
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Simulate Referral</h3>
            <p className="text-xs text-gray-500 mb-4">
              Reward the selected customer for referring a friend who registers or gets a custom payout.
            </p>

            <form onSubmit={handleSimulateReferral} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-750 mb-1 uppercase tracking-wider">
                  Referred Friend's Email
                </label>
                <input
                  type="email"
                  value={referredEmail}
                  onChange={(e) => setReferredEmail(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-hidden focus:border-indigo-550"
                  placeholder="friend@gmaill.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-750 mb-1 uppercase tracking-wider">
                  Referral Reward Points (PHP value equivalent)
                </label>
                <select
                  value={referralPoints}
                  onChange={(e) => setReferralPoints(e.target.value)}
                  className="block w-full py-1.5 px-2 bg-white border border-gray-200 rounded-md text-xs"
                >
                  <option value="500">500 Points (₱500.00)</option>
                  <option value="1000">1,000 Points (₱1,000.00)</option>
                  <option value="1500">1,500 Points (₱1,500.00)</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded border border-gray-100 text-[11px] text-gray-600">
                <span className="font-semibold text-gray-800">Referrer earner:</span>{' '}
                {currentCustomer ? (
                  <span className="text-indigo-700 font-bold block truncate">{currentCustomer.name}</span>
                ) : (
                  <span className="text-rose-500 block">None selected</span>
                )}
              </div>
            </form>
          </div>

          <button
            onClick={handleSimulateReferral}
            disabled={isSubmitting || !currentCustomer || !referredEmail}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Trigger Referral Bonus
          </button>
        </div>

        {/* 4. Register Customer */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Admin Custom Client
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Add Simulated Buyer</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add new Philippine user account immediately to the shop database.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="block w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Josefa Abad"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="block w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                    placeholder="abad@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700">Starter Points</label>
                  <input
                    type="number"
                    value={newCustInitial}
                    onChange={(e) => setNewCustInitial(e.target.value)}
                    className="block w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                    placeholder="Starter Points"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700">Referred By (Optional)</label>
                  <select
                    value={referredByCustId}
                    onChange={(e) => setReferredByCustId(e.target.value)}
                    className="block w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                  >
                    <option value="">None (Organic)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>

          <button
            onClick={handleCreateCustomer}
            disabled={isSubmitting || !newCustName || !newCustEmail}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            Seed New Account
          </button>
        </div>

      </div>

      <div className="mt-5 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 flex gap-2">
        <ShieldAlert className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-[11px] text-emerald-900 leading-relaxed">
          <strong>Philippine Compliance Note:</strong> In accordance with local digital merchant policies, 1 Point earns ₱1.00 PHP Cash value, which is sent back to customer GCash/Maya verified wallets. Audit tracking safeguards payouts with double redemption prevention checks.
        </div>
      </div>
    </div>
  );
}
