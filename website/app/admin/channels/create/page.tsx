'use client';

import ChannelForm from '@/components/admin/ChannelForm';

export default function CreateChannelPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Add New Channel</h1>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800">
        <ChannelForm />
      </div>
    </div>
  );
}
