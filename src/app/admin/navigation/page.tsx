'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, X, Compass } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { CmsNavigationItem } from '../../../types/cms';

export default function AdminNavigationPage() {
  const { navigation, updateNavigation } = useCmsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [badge, setBadge] = useState('');

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navigation.length) return;

    const updated = [...navigation];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateNavigation(reordered);
  };

  const handleToggle = (id: string) => {
    const updated = navigation.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateNavigation(updated);
  };

  const handleDelete = (id: string) => {
    updateNavigation(navigation.filter((item) => item.id !== id));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !href) return;

    const newItem: CmsNavigationItem = {
      id: `nav-${Date.now()}`,
      label: label.toUpperCase(),
      href,
      badge: badge || undefined,
      enabled: true,
      order: navigation.length + 1,
    };

    updateNavigation([...navigation, newItem]);
    setLabel('');
    setHref('');
    setBadge('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
            STOREFRONT NAVIGATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <Compass className="w-6 h-6 text-black" />
            HEADER &bull; NAVIGATION MENU
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Reorder menu links, add new collection shortcuts, and manage badge labels.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Nav List */}
      <div className="space-y-3">
        {navigation.map((item, index) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white border border-[#EAEAEA] shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 rounded-full bg-[#F0F0F0] text-black text-xs font-mono font-bold flex items-center justify-center border border-[#E0E0E0]">
                {index + 1}
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-black font-mono">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF4D00]/10 text-[#FF4D00]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#777777]">{item.href}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={index === 0}
                onClick={() => handleMove(index, 'up')}
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-[#555555] transition-colors disabled:opacity-20"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={index === navigation.length - 1}
                onClick={() => handleMove(index, 'down')}
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-[#555555] transition-colors disabled:opacity-20"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggle(item.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  item.enabled
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-[#DC2626]/10 text-[#DC2626]'
                }`}
              >
                {item.enabled ? 'Active' : 'Disabled'}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#DC2626] hover:text-white text-[#888888] transition-colors"
                title="Delete Link"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA] mb-4">
              <h3 className="font-bold text-sm text-black font-mono uppercase">Add Navigation Link</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#888888] hover:text-black rounded-lg hover:bg-[#F2F2F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Link Label</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. ACID WASH"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black uppercase outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Destination URL</label>
                <input
                  type="text"
                  required
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="e.g. /collections/acid-wash"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">
                  Optional Badge Tag
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. NEW, HOT"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#EAEAEA] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#333333] text-xs font-mono font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase shadow-sm"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
