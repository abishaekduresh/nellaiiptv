'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import adminApi from '@/lib/adminApi';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.coerce.number().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  status: z.enum(['active', 'blocked', 'inactive']).default('active'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customerUuid?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customerUuid, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'active',
    },
  });

  useEffect(() => {
    if (customerUuid) {
      fetchCustomer(customerUuid);
    }
  }, [customerUuid]);

  const fetchCustomer = async (uuid: string) => {
    setFetching(true);
    try {
      const res = await adminApi.get(`/admin/customers/${uuid}`);
      const customer = res.data.data;
      setValue('name', customer.name);
      setValue('email', customer.email || '');
      setValue('phone', customer.phone);
      setValue('status', customer.status);
      // Password is not fetched
    } catch (error) {
      toast.error('Failed to fetch customer details');
      onCancel();
    } finally {
      setFetching(false);
    }
  };

  const onSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    setLoading(true);
    try {
      if (customerUuid) {
        await adminApi.put(`/admin/customers/${customerUuid}`, data);
        toast.success('Customer updated successfully');
      } else {
        await adminApi.post('/admin/customers', data);
        toast.success('Customer created successfully');
      }
      onSuccess();
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Operation failed';
        toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return <div className="p-8 text-center text-text-secondary">Loading customer details...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
        <input
          {...register('name')}
          type="text"
          className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
          placeholder="Enter full name"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
        <input
          {...register('phone')}
          type="text" // Input is text, but safely coerced to number by zod
          className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
          placeholder="Enter phone number"
        />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Email <span className="text-xs text-gray-500">(Optional)</span></label>
        <input
          {...register('email')}
          type="email"
          className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
          placeholder="Enter email address"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
            {customerUuid ? 'New Password' : 'Password'} <span className="text-xs text-gray-500">
                {customerUuid ? '(Leave blank to keep current)' : '(Optional)'}
            </span>
        </label>
        <input
          {...register('password')}
          type="password"
          className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
          placeholder={customerUuid ? "Enter to change password" : "Enter password"}
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full bg-background border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-primary"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
        {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : (customerUuid ? 'Update Customer' : 'Create Customer')}
        </button>
      </div>
    </form>
  );
}
