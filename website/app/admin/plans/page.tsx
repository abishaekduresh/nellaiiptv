'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Hash, CheckCircle, Monitor, Smartphone, Tv } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { SubscriptionPlan } from '@/types';
import Modal from '@/components/ui/Modal';
import PlanForm from '@/components/admin/PlanForm';

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/plans');
      setPlans(res.data.data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await adminApi.delete(`/admin/plans/${uuid}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const platformIcon = (p: string) => {
    if (p === 'web') return <Monitor size={12} />;
    if (p === 'tv') return <Tv size={12} />;
    return <Smartphone size={12} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Subscription Plans</h1>
          <p className="text-slate-400 text-sm mt-1">Manage pricing plans for customers and resellers</p>
        </div>
        <button
          onClick={() => { setSelectedPlan(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Add Plan
        </button>
      </div>

      {/* Plan grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 animate-fade-up">
          <svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-500 animate-fade-up">
          <Hash size={32} className="opacity-30" />
          <p className="text-sm">No plans found. Create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {plans.map((plan) => (
            <div key={plan.uuid} className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setSelectedPlan(plan.uuid); setIsModalOpen(true); }}
                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(plan.uuid)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Plan name + badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <Hash size={16} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">{plan.name}</h3>
                    {plan.is_popular && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border border-primary/20">Popular</span>
                    )}
                  </div>
                  <p className={`text-xs capitalize font-medium ${plan.status === 'active' ? 'text-green-400' : 'text-slate-500'}`}>{plan.status}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Retail</span>
                  <span className="text-xl font-black text-white">₹{plan.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Reseller</span>
                  <span className="text-lg font-bold text-primary">₹{plan.reseller_price || '0'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                  <span className="text-slate-400 text-sm">Margin</span>
                  <span className="text-green-400 font-bold">
                    ₹{(parseFloat(plan.price.toString()) - parseFloat((plan.reseller_price || '0').toString())).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-medium">{plan.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Devices</span>
                  <span className="text-white font-medium">{plan.device_limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Visible to</span>
                  <span className={`font-medium capitalize ${
                    plan.show_to === 'reseller' ? 'text-blue-400'
                    : plan.show_to === 'customer' ? 'text-yellow-400'
                    : 'text-white'
                  }`}>{plan.show_to || 'Both'}</span>
                </div>
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="mb-4 space-y-1">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <CheckCircle size={11} className="text-green-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <p className="text-xs text-slate-500 pl-5">+{plan.features.length - 3} more</p>
                  )}
                </div>
              )}

              {/* Platforms */}
              {plan.platform_access && plan.platform_access.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                  {plan.platform_access.map(p => (
                    <span key={p} className="flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-xs font-medium uppercase">
                      {platformIcon(p)} {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPlan ? 'Edit Plan' : 'Create Plan'}>
        <PlanForm planUuid={selectedPlan} onSuccess={() => { setIsModalOpen(false); fetchPlans(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
