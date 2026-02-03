'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Category, Language } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  selectedLanguage?: string;
  onLanguageChange?: (languageId: string) => void;
}

const Sidebar = ({ 
  isOpen, 
  onClose, 
  selectedCategory: initialCategory = 'all',
  onCategoryChange,
  selectedLanguage: initialLanguage = 'all',
  onLanguageChange
}: SidebarProps) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, langsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/languages')
        ]);

        if (catsRes.data.status) {
          const cats = catsRes.data.data;
          cats.sort((a: Category, b: Category) => {
            if (a.order_number !== b.order_number) {
              return (a.order_number ?? 999) - (b.order_number ?? 999);
            }
            return a.name.localeCompare(b.name);
          });
          setCategories(cats);
        }

        if (langsRes.data.status) {
          const langs = langsRes.data.data;
          langs.sort((a: Language, b: Language) => {
            if (a.order_number !== b.order_number) {
              return (a.order_number ?? 999) - (b.order_number ?? 999);
            }
            return a.name.localeCompare(b.name);
          });
          setLanguages(langs);
        }
      } catch (err) {
        console.error('Failed to fetch sidebar data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    if (onCategoryChange) onCategoryChange(id);
  };

  const handleLanguageClick = (id: string) => {
    setSelectedLanguage(id);
    if (onLanguageChange) onLanguageChange(id);
  };

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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
              <Loader2 className="animate-spin" />
              <span className="text-xs">Loading filters...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryClick('all')}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${selectedCategory === 'all' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    All Channels
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.uuid}
                      onClick={() => handleCategoryClick(category.uuid)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${selectedCategory === category.uuid 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                      `}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                   Languages
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleLanguageClick('all')}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${selectedLanguage === 'all' 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    All Languages
                  </button>
                  {languages.map((language) => (
                    <button
                      key={language.uuid}
                      onClick={() => handleLanguageClick(language.uuid)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${selectedLanguage === language.uuid 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                      `}
                    >
                      {language.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
