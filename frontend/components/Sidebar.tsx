'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Channels' },
    { id: 'news', name: 'News' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'movies', name: 'Movies' },
    { id: 'music', name: 'Music' },
    { id: 'kids', name: 'Kids' },
    { id: 'sports', name: 'Sports' },
    { id: 'spiritual', name: 'Spiritual' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 
        transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6 md:hidden">
            <h2 className="text-lg font-bold text-white">Filters</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${selectedCategory === category.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages (Placeholder) */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Languages
              </h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Tamil
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  English
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Malayalam
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
