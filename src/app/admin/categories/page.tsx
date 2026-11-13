'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, X, Layers } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { CmsCategory } from '../../../types/cms';
import ImageInputWithUpload from '../../../components/admin/ImageInputWithUpload';

export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCmsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [count, setCount] = useState('10+ Styles');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
  );
  const [slug, setSlug] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('280+ GSM Combed Heavy Cotton');
    setCount('12+ Styles');
    setImage(
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
    );
    setSlug('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: CmsCategory) => {
    setEditingId(c.id);
    setTitle(c.title);
    setSubtitle(c.subtitle);
    setCount(c.count);
    setImage(c.image);
    setSlug(c.slug);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingId) {
      updateCategory(editingId, { title, subtitle, count, image, slug: finalSlug });
    } else {
      addCategory({
        title,
        subtitle,
        count,
        image,
        slug: finalSlug,
        enabled: true,
        order: categories.length + 1,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
            SILHOUETTE ARCHITECTURE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <Layers className="w-6 h-6 text-black" />
            CATEGORIES &bull; CURATION ({categories.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Create or edit category tiles that appear on the homepage and catalog filter bars.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm hover:border-black transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-[#F5F5F5] mb-4 border border-[#EEEEEE]">
                <Image src={c.image} alt={c.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white transition-colors shadow-sm"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${c.title}"?`)) deleteCategory(c.id);
                    }}
                    className="p-1.5 rounded-lg bg-black/80 hover:bg-[#DC2626] text-white transition-colors shadow-sm"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#FF4D00] font-bold">
                  {c.count}
                </span>
                <span className="text-[10px] font-mono text-[#888888]">slug: /{c.slug}</span>
              </div>
              <h3 className="font-bold text-base text-black mt-0.5 font-mono">{c.title}</h3>
              <p className="text-xs text-[#666666] mt-1">{c.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA] mb-4">
              <h3 className="font-bold text-sm text-black font-mono uppercase">
                {editingId ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#888888] hover:text-black rounded-lg hover:bg-[#F2F2F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavy Hoodies"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 420 GSM Double French Terry"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Item Count Pill</label>
                  <input
                    type="text"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="e.g. 12+ Styles"
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. hoodies"
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
              </div>

              <ImageInputWithUpload
                label="Cover Image"
                value={image}
                onChange={setImage}
                category="categories"
                placeholder="https://... or upload from your computer"
                required
              />

              <div className="pt-3 border-t border-[#EAEAEA] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#333333] text-xs font-mono font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase transition-colors shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
