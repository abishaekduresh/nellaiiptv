'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, CreditCard, RefreshCcw, Wallet, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
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
  raw_response?: any; // For backward compatibility if needed, though raw query might not return it unless selected
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
      const res = await adminApi.get(`/admin/transactions/unified`, {
        params: { 
            page,
            search: search || undefined,
            type: activeTab === 'all' ? undefined : activeTab,
        },
      });
      setTransactions(res.data.data.data);
      setTotalPages(res.data.data.last_page);
      setStats(res.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      // @ts-ignore
      const msg = error.response?.data?.message || error.message || 'Failed to load transactions';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, activeTab]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 text-green-400';
      case 'failed': return 'bg-red-500/10 text-red-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'refunded': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getSourceIcon = (type: string, method: string) => {
    if (type === 'wallet') {
        return <Wallet size={16} className="text-purple-400" />;
    }
    return <CreditCard size={16} className="text-blue-400" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold text-white">Financial Activity</h1>
            <p className="text-text-secondary mt-1">Monitor all payments and wallet transactions</p>
        </div>
        <button 
          onClick={() => fetchTransactions()}
          className="p-2 bg-gray-800 text-text-secondary rounded-lg hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                    <DollarSign className="text-green-400" size={24} />
                </div>
                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded">Net Revenue</span>
            </div>
            <h3 className="text-text-secondary text-sm">Total Gateway Sales</h3>
            <p className="text-2xl font-bold text-white mt-1">₹{Number(stats.total_revenue).toLocaleString()}</p>
        </div>

        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                    <ArrowDownLeft className="text-blue-400" size={24} />
                </div>
            </div>
            <h3 className="text-text-secondary text-sm">Wallet Loads (Credits)</h3>
            <p className="text-2xl font-bold text-white mt-1">₹{Number(stats.wallet_credits).toLocaleString()}</p>
        </div>

        <div className="bg-background-card p-6 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                    <ArrowUpRight className="text-purple-400" size={24} />
                </div>
            </div>
            <h3 className="text-text-secondary text-sm">Wallet Spend (Debits)</h3>
            <p className="text-2xl font-bold text-white mt-1">₹{Number(stats.wallet_debits).toLocaleString()}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-background-card p-1 rounded-lg border border-gray-800 mb-6 inline-flex">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-gray-800 text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
          >
            All Activity
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payment' ? 'bg-gray-800 text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
          >
            Gateway Payments
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'wallet' ? 'bg-gray-800 text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
          >
            Wallet Logs
          </button>
      </div>

      {/* Search */}
      <div className="bg-background-card p-4 rounded-lg border border-gray-800 mb-6">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input 
                type="text" 
                placeholder="Search by customer, phone, or reference ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary"
            />
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-text-secondary uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Description / Reference</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary italic">Loading activity...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary italic">No records found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={`${tx.source_type}-${tx.id}`} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${tx.source_type === 'wallet' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                            {getSourceIcon(tx.source_type, tx.method)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-medium capitalize">{tx.source_type}</span>
                            <span className="text-[10px] text-text-secondary uppercase">{tx.method}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{tx.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-text-secondary">{tx.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white max-w-[200px] truncate" title={tx.description}>{tx.description}</div>
                      <div className="text-xs text-text-secondary font-mono mt-0.5">{tx.reference || '-'}</div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                        tx.method === 'debit' ? 'text-white' : 'text-green-400'
                    }`}>
                      {tx.method === 'debit' ? '-' : '+'}
                      {tx.currency} {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTransaction(tx)}
                        className="p-1.5 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
            <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors text-sm"
            >
                Previous
            </button>
            <span className="text-text-secondary text-sm">Page {page} of {totalPages}</span>
            <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors text-sm"
            >
                Next
            </button>
        </div>
      </div>

      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-text-secondary mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(selectedTransaction.status)}`}>
                  {selectedTransaction.status}
                </span>
              </div>
              <div className="p-3 bg-background rounded-lg border border-gray-800">
                <p className="text-xs text-text-secondary mb-1">Amount</p>
                <p className="text-lg font-bold text-white">{selectedTransaction.currency} {selectedTransaction.amount}</p>
              </div>
            </div>

            <div className="p-4 bg-background rounded-lg border border-gray-800 space-y-3">
                 <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Type</span>
                  <span className="text-white capitalize">{selectedTransaction.source_type} ({selectedTransaction.method})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Description</span>
                  <span className="text-white text-right">{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Reference ID</span>
                  <span className="text-white font-mono">{selectedTransaction.reference}</span>
                </div>
                 <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Date</span>
                  <span className="text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                </div>
            </div>

            <div className="p-4 bg-background rounded-lg border border-gray-800 space-y-3">
                <h4 className="text-sm font-bold text-white border-b border-gray-700 pb-2 mb-2">Customer Info</h4>
                 <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Name</span>
                  <span className="text-white">{selectedTransaction.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Phone</span>
                  <span className="text-white">{selectedTransaction.customer_phone}</span>
                </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
