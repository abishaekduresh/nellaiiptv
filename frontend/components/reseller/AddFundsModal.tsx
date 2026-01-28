'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

// Add Razorpay type definition
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFundsModal({ isOpen, onClose, onSuccess }: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 1) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
        // 1. Create Order
        const orderRes = await api.post('/reseller/wallet/add-funds', { amount: Number(amount) });
        const { gateway_order_id, key_id, currency } = orderRes.data.data;

        // 2. Load Razorpay SDK
        const loadScript = (src: string) => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };

        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!res) {
            toast.error('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
        }

        // 3. Open Checkout
        const options = {
            key: key_id,
            amount: Number(amount) * 100,
            currency: currency,
            name: "Nellai IPTV",
            description: "Wallet Topup",
            order_id: gateway_order_id,
            handler: async function (response: any) {
                try {
                    // 4. Verify Payment
                    await api.post('/reseller/wallet/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    
                    toast.success('Funds added successfully!');
                    onSuccess();
                    onClose();
                    setAmount('');
                } catch (err) {
                    toast.error('Payment verification failed');
                    console.error(err);
                }
            },
            prefill: {
                name: (user as any)?.name || "",
                email: (user as any)?.email || "",
                contact: (user as any)?.phone || ""
            },
            theme: {
                color: "#ff0080" // Primary Color
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background-card border border-gray-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Add Funds</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handlePayment} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter amount to add"
              required
            />
          </div>

          <div className="flex gap-3">
            {[500, 1000, 2000, 5000].map((val) => (
                <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                >
                    ₹{val}
                </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Processing...
              </>
            ) : (
              'Proceed to Pay'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
