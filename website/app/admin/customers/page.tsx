'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, Ban, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Plus, Edit, Users, UserCheck, UserX, Crown, Eye, Wallet, Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminApi';
import { Customer } from '@/types';
import Modal from '@/components/ui/Modal';
import CustomerForm from '@/components/admin/CustomerForm';
import CustomerOverviewModal from '@/components/admin/CustomerOverviewModal';
import AdminTopupModal from '@/components/admin/AdminTopupModal';
import CustomerStreamsModal from '@/components/admin/CustomerStreamsModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [viewCustomerUuid, setViewCustomerUuid] = useState<string | null>(null);
  const [topupCustomer, setTopupCustomer] = useState<{ uuid: string; name: string; wallet_balance: number } | null>(null);
  const [streamsCustomer, setStreamsCustomer] = useState<{ uuid: string; name: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0, premium: 0 });

  const fetchStats = async () => {
    try {
      const res = await adminApi.get('/admin/customers/stats');
      setStats(res.data.data);
    } catch {}
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/customers', {
        params: { page, per_page: 20, search: search || undefined, status: statusFilter || undefined, role: roleFilter || undefined, sort_by: sortBy, sort_order: sortOrder },
      });
      setCustomers(res.data.data.data);
      setTotalPages(res.data.data.last_page);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter, sortBy, sortOrder]);
  useEffect(() => { fetchCustomers(); }, [page, search, statusFilter, roleFilter, sortBy, sortOrder]);

  const handleStatusUpdate = async (uuid: string, newStatus: string) => {
    try {
      await adminApi.put(`/admin/customers/${uuid}`, { status: newStatus });
      setCustomers(cs => cs.map(c => c.uuid === uuid ? { ...c, status: newStatus } : c));
      toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'blocked'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await adminApi.delete(`/admin/customers/${uuid}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown size={13} className="text-slate-600" />;
    return sortOrder === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />;
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Inactive / Blocked', value: stats.inactive + stats.blocked, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Premium', value: stats.premium, icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  ];

  const selectClass = "bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";

  const ThSort = ({ col, label }: { col: string; label: string }) => (
    <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort(col)}>
      <div className="flex items-center gap-1.5">{label} <SortIcon col={col} /></div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Customers</h1>
          <p className="text-slate-400 text-sm mt-1">Manage registered users and resellers</p>
        </div>
        <button
          onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
            </div>
            <div className={`w-10 h-10 ${bg} border ${border} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass}>
              <option value="id">Sort: ID</option>
              <option value="name">Sort: Name</option>
              <option value="phone">Sort: Phone</option>
              <option value="created_at">Sort: Joined</option>
              <option value="status">Sort: Status</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} className={selectClass}>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClass}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="reseller">Reseller</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.28s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">S.No</th>
                <ThSort col="name" label="Name" />
                <ThSort col="phone" label="Contact" />
                <ThSort col="created_at" label="Joined" />
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Role</th>
                <ThSort col="status" label="Status" />
                <th className="px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Loading customers...</span>
                  </div>
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Users size={32} className="opacity-30" />
                    <span className="text-sm">No customers found</span>
                  </div>
                </td></tr>
              ) : customers.map((cu, i) => (
                <tr key={cu.uuid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{(page - 1) * 20 + i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                        {cu.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{cu.name}</p>
                        <p className="text-slate-500 text-xs">{cu.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-sm">{cu.phone}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(cu.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(cu as any).role === 'reseller' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {(cu as any).role === 'reseller' ? 'Reseller' : 'Customer'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cu.status === 'active' ? 'bg-green-500/15 text-green-400'
                      : cu.status === 'blocked' ? 'bg-red-500/15 text-red-400'
                      : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {cu.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewCustomerUuid(cu.uuid)}
                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      {(cu as any).role === 'reseller' && (
                        <button onClick={() => setTopupCustomer({ uuid: cu.uuid, name: cu.name, wallet_balance: (cu as any).wallet_balance || 0 })}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Topup">
                          <Wallet size={14} />
                        </button>
                      )}
                      <button onClick={() => setStreamsCustomer({ uuid: cu.uuid, name: cu.name })}
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors" title="Assigned Streams">
                        <Radio size={14} />
                      </button>
                      <button onClick={() => { setSelectedCustomer(cu.uuid); setIsModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                        <Edit size={14} />
                      </button>
                      {cu.status === 'blocked' ? (
                        <button onClick={() => handleStatusUpdate(cu.uuid, 'active')}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="Unblock">
                          <CheckCircle size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleStatusUpdate(cu.uuid, 'blocked')}
                          className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors" title="Block">
                          <Ban size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(cu.uuid)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            <ChevronLeft size={15} /> Previous
          </button>
          <span className="text-slate-400 text-sm">Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span></span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <CustomerOverviewModal uuid={viewCustomerUuid || ''} isOpen={!!viewCustomerUuid} onClose={() => setViewCustomerUuid(null)} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}>
        <CustomerForm customerUuid={selectedCustomer} onSuccess={() => { setIsModalOpen(false); fetchCustomers(); }} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      {topupCustomer && (
        <AdminTopupModal customer={topupCustomer} onClose={() => setTopupCustomer(null)} onSuccess={() => { setTopupCustomer(null); fetchCustomers(); }} />
      )}
      {streamsCustomer && (
        <CustomerStreamsModal
          customerUuid={streamsCustomer.uuid}
          customerName={streamsCustomer.name}
          isOpen={!!streamsCustomer}
          onClose={() => setStreamsCustomer(null)}
        />
      )}
    </div>
  );
}
