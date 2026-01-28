'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_id: string;
  balance_after: number;
  created_at: string;
}

interface WalletHistoryProps {
  refreshTrigger: number; // Prop to trigger refresh
}

export default function WalletHistory({ refreshTrigger }: WalletHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reseller/wallet/transactions?per_page=10');
      setTransactions(res.data.data.data || res.data.data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && transactions.length === 0) {
    return <div className="text-text-secondary text-sm">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
        <div className="text-center py-8 bg-background-card rounded-lg border border-gray-800">
            <p className="text-text-secondary">No transactions found</p>
        </div>
    );
  }

  return (
    <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Wallet History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800/50 text-text-secondary uppercase">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-3 text-text-secondary whitespace-nowrap">
                  {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-full ${tx.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    </span>
                    <span className="text-white truncate max-w-[200px] md:max-w-xs" title={tx.description}>
                        {tx.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 pl-7">{tx.reference_id}</div>
                </td>
                <td className={`px-6 py-3 text-right font-medium ${tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right text-text-secondary">
                  ₹{Number(tx.balance_after).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
