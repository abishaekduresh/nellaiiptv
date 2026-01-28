'use client';

import { useState } from 'react';
import { X, Loader2, Wallet } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { toast } from 'react-hot-toast';

interface AdminTopupModalProps {
  customer: {
    uuid: string;
    name: string;
    wallet_balance?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminTopupModal({ customer, onClose, onSuccess }: AdminTopupModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Admin Manual Credit');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await adminApi.post(`/admin/customers/${customer.uuid}/wallet/topup`, {
        amount: Number(amount),
        description
      });
      toast.success('Wallet topped up successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to topup wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background-card border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet size={20} className="text-purple-400" />
            Topup Wallet
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-800/50 p-3 rounded-lg">
             <div className="text-sm text-text-secondary">Reseller</div>
             <div className="font-medium text-white">{customer.name}</div>
             <div className="text-xs text-text-secondary mt-1">Current Balance: ₹{customer.wallet_balance || 0}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="Reason for credit"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Processing...
              </>
            ) : (
              'Credit Funds'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
