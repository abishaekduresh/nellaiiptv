'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
    } catch (error) {
      console.error('Failed to fetch plans', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (uuid: string) => {
    setSelectedPlan(uuid);
    setIsModalOpen(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await adminApi.delete(`/admin/plans/${uuid}`);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchPlans();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
        <button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-text-secondary">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-text-secondary">No plans found. Create one!</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.uuid} className="bg-background-card border border-gray-800 rounded-lg p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button
                        onClick={() => handleEdit(plan.uuid)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(plan.uuid)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

              <div className="mb-4 text-left">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    {plan.is_popular && (
                        <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-primary/30">Popular</span>
                    )}
                </div>
                <div className="space-y-1 mt-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-text-secondary font-normal">Retail Price</span>
                        <span className="text-xl font-bold text-white">₹{plan.price}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-text-secondary font-normal">Reseller Price</span>
                        <span className="text-xl font-bold text-primary">₹{plan.reseller_price || '0'}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-gray-800">
                        <span className="text-sm text-text-secondary font-normal">Margin</span>
                        <span className="text-lg font-bold text-green-400">₹{(parseFloat(plan.price.toString()) - parseFloat((plan.reseller_price || '0').toString())).toFixed(2)}</span>
                    </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                  <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="text-white">{plan.duration} Days</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Devices</span>
                      <span className="text-white">{plan.device_limit}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Status</span>
                      <span className={plan.status === 'active' ? 'text-green-400' : 'text-gray-400'}>{plan.status}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Visible To</span>
                      <span className={`capitalize ${
                          plan.show_to === 'reseller' ? 'text-blue-400' : 
                          plan.show_to === 'customer' ? 'text-yellow-400' : 
                          'text-white'
                      }`}>{plan.show_to || 'Both'}</span>
                  </div>
                  {(plan.features && plan.features.length > 0) && (
                      <div className="border-t border-gray-800 pt-2 mt-2">
                          <span className="text-xs uppercase font-bold text-slate-500">Features Preview</span>
                          <p className="line-clamp-2 text-xs mt-1 italic">{plan.features.join(', ')}</p>
                      </div>
                  )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                  {plan.platform_access && plan.platform_access.map(p => (
                      <span key={p} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 uppercase">
                          {p}
                      </span>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPlan ? 'Edit Plan' : 'Create Plan'}
      >
        <PlanForm
          planUuid={selectedPlan}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
