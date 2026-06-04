import React, { useState, useEffect } from 'react';
import { Customer, PointTransaction, RedemptionRequest, ShopifySettings } from '../types.js';
import StorefrontWidget from './StorefrontWidget.js';
import { 
  ArrowLeft, Save, Monitor, Smartphone, Check, HelpCircle, 
  Settings, Layers, ChevronRight, Sliders, Palette, Sparkles, 
  ShoppingBag, Star, RefreshCw, Smartphone as Phone, Compass, RotateCcw
} from 'lucide-react';

interface ShopifyThemeEditorProps {
  customers: Customer[];
  redemptionRequests: RedemptionRequest[];
  settings: ShopifySettings | null;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export default function ShopifyThemeEditor({
  customers,
  redemptionRequests,
  settings,
  onClose,
  onSettingsSaved
}: ShopifyThemeEditorProps) {
  // Device Preview State
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [editorTab, setEditorTab] = useState<'embeds' | 'settings'>('embeds');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulated Customizer Settings Input State (Pre-filled from actual DB settings)
  const [appEmbedEnabled, setAppEmbedEnabled] = useState(true);
  const [widgetLauncherText, setWidgetLauncherText] = useState('🇵🇭 Rewards & Cashouts');
  const [widgetThemeColor, setWidgetThemeColor] = useState('#4f46e5');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);
  
  // Ledger Rules & payout configuration (to have complete control in the editor)
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(100);
  const [pointsToPesoRate, setPointsToPesoRate] = useState(1);
  const [allowGCash, setAllowGCash] = useState(true);
  const [allowMaya, setAllowMaya] = useState(true);
  const [allowBank, setAllowBank] = useState(true);
  const [allowQRPh, setAllowQRPh] = useState(true);

  // Simulate Shopify Action states
  const [simulatedCustomer, setSimulatedCustomer] = useState<Customer>(customers[0]);
  const [simulationPointsAdded, setSimulationPointsAdded] = useState(false);

  // Sync settings when initially opened
  useEffect(() => {
    if (settings) {
      setAppEmbedEnabled(settings.appEmbedEnabled !== undefined ? settings.appEmbedEnabled : true);
      setWidgetLauncherText(settings.widgetLauncherText || '🇵🇭 Rewards & Cashouts');
      setWidgetThemeColor(settings.widgetThemeColor || '#4f46e5');
      setWidgetPosition(settings.widgetPosition || 'bottom-right');
      setShowWelcomeBubble(settings.showWelcomeBubble !== undefined ? settings.showWelcomeBubble : true);

      setMinPointsToRedeem(settings.minPointsToRedeem !== undefined ? settings.minPointsToRedeem : 100);
      setPointsToPesoRate(settings.pointsToPesoRate !== undefined ? settings.pointsToPesoRate : 1);
      setAllowGCash(settings.allowGCash !== undefined ? settings.allowGCash : true);
      setAllowMaya(settings.allowMaya !== undefined ? settings.allowMaya : true);
      setAllowBank(settings.allowBank !== undefined ? settings.allowBank : true);
      setAllowQRPh(settings.allowQRPh !== undefined ? settings.allowQRPh : true);
    }
  }, [settings]);

  // Handle Save (submitting directly back to database settings)
  const handleThemeEditorSave = async () => {
    setIsSubmitting(true);
    setSaveSuccess(false);

    const payload: Partial<ShopifySettings> = {
      ...(settings || {}),
      appEmbedEnabled,
      widgetLauncherText,
      widgetThemeColor,
      widgetPosition,
      showWelcomeBubble,
      minPointsToRedeem,
      pointsToPesoRate,
      allowGCash,
      allowMaya,
      allowBank,
      allowQRPh
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        onSettingsSaved();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings inside theme editor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper properties to send into the client widget component
  const mergedSettings: ShopifySettings = {
    storeName: settings?.storeName || 'Artisan Bakery Manila',
    shopifyDomain: settings?.shopifyDomain || 'potopotostudio.myshopify.com',
    apiAccessToken: settings?.apiAccessToken || 'shpat_9182736450abcde123456789f',
    webhookSecret: settings?.webhookSecret || 'whsec_9876543210abcdef0123456789',
    pointsPerPesoSpent: settings?.pointsPerPesoSpent || 1,
    minPointsToRedeem,
    pointsToPesoRate,
    allowGCash,
    allowMaya,
    allowBank,
    allowQRPh,
    widgetLauncherText,
    widgetThemeColor,
    widgetPosition,
    showWelcomeBubble,
    isConnected: settings?.isConnected || false,
    appEmbedEnabled
  };

  // Trigger simulated local buy
  const handleSimulatedBuy = async (price: number, productName: string) => {
    setSimulationPointsAdded(true);
    setTimeout(() => setSimulationPointsAdded(false), 2500);

    // Call simulated buy points webhook
    try {
      await fetch('/api/webhooks/orders/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `theme-editor-order-${Date.now()}`,
          total_price: price,
          currency: 'PHP',
          customer: {
            id: simulatedCustomer.shopifyCustomerId.replace('gid://shopify/Customer/', ''),
            email: simulatedCustomer.email,
            first_name: simulatedCustomer.name.split(' ')[0],
            last_name: simulatedCustomer.name.split(' ').slice(1).join(' ') || ''
          },
          line_items: [
            {
              title: productName,
              price: price,
              sku: 'SKU-STANDARD'
            }
          ]
        })
      });
      onSettingsSaved(); // refresh main states
    } catch (err) {
      console.error('Failed to trigger order webhook', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F1F1F1] flex flex-col font-sans select-none text-slate-800">
      
      {/* 1. TOP HEADER BAR: Replicates Shopify Editor Navigation Layout */}
      <header className="bg-[#1A1A1A] text-white border-b border-neutral-800 height-[60px] px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#2C2C2C] text-neutral-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App Dashboard</span>
          </button>
          
          <div className="h-5 w-px bg-neutral-700 mx-1" />
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              ONLINE STORE
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">Dawn Theme (Live)</span>
              <span className="text-[9px] text-neutral-400">Current Theme Editor Customizer</span>
            </div>
          </div>
        </div>

        {/* Device Switcher Controls */}
        <div className="hidden md:flex items-center bg-[#2C2C2C] p-1 rounded-xl border border-neutral-700/50">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs font-semibold transition-all ${
              device === 'desktop' ? 'bg-[#1A1A1A] text-white' : 'text-neutral-450 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer text-xs font-semibold transition-all ${
              device === 'mobile' ? 'bg-[#1A1A1A] text-white' : 'text-neutral-450 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Save button and indicator */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
              <Check className="w-4 h-4" /> App embedded layout saved!
            </span>
          )}
          
          <button
            type="button"
            onClick={handleThemeEditorSave}
            disabled={isSubmitting}
            className={`bg-[#008060] hover:bg-[#006E52] text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer flex items-center gap-2 tracking-wide shadow-md transition-all ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Theme Config</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT WORKSPACE: Sidebar Customizer Column + Resizable Storefront Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Sidebar Inspector Controls */}
        <aside className="w-[360px] bg-white border-r border-[#E3E3E3] flex flex-col justify-between shrink-0 overflow-y-auto">
          
          <div className="flex flex-col">
            {/* Sidebar Title Header */}
            <div className="p-4 border-b border-[#E3E3E3] bg-[#FAFAFA]">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase font-mono tracking-widest block mb-1">
                Customize Settings
              </span>
              <h2 className="text-sm font-extrabold text-neutral-900 leading-normal flex items-center gap-1.5">
                <Settings className="w-4.5 h-4.5 text-[#008060]" />
                Storefront Customizer
              </h2>
            </div>

            {/* Selection tab category */}
            <div className="flex border-b border-[#E3E3E3] bg-[#FAFAFA] text-xs font-bold text-slate-500">
              <button
                onClick={() => setEditorTab('embeds')}
                className={`flex-1 text-center py-3 border-b-2 cursor-pointer transition-all ${
                  editorTab === 'embeds' 
                    ? 'border-indigo-600 text-indigo-700 bg-white' 
                    : 'border-transparent hover:text-neutral-850 hover:bg-[#F5F5F5]'
                }`}
              >
                🔌 App Embed Block
              </button>
              <button
                onClick={() => setEditorTab('settings')}
                className={`flex-1 text-center py-3 border-b-2 cursor-pointer transition-all ${
                  editorTab === 'settings' 
                    ? 'border-indigo-600 text-indigo-700 bg-white' 
                    : 'border-transparent hover:text-neutral-850 hover:bg-[#F5F5F5]'
                }`}
              >
                ⚙️ Wallet Rules & Currencies
              </button>
            </div>

            {/* TAB CONTENT: App Embed Block Customization settings */}
            <div className="p-5 space-y-6">
              
              {editorTab === 'embeds' && (
                <div className="space-y-6">
                  
                  {/* APP EMBED CORE BLOCK ENABLE TOGGLE */}
                  <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide block mb-0.5">
                          Theme Extension
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 block font-display">
                          💡 Artisan Loyalty & Cashouts
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Enable/disable the floating affiliate rewards and cashier cashout portal directly on your buyers storefront theme layout.
                        </p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={appEmbedEnabled}
                          onChange={(e) => setAppEmbedEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-205/60 flex items-center justify-between text-[9px] text-[#008060] font-bold">
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${appEmbedEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {appEmbedEnabled ? 'Status: Extension Enabled' : 'Status: Extension Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* WIDGET STYLINGS ACCORDION */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      Widget Block Configurations
                    </h3>

                    <div className="space-y-4">
                      {/* Brand launcher text */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase font-mono">
                          Floating Launcher Wording
                        </label>
                        <input
                          type="text"
                          value={widgetLauncherText}
                          onChange={(e) => setWidgetLauncherText(e.target.value)}
                          className="w-full bg-white text-slate-800 text-xs py-2 px-3 border border-slate-250 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                          placeholder="e.g. 🇵🇭 Rewards"
                        />
                      </div>

                      {/* Color Picker */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase font-mono">
                          Core Theme Hue Hex
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
                            className="w-full bg-white text-slate-800 py-1.5 px-3 border border-slate-250 font-mono text-xs rounded-lg uppercase"
                          />
                        </div>
                      </div>

                      {/* Position select */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase font-mono">
                          Default screen placement
                        </label>
                        <select
                          value={widgetPosition}
                          onChange={(e) => setWidgetPosition(e.target.value as any)}
                          className="w-full bg-white text-slate-850 py-2 px-3 border border-slate-250 rounded-lg focus:outline-hidden text-xs"
                        >
                          <option value="bottom-right">Bottom Right corner of browser</option>
                          <option value="bottom-left">Bottom Left corner of browser</option>
                        </select>
                      </div>

                      {/* Show Welcome announcement */}
                      <label className="flex items-center gap-2 cursor-pointer py-1 text-slate-700">
                        <input
                          type="checkbox"
                          checked={showWelcomeBubble}
                          onChange={(e) => setShowWelcomeBubble(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 h-3.5 w-3.5"
                        />
                        <span className="text-[11px] font-semibold select-none leading-none">
                          Display hello greeting announcement bubble
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ACTIVE CUSTOMER SELECTOR FOR PREVIEW */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <h5 className="text-[9px] font-bold tracking-widest text-[#008060] font-mono block uppercase">
                      👤 Live Customer View simulation
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Toggle active user profile to see how details sync directly into the App Embedded widget:
                    </p>
                    <div className="space-y-2">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSimulatedCustomer(c);
                            // Refresh simulation
                          }}
                          className={`w-full p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${
                            simulatedCustomer.id === c.id 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' 
                              : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xs block leading-none mb-1">{c.name}</span>
                            <span className="text-[9px] font-mono text-slate-450 block leading-none">{c.email}</span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-205 text-indigo-700">
                            ₱{c.pointsBalance.toLocaleString()} PHP
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {editorTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-200 text-xs">
                  
                  {/* MULTIPLIER RULES */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono font-bold text-[#008060] uppercase tracking-widest border-b border-light pb-1.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Points Conversion Standards
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase font-mono">
                          Points exchange rate
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={pointsToPesoRate}
                            onChange={(e) => setPointsToPesoRate(Number(e.target.value))}
                            min="0.01"
                            step="0.01"
                            className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-lg text-xs"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">₱/point</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase font-mono">
                          Minimum points to cashout
                        </label>
                        <input
                          type="number"
                          value={minPointsToRedeem}
                          onChange={(e) => setMinPointsToRedeem(Number(e.target.value))}
                          min="1"
                          className="w-full bg-white text-slate-800 py-2 px-3 border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PH PAYOUT GATEWAYS */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-light pb-1">
                      Support Filippine Wallets
                    </h4>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2.5 p-2 hover:bg-[#FAFAFA] rounded-xl cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={allowGCash}
                          onChange={(e) => setAllowGCash(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-neutral-900 h-3.5 w-3.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">GCash Wallet</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-2 hover:bg-[#FAFAFA] rounded-xl cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={allowMaya}
                          onChange={(e) => setAllowMaya(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-neutral-900 h-3.5 w-3.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Maya Wallet</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-2 hover:bg-[#FAFAFA] rounded-xl cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={allowBank}
                          onChange={(e) => setAllowBank(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-neutral-900 h-3.5 w-3.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Bank Direct (BDO/BPI)</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-2 hover:bg-[#FAFAFA] rounded-xl cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={allowQRPh}
                          onChange={(e) => setAllowQRPh(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 accent-neutral-900 h-3.5 w-3.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">QR Ph Instant Code</span>
                        </div>
                      </label>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* SIDEBAR FOOTER HELP BANNER */}
          <div className="p-4 bg-[#FAFAFA] border-t border-[#E3E3E3] text-[10px] text-slate-450 leading-relaxed font-mono">
            💡 <strong>ProTip</strong>: Clicking "Save Theme Config" will push settings live to the storefront immediately. Live webhooks will begin querying this state!
          </div>

        </aside>

        {/* RIGHT AREA: Resizable storefront design workspace preview */}
        <main className="flex-1 bg-[#F1F1F1] p-6 overflow-y-auto flex items-center justify-center relative">
          
          {/* Simulated Outer Device Shell Layout bounds */}
          <div className={`transition-all duration-300 shadow-2xl overflow-hidden border border-slate-300 bg-white flex flex-col relative ${
            device === 'mobile' ? 'w-[375px] h-[680px] rounded-[44px] border-[10px] border-neutral-900' : 'w-full max-w-5xl h-[680px] rounded-2xl'
          }`}>
            
            {/* Device Specific mock Top Speaker pill if in Mobile view */}
            {device === 'mobile' && (
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-neutral-900 rounded-full z-40 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2" />
                <span className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>
            )}

            {/* MOCK BROWSER SITE CHROME BAR */}
            <div className={`bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2.5 shrink-0 select-none ${
              device === 'mobile' ? 'pt-8' : ''
            }`}>
              <div className="flex gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              
              <div className="flex-1 max-w-lg bg-white border border-slate-205 rounded-lg px-3 py-1 flex items-center gap-2">
                <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1 py-[1px] rounded tracking-wide font-mono">HTTPS</span>
                <span className="text-[10px] text-slate-550 font-mono font-medium truncate">
                  {settings?.shopifyDomain || 'storename.myshopify.com'}/shop/products
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="hidden sm:inline text-[9px] font-bold text-slate-500 font-mono uppercase bg-white border border-slate-205 px-2 py-0.5 rounded overflow-hidden">
                  Dawn Live Sandbox Preview
                </span>
              </div>
            </div>

            {/* LIVE STOREFRONT CANVAS BODY MOCK */}
            <div className="flex-1 overflow-y-auto bg-transparent flex flex-col relative">
              
              {/* Core Storefront Header layout */}
              <div className="border-b border-slate-100 pb-3 bg-stone-900 text-amber-50 px-5 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎪</span>
                  <div>
                    <span className="font-extrabold text-white block text-sm tracking-tight leading-tight">
                      {settings?.storeName || 'Artisan Bakery Manila'}
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block font-mono">
                      Specialty Sourdough & Pastries
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-[10px] text-stone-300">Mon-Sat | 7AM - 7PM</span>
                  <div className="bg-amber-100/10 text-amber-200 border border-amber-200/20 px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    <span>🛒 Cart (0)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic buy notification toast */}
              {simulationPointsAdded && (
                <div className="absolute top-16 left-6 right-6 bg-emerald-600 text-white p-3 rounded-2xl shadow-xl z-30 flex items-center gap-2 border border-emerald-500 text-xs font-bold animate-in slide-in-from-top-4 duration-300">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Interactive Sim Order Verified! 1,600 loyalty points automatically credited back to {simulatedCustomer.name}'s account!</span>
                </div>
              )}

              {/* Storefront Hero section banner */}
              <div className="relative bg-stone-950 px-6 py-10 sm:py-14 text-center overflow-hidden shrink-0 flex flex-col items-center justify-center">
                {/* Visual grid texture overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-600/10 rounded-full blur-3xl" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="relative space-y-2 max-w-md">
                  <span className="inline-flex items-center bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-1">
                    🥐 🇵🇭 Manila Baking Excellence 🥐
                  </span>
                  <h3 className="font-extrabold text-white text-lg sm:text-2xl font-display tracking-tight leading-tight">
                    The Ultimate Bakery Experience, Powered by Smart Rewards
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-300 leading-normal max-w-sm">
                    Earn 1,600 flat points on purchase, redeem cashouts, and refer friends to unlock ₱500 cash bonuses! Connect your GCash, Maya, or any local PH bank account instantly.
                  </p>
                </div>
              </div>

              {/* Product list list section */}
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">Fresh Breads Collection</h4>
                    <p className="text-[10px] text-slate-450">Click any bread buy trigger to simulate a live paid customer checkout:</p>
                  </div>
                  
                  <span className="text-[9px] font-bold text-slate-450 flex items-center gap-1 uppercase font-mono">
                    <Compass className="w-3.5 h-3.5" /> Webhook simulator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Product card 1 */}
                  <div className="border border-slate-150 p-4 rounded-xl flex flex-col justify-between bg-white shadow-xs hover:border-amber-400 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-3xl bg-amber-50 p-2 rounded-xl group-hover:scale-110 duration-200">🥐</span>
                        <span className="text-[8px] border border-amber-200 bg-amber-50 text-amber-800 font-extrabold px-1.5 py-0.2 rounded font-mono uppercase">PH SPEC-ED</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-805 leading-snug">Purple Yam Ube Pandesal</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Baked with premium real yam filling and dynamic golden breadcrumbs.</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold font-mono text-emerald-700 text-xs">₱750.00</span>
                      <button
                        type="button"
                        onClick={() => handleSimulatedBuy(750, 'Purple Yam Ube Pandesal')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ⚡ Order Now (Earn P750 equivalent)
                      </button>
                    </div>
                  </div>

                  {/* Product card 2 */}
                  <div className="border border-slate-150 p-4 rounded-xl flex flex-col justify-between bg-white shadow-xs hover:border-amber-400 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-3xl bg-amber-50 p-2 rounded-xl group-hover:scale-110 duration-200">🧁</span>
                        <span className="text-[8px] bg-red-50 text-red-800 border border-red-200 font-extrabold px-1.5 py-0.2 rounded font-mono uppercase">RECOMMENDED</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-850 leading-snug">Ube Ensaymada Delight</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Artisan bread glazed with margarine, grated cheese, and ube fudge.</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold font-mono text-emerald-700 text-xs">₱480.00</span>
                      <button
                        type="button"
                        onClick={() => handleSimulatedBuy(480, 'Ube Ensaymada Delight')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ⚡ Order Now (Earn points)
                      </button>
                    </div>
                  </div>

                  {/* Product card 3 */}
                  <div className="border border-slate-150 p-4 rounded-xl flex flex-col justify-between bg-white shadow-xs hover:border-amber-400 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-3xl bg-amber-50 p-2 rounded-xl group-hover:scale-110 duration-200">🥖</span>
                        <span className="text-[8px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold px-1.5 py-0.2 rounded font-mono uppercase">Starter</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-805 leading-snug">Crispy Pinoy Spanish Bread</h5>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Soft central rolls filled with sweet, buttery golden breadcrumbs.</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold font-mono text-emerald-700 text-xs">₱250.00</span>
                      <button
                        type="button"
                        onClick={() => handleSimulatedBuy(250, 'Crispy Pinoy Spanish Bread')}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ⚡ Order Now (Earn points)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOATING APP EMBED CLIENT WIDGET PREVIEW SECTION */}
              {appEmbedEnabled ? (
                /* Absolute positioned widget preview mapping */
                <StorefrontWidget
                  activeCustomer={simulatedCustomer}
                  customers={customers}
                  pointTransactions={[]}
                  redemptionRequests={redemptionRequests}
                  settings={mergedSettings}
                  onAction={onSettingsSaved}
                  isInline={true}
                />
              ) : (
                /* Block indicator when App Embedded was toggled off */
                <div className={`absolute bottom-6 bg-slate-900/95 text-slate-100 border border-slate-800 p-4 rounded-2xl w-72 shadow-xl backdrop-blur-md z-40 transition-all ${
                  widgetPosition === 'bottom-left' ? 'left-6' : 'right-6'
                }`}>
                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold font-mono uppercase px-2 py-0.5 rounded block w-max mb-1.5">
                    🚫 App Embedded Off
                  </span>
                  <p className="text-[11px] font-bold text-white">Floating widget is disabled</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Toggle your <b>App Embed Enable switch</b> in the customizer tab on the left to activate this loyalty widget in the theme block!
                  </p>
                </div>
              )}

            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
