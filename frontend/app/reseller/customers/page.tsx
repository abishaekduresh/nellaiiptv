'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import PlanAssignmentModal from '@/components/reseller/PlanAssignmentModal';

interface Customer {
  uuid: string;
  name: string;
  email?: string;
  phone: string;
  status: string;
  plan?: {
    uuid: string;
    name: string;
  };
  subscription_expires_at?: string;
}

export default function ResellerCustomersPage() {
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchedCustomer, setSearchedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/reseller/customers');
      setCustomers(res.data.data.data || res.data.data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const handleSearchByPhone = async () => {
    if (!phoneSearch.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/reseller/customers/search', {
        params: { phone: phoneSearch }
      });
      
      if (res.data.data) {
        setSearchedCustomer(res.data.data);
        setShowCreateForm(false);
        toast.success('Customer found!');
      } else {
        setSearchedCustomer(null);
        setShowCreateForm(true);
        toast('Customer not found. You can create a new one.');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchedCustomer(null);
        setShowCreateForm(true);
        setFormData({ ...formData, phone: phoneSearch });
        toast('Customer not found. You can create a new one.');
      } else {
        toast.error('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/reseller/customers', formData);
      toast.success('Customer created successfully');
      setShowCreateForm(false);
      setFormData({ name: '', phone: '', email: '', password: '' });
      setPhoneSearch('');
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPlanModal(true);
  };

  const handlePlanAssigned = () => {
    setShowPlanModal(false);
    setSelectedCustomer(null);
    fetchCustomers();
    if (searchedCustomer) {
      handleSearchByPhone(); // Refresh search result
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Customers</h1>
        <p className="text-text-secondary">Manage and assign plans to your customers</p>
      </div>

      {/* Phone Search */}
      <div className="bg-background-card rounded-lg border border-gray-800 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Search Customer by Phone</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="tel"
              value={phoneSearch}
              onChange={(e) => {
                // Allow only numbers
                const value = e.target.value.replace(/\D/g, '');
                setPhoneSearch(value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchByPhone()}
              placeholder="Enter exact phone number..."
              pattern="[0-9]*"
              className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleSearchByPhone}
            disabled={loading}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Search size={20} />
            Search
          </button>
        </div>

        {/* Search Result */}
        {searchedCustomer && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold">{searchedCustomer.name}</h3>
                  {(searchedCustomer as any).is_owned_by_reseller ? (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                      Your Customer
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                      Other
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">{searchedCustomer.phone}</p>
                {searchedCustomer.email && (
                  <p className="text-sm text-text-secondary">{searchedCustomer.email}</p>
                )}
                <div className="mt-2">
                  {searchedCustomer.plan ? (
                    <span className="text-sm text-green-400">
                      Plan: {searchedCustomer.plan.name} | Expires: {new Date(searchedCustomer.subscription_expires_at!).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-400">No active plan</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAssignPlan(searchedCustomer)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors flex items-center gap-2"
              >
                <DollarSign size={16} />
                Assign Plan
              </button>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="text-white font-semibold mb-4">Create New Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Customers List */}
      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">All Customers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.uuid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{customer.name}</div>
                      {customer.email && (
                        <div className="text-xs text-text-secondary">{customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{customer.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.plan
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {customer.plan?.name || 'No Plan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {customer.subscription_expires_at
                        ? new Date(customer.subscription_expires_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleAssignPlan(customer)}
                        className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors flex items-center gap-2 text-sm"
                      >
                        <DollarSign size={14} />
                        Assign Plan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Assignment Modal */}
      {showPlanModal && selectedCustomer && (
        <PlanAssignmentModal
          customer={selectedCustomer}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedCustomer(null);
          }}
          onSuccess={handlePlanAssigned}
        />
      )}
    </div>
  );
}
