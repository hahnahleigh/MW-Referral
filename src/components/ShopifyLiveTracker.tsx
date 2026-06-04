import React from 'react';
import { Customer, AuditLog } from '../types.js';
import { ShieldCheck, Calendar, Activity, Server, Radio, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShopifyLiveTrackerProps {
  settings: {
    storeName: string;
    shopifyDomain: string;
    apiAccessToken: string;
    webhookSecret: string;
    isConnected?: boolean;
  };
  customers: Customer[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
  onToggleSandbox: () => void;
}

export default function ShopifyLiveTracker({
  settings,
  customers,
  auditLogs,
  onRefresh,
  onToggleSandbox
}: ShopifyLiveTrackerProps) {
  // Filter audit logs for webhook activity
  const webhookLogs = auditLogs.filter(log => 
    log.action.startsWith('WEBHOOK_') || 
    log.action === 'SETTINGS_UPDATED' ||
    log.action.startsWith('REFERRAL_')
  ).slice(0, 5);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
      
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-display">⚡ Production Shopify Connection Active</h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Customer Tracking
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Listening to real Shopify API resources at <span className="text-slate-200 font-mono text-xs">{settings.shopifyDomain}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-800"
            title="Force Poll Ledger API"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Toggle Sandbox */}
          <button
            onClick={onToggleSandbox}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs border border-indigo-500"
          >
            🔌 Switch Back to Dev Sandbox
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Connection Status</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-xs text-slate-100">mTLS & HMAC Handshake</span>
          </div>
          <span className="text-[10px] text-slate-450 block">HMAC Signature verification live</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Registered Sync Users</span>
          <div className="text-xl font-black text-white font-mono flex items-baseline gap-1.5">
            {customers.length}
            <span className="text-[11px] text-emerald-450 font-semibold font-sans">Synced Profiles</span>
          </div>
          <span className="text-[10px] text-slate-450 block">Real customer tracking mapped</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Production Webhooks</span>
          <div className="font-extrabold text-xs text-indigo-400 font-mono truncate select-all">
            orders/paid, refunded
          </div>
          <span className="text-[10px] text-slate-450 block">Registered to shop endpoints</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Access Protocol</span>
          <div className="font-extrabold text-xs text-slate-200">
            REST API (Admin GraphQL)
          </div>
          <span className="text-[10px] text-slate-450 block">Security Scopes authorized</span>
        </div>

      </div>

      {/* Real-time Webhook Activity Logs */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            📡 Live Shopify Webhook Listener & Event Feed
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Currently Listening for checkout events...
          </span>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
          {webhookLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Server className="w-5 h-5 mx-auto opacity-30 animate-pulse text-indigo-400" />
              <p className="text-xs">No production webhook payloads received yet.</p>
              <p className="text-[10px] text-slate-600 max-w-sm mx-auto">
                Once a real customer completes a checkout order in your live shop, reward points will trigger and register in real-time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {webhookLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-900/60 transition-colors flex items-start gap-3">
                  <div className="p-1 rounded bg-slate-850 text-indigo-400 text-[9px] font-mono font-bold uppercase shrink-0">
                    {log.action.replace('WEBHOOK_', '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 font-sans leading-tight">
                      {log.details}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()} • ID: {log.id}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    SYNCED
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
