'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, CreditCard, RefreshCcw, Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

interface UnifiedTransaction {
  source_type: 'payment' | 'wallet';
  id: string;
  created_at: string;
  amount: string;
  currency: string;
  status: string;
  method: string;
  reference: string;
  description: string;
  customer_name: string;
  customer_phone: string;
  customer_uuid: string;
}

interface Stats {
  total_revenue: number;
  wallet_credits: number;
  wallet_debits: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total_revenue: 0, wallet_credits: 0, wallet_debits: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'wallet'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<UnifiedTransaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/transactions/unified', {
        params: { page, search: search || undefined, type: activeTab === 'all' ? undefined : activeTab },
      });
      setTransactions(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setStats(res.data.data.stats);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, activeTab]);
  useEffect(() => { fetchTransactions(); }, [page, search, activeTab]);

  const statusStyle = (s: string) => {
    const m: Record<string, string> = {
      success: 'bg-green-500/15 text-green-400',
      failed: 'bg-red-500/15 text-red-400',
      pending: 'bg-yellow-500/15 text-yellow-400',
      refunded: 'bg-blue-500/15 text-blue-400',
    };
    return m[s] || 'bg-slate-500/15 text-slate-400';
  };

  const statCards = [
    { label: 'Total Gateway Sales', value: stats.total_revenue, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', badge: 'Net Revenue' },
    { label: 'Wallet Loads (Credits)', value: stats.wallet_credits, icon: ArrowDownLeft, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', badge: '' },
    { label: 'Wallet Spend (Debits)', value: stats.wallet_debits, icon: ArrowUpRight, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', badge: '' },
  ];

  const tabs = [
    { key: 'all', label: 'All Activity' },
    { key: 'payment', label: 'Gateway' },
    { key: 'wallet', label: 'Wallet' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Financial Activity</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor payments and wallet transactions</p>
        </div>
        <button onClick={() => fetchTransactions()}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors" title="Refresh">
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, border, badge }) => (
          <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${bg} border ${border} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>{badge}</span>}
            </div>
            <p className="text-slate-400 text-xs mb-0.5">{label}</p>
            <p className="text-2xl font-black text-white">₹{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer, phone, or reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.28s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                {['Type', 'Customer', 'Description', 'Amount', 'Status', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading transactions...</span>
                  </div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">No records found</td></tr>
              ) : transactions.map(tx => (
                <tr key={`${tx.source_type}-${tx.id}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${tx.source_type === 'wallet' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                        {tx.source_type === 'wallet' ? <Wallet size={15} className="text-purple-400" /> : <CreditCard size={15} className="text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm capitalize">{tx.source_type}</p>
                        <p className="text-slate-500 text-xs uppercase">{tx.method}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium text-sm">{tx.customer_name || 'Unknown'}</p>
                    <p className="text-slate-500 text-xs">{tx.customer_phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-white text-sm max-w-[180px] truncate" title={tx.description}>{tx.description}</p>
                    <p className="text-slate-500 text-xs font-mono">{tx.reference || '—'}</p>
                  </td>
                  <td className={`px-5 py-3.5 font-bold text-sm ${tx.method === 'debit' ? 'text-white' : 'text-green-400'}`}>
                    {tx.method === 'debit' ? '−' : '+'}{tx.currency} {Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${statusStyle(tx.status)}`}>{tx.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelectedTransaction(tx)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Transaction Details">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${statusStyle(selectedTransaction.status)}`}>{selectedTransaction.status}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Amount</p>
                <p className="text-lg font-bold text-white">{selectedTransaction.currency} {selectedTransaction.amount}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 space-y-2.5 text-sm">
              {[
                ['Type', `${selectedTransaction.source_type} (${selectedTransaction.method})`],
                ['Description', selectedTransaction.description],
                ['Reference', selectedTransaction.reference],
                ['Date', new Date(selectedTransaction.created_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 shrink-0">{k}</span>
                  <span className="text-white text-right capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 space-y-2.5 text-sm">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Customer</p>
              {[
                ['Name', selectedTransaction.customer_name],
                ['Phone', selectedTransaction.customer_phone],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
