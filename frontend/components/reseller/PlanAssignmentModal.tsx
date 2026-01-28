'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Plan {
  uuid: string;
  name: string;
  duration: number;
  price: number;
  reseller_price?: number;
}

interface Customer {
  uuid: string;
  name: string;
  phone: string;
}

interface PlanAssignmentModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlanAssignmentModal({ customer, onClose, onSuccess }: PlanAssignmentModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
      try {
          const res = await api.get('/reseller/wallet');
          setWalletBalance(Number(res.data.data.balance));
      } catch (e) {
          console.error("Failed to fetch wallet balance");
      }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch plans');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/reseller/customers/${customer.uuid}/assign-plan`, {
        plan_uuid: selectedPlan
      });
      toast.success('Plan assigned successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planUuid: string) => {
    setSelectedPlan(planUuid);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card rounded-lg border border-gray-800 w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Assign Plan</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-gray-800/30 rounded-lg mb-4">
            <p className="text-sm text-text-secondary">Customer</p>
            <p className="text-white font-medium">{customer.name}</p>
            <p className="text-sm text-text-secondary">{customer.phone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Plan *
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => handlePlanChange(e.target.value)}
              required
              className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">-- Select Plan --</option>
              {plans.map((plan) => (
                <option key={plan.uuid} value={plan.uuid}>
                  {plan.name} ({plan.duration} days - ${plan.price})
                </option>
              ))}
            </select>
            {walletBalance !== null && selectedPlan && (
                (() => {
                    const p = plans.find(pl => pl.uuid === selectedPlan);
                    const price = p?.reseller_price || p?.price || 0;
                    if (price > walletBalance) {
                        return (
                            <p className="text-red-400 text-xs mt-1">
                                Insufficient Balance (₹{walletBalance}). Plan Cost: ₹{price}
                            </p>
                        )
                    } else {
                         return (
                            <p className="text-green-400 text-xs mt-1">
                                Wallet Balance: ₹{walletBalance} (After deduction: ₹{walletBalance - price})
                            </p>
                        )
                    }
                })()
            )}
          </div>



          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
