'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, Ban, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Users, UserCheck, UserX, Crown, Eye, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { Customer } from '@/types';
import Modal from '@/components/ui/Modal';
import CustomerForm from '@/components/admin/CustomerForm';
import CustomerOverviewModal from '@/components/admin/CustomerOverviewModal';
import AdminTopupModal from '@/components/admin/AdminTopupModal';


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [viewCustomerUuid, setViewCustomerUuid] = useState<string | null>(null);
  const [topupCustomer, setTopupCustomer] = useState<{uuid: string, name: string, wallet_balance: number} | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0, premium: 0 });

  const fetchStats = async () => {
    try {
        const res = await adminApi.get('/admin/customers/stats');
        setStats(res.data.data);
    } catch (e) {
        console.error("Failed to fetch stats", e);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/customers`, {
        params: {
          page,
          per_page: 20,
          search: search || undefined,
          status: statusFilter || undefined,
          role: roleFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      setCustomers(res.data.data.data);
      setTotalPages(res.data.data.last_page);
    } catch (error) {
      console.error('Failed to fetch customers', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter, roleFilter, sortBy, sortOrder]);

  const handleStatusUpdate = async (uuid: string, newStatus: string) => {
    try {
      await adminApi.put(`/admin/customers/${uuid}`, { status: newStatus });
        setCustomers(customers.map(c => 
            c.uuid === uuid ? { ...c, status: newStatus } : c
        ));
      toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'blocked'} successfully`);
    } catch (error: any) {
      console.error('Failed to update customer status - Full Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update customer status');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    try {
      await adminApi.delete(`/admin/customers/${uuid}`);
      toast.success('Customer deleted successfully');
      setCustomers(customers.filter((c) => c.uuid !== uuid));
      await fetchCustomers(); // Re-fetch to ensure sync with backend
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleEdit = (uuid: string) => {
      setSelectedCustomer(uuid);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setSelectedCustomer(null);
      setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
      setIsModalOpen(false);
      fetchCustomers();
  };

  const handleView = (uuid: string) => {
    setViewCustomerUuid(uuid);
  };

  const handleTopup = (customer: Customer) => {
      setTopupCustomer({
          uuid: customer.uuid,
          name: customer.name,
          wallet_balance: (customer as any).wallet_balance || 0
      });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="ml-1 text-gray-500" />;
    return sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1 text-primary" /> : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <button 
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
            <Plus size={20} />
            Add Customer
        </button>
      </div>

     {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-background-card p-5 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
                <p className="text-text-secondary text-sm mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Users size={24} />
            </div>
        </div>
        <div className="bg-background-card p-5 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
                <p className="text-text-secondary text-sm mb-1">Active Customers</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                <UserCheck size={24} />
            </div>
        </div>
         <div className="bg-background-card p-5 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
                <p className="text-text-secondary text-sm mb-1">Inactive / Blocked</p>
                <p className="text-2xl font-bold text-white">{stats.inactive + stats.blocked}</p>
            </div>
             <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                <UserX size={24} />
            </div>
        </div>
        <div className="bg-background-card p-5 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
                <p className="text-text-secondary text-sm mb-1">Premium Users</p>
                <p className="text-2xl font-bold text-white">{stats.premium}</p>
            </div>
             <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Crown size={24} />
            </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-background-card p-4 rounded-lg border border-gray-800 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary"
                />
            </div>
            
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                 <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                    <option value="id">Sort by ID</option>
                    <option value="name">Sort by Name</option>
                    <option value="phone">Sort by Phone</option>
                    <option value="created_at">Sort by Joined</option>
                    <option value="status">Sort by Status</option>
                </select>

                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="inactive">Inactive</option>
                </select>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-background border border-gray-800 text-text-secondary rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="reseller">Reseller</option>
                </select>
            </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-background-card rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-text-secondary text-sm uppercase">
              <tr>
                <th className="px-6 py-4">S.No</th>
                <th 
                    className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('name')}
                >
                    <div className="flex items-center">
                        Name {getSortIcon('name')}
                    </div>
                </th>
                <th 
                    className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('phone')}
                >
                    <div className="flex items-center">
                        Contact {getSortIcon('phone')}
                    </div>
                </th>
                <th 
                    className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('created_at')}
                >
                    <div className="flex items-center">
                        Joined Date {getSortIcon('created_at')}
                    </div>
                </th>
                <th className="px-6 py-4">Role</th>
                <th 
                    className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort('status')}
                >
                    <div className="flex items-center">
                        Status {getSortIcon('status')}
                    </div>
                </th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">Loading...</td>
                </tr>
              ) : customers.length === 0 ? (
                 <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">No customers found</td>
                </tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer.uuid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">
                        {(page - 1) * 20 + index + 1}
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-white">{customer.name}</div>
                        <div className="text-xs text-text-secondary">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                        {customer.phone}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                        {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          (customer as any).role === 'reseller'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {(customer as any).role === 'reseller' ? 'Reseller' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : customer.status === 'blocked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleView(customer.uuid)}
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 p-2 rounded transition-colors"
                            title="View Overview"
                        >
                            <Eye size={16} />
                        </button>

                        {(customer as any).role === 'reseller' && (
                            <button
                                onClick={() => handleTopup(customer)}
                                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded transition-colors"
                                title="Topup Wallet"
                            >
                                <Wallet size={16} />
                            </button>
                        )}

                        <button
                            onClick={() => handleEdit(customer.uuid)}
                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-2 rounded transition-colors"
                            title="Edit Customer"
                        >
                            <Edit size={16} />
                        </button>

                        {customer.status === 'blocked' ? (
                            <button
                                onClick={() => handleStatusUpdate(customer.uuid, 'active')}
                                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded transition-colors"
                                title="Unblock Customer"
                            >
                                <CheckCircle size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusUpdate(customer.uuid, 'blocked')}
                                className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 p-2 rounded transition-colors"
                                title="Block Customer"
                            >
                                <Ban size={16} />
                            </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(customer.uuid)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
            >
                Previous
            </button>
            <span className="text-text-secondary">Page {page} of {totalPages}</span>
            <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
            >
                Next
            </button>
        </div>
      </div>

    <CustomerOverviewModal
        uuid={viewCustomerUuid || ''}
        isOpen={!!viewCustomerUuid}
        onClose={() => setViewCustomerUuid(null)}
    />

    <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
    >
        <CustomerForm
            customerUuid={selectedCustomer}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsModalOpen(false)}
        />
    </Modal>

    {topupCustomer && (
        <AdminTopupModal
            customer={topupCustomer}
            onClose={() => setTopupCustomer(null)}
            onSuccess={() => {
                setTopupCustomer(null);
                fetchCustomers();
            }}
        />
    )}
    </div>
  );
}
