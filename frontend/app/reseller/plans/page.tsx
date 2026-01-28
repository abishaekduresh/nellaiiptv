'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Package } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { useAuthStore } from '@/stores/authStore';

interface Plan {
  uuid: string;
  name: string;
  price: number;
  reseller_price: number;
  duration: number;
  device_limit: number;
  features?: string[];
  description: string;
  status: string;
  is_popular?: boolean;
}

export default function ResellerPlansPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is reseller
    if (user?.role !== 'reseller') {
      router.push('/');
      return;
    }

    fetchPlans();
  }, [user, router]);

  const fetchPlans = async () => {
    try {
      const res = await adminApi.get('/plans');
      setPlans(res.data.data.filter((p: Plan) => p.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Plans</h1>
        <p className="text-text-secondary">View pricing for customer plans</p>
      </div>

      {/* Pricing Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="text-blue-400 mt-1" size={20} />
          <div>
            <h3 className="text-white font-semibold mb-1">Pricing Information</h3>
            <p className="text-sm text-text-secondary">
              <span className="text-green-400 font-medium">Reseller Price</span> is what you pay.{' '}
              <span className="text-blue-400 font-medium">Retail Price</span> is the suggested customer price.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const profit = plan.price - plan.reseller_price;
          const profitPercentage = ((profit / plan.reseller_price) * 100).toFixed(0);

          return (
            <div
              key={plan.uuid}
              className={`bg-background-card rounded-lg border ${
                plan.is_popular ? 'border-primary' : 'border-gray-800'
              } overflow-hidden relative`}
            >
              {plan.is_popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                  Popular
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-text-secondary mb-4">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-text-secondary">Retail Price:</span>
                    <span className="text-2xl font-bold text-blue-400">₹{plan.price}</span>
                    <span className="text-text-secondary">/{plan.duration} days</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-text-secondary">Your Cost:</span>
                    <span className="text-2xl font-bold text-green-400">₹{plan.reseller_price}</span>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded px-3 py-2">
                    <span className="text-sm text-purple-400 font-medium">
                      Profit: ₹{profit} ({profitPercentage}% margin)
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>{plan.duration} days validity</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>{plan.device_limit} device{plan.device_limit > 1 ? 's' : ''}</span>
                    </div>
                    {plan.features && plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-text-secondary">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => router.push('/reseller/customers')}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Assign to Customer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="bg-background-card rounded-lg border border-gray-800 p-12 text-center">
          <p className="text-text-secondary">No active plans available</p>
        </div>
      )}
    </div>
  );
}
