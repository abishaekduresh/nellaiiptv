'use client';

import { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import AddFundsModal from '@/components/reseller/AddFundsModal';

interface WalletCardProps {
  balance: number;
  onFundsAdded: () => void;
}

export default function WalletCard({ balance, onFundsAdded }: WalletCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-background-card rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Wallet className="text-purple-400" size={24} />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Funds
          </button>
        </div>
        <h3 className="text-text-secondary text-sm mb-1">Wallet Balance</h3>
        <p className="text-3xl font-bold text-white">₹{Number(balance).toFixed(2)}</p>
        <p className="text-xs text-text-secondary mt-1">Available for purchases</p>
      </div>

      <AddFundsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onFundsAdded}
      />
    </>
  );
}
