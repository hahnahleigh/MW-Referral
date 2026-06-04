import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, PointTransaction, RedemptionRequest, ShopifySettings, PayoutMethod } from '../types.js';
import { Gift, X, Sparkles, Send, Coins, History, Copy, Check, Info, Landmark, HelpCircle } from 'lucide-react';

interface StorefrontWidgetProps {
  activeCustomer: Customer | undefined;
  customers: Customer[];
  pointTransactions: PointTransaction[];
  redemptionRequests: RedemptionRequest[];
  settings: ShopifySettings;
  onAction: () => void;
  isInline?: boolean;
}

export default function StorefrontWidget({
  activeCustomer,
  customers,
  pointTransactions,
  redemptionRequests,
  settings,
  onAction,
  isInline = false
}: StorefrontWidgetProps) {
  // Widget open state
  const [isOpen, setIsOpen] = useState(false);
  // Selected tab within widget
  const [activeTab, setActiveTab] = useState<'home' | 'redeem' | 'history'>('home');
  // Copy state
  const [copied, setCopied] = useState(false);

  // Form states for in-widget redemption
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('100');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('GCash');
  const [accountName, setAccountName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('BDO Unibank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine which customer to display:
  // If active role is 'admin', we simulate the premium view using the first customer
  const customer = activeCustomer || customers[0];

  // If app is disabled via Shopify Theme App Embed settings, do not render to buyers unless we are designing inside customizer
  if (settings.appEmbedEnabled === false && !isInline) {
    return null;
  }

  if (!customer) return null;

  // Sync default account name
  React.useEffect(() => {
    if (customer) {
      setAccountName(customer.name);
    }
  }, [customer]);

  const cashEquivalent = customer.pointsBalance * settings.pointsToPesoRate;

  const handleCopyCode = () => {
    const code = `REF-${customer.id}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWidgetRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const pointsNum = parseInt(pointsToRedeem, 10);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      setErrorMsg('Please enter a valid points amount.');
      return;
    }

    if (pointsNum < settings.minPointsToRedeem) {
      setErrorMsg(`The minimum redemption limit is ${settings.minPointsToRedeem} points.`);
      return;
    }

    if (pointsNum > customer.pointsBalance) {
      setErrorMsg(`Insufficient points. You only have ${customer.pointsBalance} points.`);
      return;
    }

    if (!accountName.trim() || !accountNumber.trim()) {
      setErrorMsg('Account name and mobile/account number are required.');
      return;
    }

    if ((payoutMethod === 'GCash' || payoutMethod === 'Maya') && !/^09\d{9}$/.test(accountNumber.trim())) {
      setErrorMsg('Please enter a valid PH 11-digit mobile number (e.g. 09171234567).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          points: pointsNum,
          payoutMethod,
          payoutDetails: {
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            ...(payoutMethod === 'Bank' ? { bankName } : {})
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Awesome! Requested checkout payout for ₱${pointsNum * settings.pointsToPesoRate}.00 PHP successfully!`);
        setPointsToRedeem('100');
        setAccountNumber('');
        onAction();
      } else {
        setErrorMsg(data.error || 'Failed to submit redemption.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter local customer logs
  const customerTxns = pointTransactions.filter(t => t.customerId === customer.id);
  const customerRedemptions = redemptionRequests.filter(r => r.customerId === customer.id);

  // Position class
  const positionClass = settings.widgetPosition === 'bottom-left' 
    ? 'left-6 bottom-6' 
    : 'right-6 bottom-6';

  const cardAlignment = settings.widgetPosition === 'bottom-left'
    ? 'left-0 origin-bottom-left'
    : 'right-0 origin-bottom-right';

  return (
    <div id="shopify-storefront-widget" className={`${isInline ? 'absolute' : 'fixed z-50'} flex flex-col items-end ${positionClass}`}>
      
      {/* 1. Interactive Flyout Widget Panel Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`absolute bottom-16 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-205 flex flex-col overflow-hidden max-h-[560px] ${cardAlignment} border-slate-200`}
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Widget Banner / Header with Customized Brand Color Theme */}
            <div 
              className="p-5 text-white flex flex-col relative overflow-hidden"
              style={{ backgroundColor: settings.widgetThemeColor || '#4f46e5' }}
            >
              {/* Subtle background abstract circles */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-5 -mt-5" />
              <div className="absolute left-1/3 bottom-0 w-16 h-16 bg-white/5 rounded-full -mb-5" />

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-xs">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight font-display text-white">
                      {settings.storeName || 'Artisan Rewards'}
                    </h3>
                    <p className="text-[10px] text-white/80">Affiliate Storefront Loyalty Widget</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Account Summary Header */}
              <div className="mt-2 bg-black/15 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-mono tracking-widest text-white/70">Invited Guest state</p>
                    <p className="text-xs font-bold text-white truncate max-w-[150px]">{customer.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/80 font-mono block">Available Balance</span>
                    <span className="text-lg font-extrabold text-white tracking-tight flex items-center justify-end gap-1 font-display">
                      <Coins className="w-4 h-4 text-amber-300 shrink-0" />
                      {customer.pointsBalance.toLocaleString()} <span className="text-xs font-normal">pts</span>
                    </span>
                  </div>
                </div>
                
                {/* Visual PHP equivalent calculation */}
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-white/90">
                  <span>Cash Out Value:</span>
                  <span className="font-bold text-amber-300">₱{cashEquivalent.toLocaleString()}.00 PHP</span>
                </div>
              </div>

              {/* Warning Banner if looking as merchant */}
              {!activeCustomer && (
                <div className="mt-2 px-2 py-1 bg-yellow-500/20 text-[9px] text-yellow-200 rounded-md border border-yellow-500/30 text-center font-semibold font-mono">
                  🚨 Admins Preview Mode (using Customer #1 profile)
                </div>
              )}
            </div>

            {/* Simulated Storefront Web Widget Core Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-3">
              <button
                onClick={() => { setActiveTab('home'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'home' 
                    ? 'text-slate-900 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
                style={{ borderBottomColor: activeTab === 'home' ? settings.widgetThemeColor : 'transparent' }}
              >
                Promos & Perks
              </button>
              <button
                onClick={() => { setActiveTab('redeem'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'redeem' 
                    ? 'text-slate-900 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
                style={{ borderBottomColor: activeTab === 'redeem' ? settings.widgetThemeColor : 'transparent' }}
              >
                Claim Payout
              </button>
              <button
                onClick={() => { setActiveTab('history'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'history' 
                    ? 'text-slate-900 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
                style={{ borderBottomColor: activeTab === 'history' ? settings.widgetThemeColor : 'transparent' }}
              >
                My Ledger
              </button>
            </div>

            {/* Widget Main Tab Content Scrawler */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[340px]">
              
              {/* Tab 1: Promos & Perks */}
              {activeTab === 'home' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* PHP Conversion logic summary */}
                  <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex gap-3 text-xs text-slate-700">
                    <div className="text-indigo-600 p-0.5 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Earn Flat 1,600 Points per Order!</p>
                      <p className="text-slate-500 mt-0.5 mt-1">Every premium checkout awards 1,600 loyalty points automatically. Point valuation exchange: <span className="font-semibold text-slate-800">1 loyalty point = ₱{settings.pointsToPesoRate}.00 PHP cash back</span>.</p>
                    </div>
                  </div>

                  {/* Copy referral codes block */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <Send className="w-3.5 h-3.5 text-indigo-500" />
                      Affiliate Referral Program
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      Invite a friend! When they buy the recommended item, you unlock a whopping <span className="font-bold text-slate-800">₱500.05 PHP</span> bonus.
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 select-all truncate">
                        REF-{customer.id}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-white cursor-pointer`}
                        style={{ backgroundColor: settings.widgetThemeColor }}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* PHP minimum limits alert */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-150 justify-center">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Minimum amount required to cache out to PH wallets is <b>{settings.minPointsToRedeem} points</b>.</span>
                  </div>

                </div>
              )}

              {/* Tab 2: Payout Redemptions */}
              {activeTab === 'redeem' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  
                  {successMsg ? (
                    <div className="p-4 bg-emerald-55 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100/60 text-xs text-center space-y-2">
                      <p className="font-semibold">{successMsg}</p>
                      <button 
                        onClick={() => { setSuccessMsg(null); }}
                        className="text-[11px] text-emerald-900 underline font-bold"
                      >
                        File another cash out
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleWidgetRedeem} className="space-y-3">
                      
                      {errorMsg && (
                        <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-[11px] border border-rose-100 font-semibold">
                          {errorMsg}
                        </div>
                      )}

                      {/* Quantum input */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Points to Convert</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={pointsToRedeem}
                            onChange={(e) => setPointsToRedeem(e.target.value)}
                            min={settings.minPointsToRedeem}
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs py-2 px-3 pl-8 rounded-xl border border-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            placeholder={`${settings.minPointsToRedeem} points minimum`}
                          />
                          <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <div className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                            ≈ ₱{Number(pointsToRedeem) * settings.pointsToPesoRate || 0} PHP
                          </div>
                        </div>
                      </div>

                      {/* Payout method choice */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">PSP Target Wallet</label>
                        <div className="grid grid-cols-3 gap-2">
                          {settings.allowGCash && (
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('GCash')}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                payoutMethod === 'GCash' 
                                  ? 'bg-blue-50 text-blue-800 border-blue-400' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              GCash
                            </button>
                          )}
                          {settings.allowMaya && (
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('Maya')}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                payoutMethod === 'Maya' 
                                  ? 'bg-emerald-55 bg-emerald-50 text-emerald-800 border-emerald-400' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Maya
                            </button>
                          )}
                          {settings.allowBank && (
                            <button
                              type="button"
                              onClick={() => setPayoutMethod('Bank')}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                payoutMethod === 'Bank' 
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-400' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Bank
                            </button>
                          )}
                        </div>
                      </div>

                      {payoutMethod === 'Bank' && (
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Philippine Bank Name</label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2 px-3 rounded-xl border border-slate-205 focus:outline-hidden"
                          >
                            <option value="BDO Unibank">BDO Unibank (BDO)</option>
                            <option value="Bank of the Philippine Islands">Bank of the Philippine Islands (BPI)</option>
                            <option value="Metropolitan Bank & Trust Company">Metrobank</option>
                            <option value="Land Bank of the Philippines">Land Bank</option>
                            <option value="Rizal Commercial Banking Corp">RCBC</option>
                            <option value="UnionBank of the Philippines">UnionBank</option>
                          </select>
                        </div>
                      )}

                      {/* Dynamic Holder Name details */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Account Holder Full Name</label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full bg-slate-50 text-xs py-2 px-3 rounded-xl border border-slate-205 focus:outline-hidden"
                          placeholder="e.g. Maria Santos"
                        />
                      </div>

                      {/* Wallet Mobile phone number details */}
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                          {payoutMethod === 'Bank' ? 'Bank Account Number' : 'PH Mobile Wallet Number'}
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full bg-slate-50 text-xs py-2 px-3 rounded-xl border border-slate-205 focus:outline-hidden text-slate-800 font-mono"
                          placeholder={payoutMethod === 'Bank' ? '10-12 digits BDO/BPI number' : 'e.g. 09171234567'}
                        />
                      </div>

                      {/* Convert Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: settings.widgetThemeColor }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Transmitting...
                          </>
                        ) : (
                          <>
                            <Landmark className="w-4 h-4" />
                            Convert and Cashout Now (PHP)
                          </>
                        )}
                      </button>

                    </form>
                  )}

                </div>
              )}

              {/* Tab 3: History Ledger logs */}
              {activeTab === 'history' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  
                  {/* Combines redemption list and points ledger */}
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Historical Transactions</h4>
                  
                  {customerTxns.length === 0 && customerRedemptions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No point transactions recorded yet. Take store checkout actions in simulation!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      
                      {/* Payout requests */}
                      {customerRedemptions.map((r) => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 font-mono block">PHP REDEMPTION</span>
                              <span className="text-xs font-bold text-slate-800">{r.payoutMethod} ({r.payoutDetails.accountNumber})</span>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{new Date(r.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-rose-500 font-mono block">- ₱{r.pointsRedeemed.toLocaleString()}</span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono mt-1 inline-block ${
                                r.status === 'paid' ? 'bg-blue-50 text-blue-700' :
                                r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                r.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-slate-150 text-slate-600'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Store Points Earns / Spends ledger */}
                      {customerTxns.map((t) => {
                        if (t.points < 0 && customerRedemptions.some(r => r.pointsRedeemed === Math.abs(t.points))) {
                          return null; // Suppress duplicate payouts in history lines
                        }
                        const isEarn = t.type === 'earn';
                        return (
                          <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 hover:bg-slate-100/50 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 font-mono block">
                                  {t.source?.toUpperCase() || (isEarn ? 'EARN' : 'REDEEM')}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  {t.orderId ? `Order #${t.orderId.replace('refund-', '')}` : (t.source === 'referral' ? 'Invited Friend' : 'Cashout Conversion')}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{new Date(t.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold font-mono ${isEarn ? 'text-emerald-600' : 'text-slate-500'}`}>
                                  {isEarn ? `+ ${t.points}` : t.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Widget Legal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[10px] text-gray-400 text-center flex items-center gap-1 justify-center">
              <span>Licensed by Bangko Sentral ng Pilipinas payout rules.</span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Custom floating icon layout trigger button */}
      <motion.button
        id="storefront-widget-launcher"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-white px-4 py-3 rounded-full shadow-lg font-bold text-xs sm:text-sm font-display flex items-center gap-2 cursor-pointer relative"
        style={{ backgroundColor: settings.widgetThemeColor || '#4f46e5' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300"></span>
        </span>
        <Gift className="w-4 h-4 animate-bounce" />
        <span>{settings.widgetLauncherText || '🇵🇭 Loyalty Rewards'}</span>
      </motion.button>

      {/* Initial welcome notifications bubble if activated */}
      {settings.showWelcomeBubble && !isOpen && (
        <div className="absolute bottom-16 right-0 bg-slate-900 text-white rounded-2xl p-3 border border-slate-850 shadow-md text-[11px] w-64 mr-2 mb-2 animate-bounce">
          <div className="absolute w-3 h-3 bg-slate-900 rotate-45 bottom-0 right-6 -mb-1.5 border-r border-b border-slate-850" />
          <p className="font-bold flex items-center gap-1">
            <span className="text-lg">🇵🇭</span>
            {customer.name}, see your cashback stars!
          </p>
          <p className="text-white/80 mt-1">Convert your <b>{customer.pointsBalance.toLocaleString()} points</b> dynamically into GCash cashouts today.</p>
        </div>
      )}

    </div>
  );
}
