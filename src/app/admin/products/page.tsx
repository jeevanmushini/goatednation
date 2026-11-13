'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Package,
} from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { Product, ProductCategory } from '../../../types/product';
import ImageInputWithUpload from '../../../components/admin/ImageInputWithUpload';

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useCmsStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [anime, setAnime] = useState('Jujutsu Kaisen');
  const [category, setCategory] = useState<ProductCategory>('tees');
  const [price, setPrice] = useState('1499');
  const [originalPrice, setOriginalPrice] = useState('2499');
  const [discountPercent, setDiscountPercent] = useState('40');
  const [badge, setBadge] = useState('LIMITED DROP');
  const [image1, setImage1] = useState(
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'
  );
  const [image2, setImage2] = useState(
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'
  );
  const [description, setDescription] = useState(
    'Custom-milled 280 GSM heavyweight French terry cotton with relaxed drop-shoulder cut.'
  );
  const [gsm, setGsm] = useState('280 GSM Heavyweight French Terry');
  const [fabric, setFabric] = useState('100% Combed Bio-Washed Cotton');
  const [stockCount, setStockCount] = useState('15');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.anime.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setAnime('Jujutsu Kaisen');
    setCategory('tees');
    setPrice('1499');
    setOriginalPrice('2499');
    setDiscountPercent('40');
    setBadge('LIMITED DROP');
    setImage1(
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'
    );
    setImage2(
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80'
    );
    setDescription('Custom-milled 280 GSM heavyweight French terry cotton.');
    setStockCount('15');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setTitle(p.title);
    setAnime(p.anime);
    setCategory(p.category);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice.toString());
    setDiscountPercent(p.discountPercent.toString());
    setBadge(p.badge || '');
    setImage1(p.images[0] || '');
    setImage2(p.images[1] || '');
    setDescription(p.description);
    setGsm(p.details.gsm);
    setFabric(p.details.fabric);
    setStockCount(p.stockCount.toString());
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const productPayload: Product = {
      id: editingId || `as-${Date.now()}`,
      slug: (title || 'streetwear-drop').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      anime,
      category,
      price: Number(price) || 1499,
      originalPrice: Number(originalPrice) || 2499,
      discountPercent: Number(discountPercent) || 40,
      rating: 4.9,
      reviewCount: 42,
      badge: badge || undefined,
      images: [image1, image2].filter(Boolean),
      description,
      details: {
        gsm,
        fabric,
        fit: 'Signature Drop-Shoulder Oversized Streetwear Fit',
        printType: 'High-Density Puff + Distressed Screen Print',
        care: ['Machine wash cold inside-out', 'Do not iron print directly', 'Line dry in shade'],
      },
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Onyx Black', hex: '#111111', class: 'bg-[#111111]' },
        { name: 'Charcoal Slate', hex: '#262A30', class: 'bg-[#262A30]' },
      ],
      inStock: Number(stockCount) > 0,
      stockCount: Number(stockCount) || 10,
      reviews: [],
    };

    if (editingId) {
      updateProduct(editingId, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
            CATALOG MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <Package className="w-6 h-6 text-black" />
            STREETWEAR PRODUCTS ({products.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Create, edit, or delete oversized drops, upload images from your laptop, and manage pricing.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Drop</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or anime..."
            className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg pl-9 pr-3 py-2 text-xs text-black placeholder-[#888888] outline-none font-mono transition-colors"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto text-xs font-mono">
          {['all', 'tees', 'hoodies', 'acid-wash', 'jackets', 'cargo'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg uppercase transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-black text-white font-bold'
                  : 'bg-[#F2F2F2] text-[#666666] hover:text-black hover:bg-[#EAEAEA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-white border border-[#EAEAEA] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[#333333]">
            <thead className="bg-[#F8F8F8] text-[#555555] font-mono uppercase text-[11px] border-b border-[#EAEAEA]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Item</th>
                <th className="py-3.5 px-4 font-semibold">Franchise</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Price</th>
                <th className="py-3.5 px-4 font-semibold">Stock</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FBFBFB] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#F0F0F0] border border-[#EAEAEA] shrink-0">
                        <Image src={p.images[0]} alt={p.title} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-black truncate max-w-xs font-mono text-[11px]">{p.title}</div>
                        <div className="text-[10px] text-[#777777] font-mono">
                          {p.details.gsm.split(' ')[0]} GSM
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#FF4D00] font-bold">{p.anime}</td>
                  <td className="py-3 px-4 uppercase font-mono text-[#555555]">{p.category}</td>
                  <td className="py-3 px-4 font-mono font-bold text-black">
                    ₹{p.price.toLocaleString('en-IN')}
                    {p.discountPercent > 0 && (
                      <span className="text-[10px] text-[#16A34A] ml-1.5 font-normal">
                        ({p.discountPercent}% OFF)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stockCount > 5
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
                      }`}
                    >
                      {p.stockCount} in stock
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-black hover:text-white text-[#555555] transition-colors"
                        title="Edit Drop"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.title}"?`)) deleteProduct(p.id);
                        }}
                        className="p-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#DC2626] hover:text-white text-[#555555] transition-colors"
                        title="Delete Drop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA] mb-4">
              <h3 className="font-bold text-base text-black font-mono uppercase">
                {editingId ? 'Edit Streetwear Drop' : 'Create New Streetwear Drop'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#888888] hover:text-black rounded-lg hover:bg-[#F2F2F2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. RYUJIN DRAGON / JACQUARD JACKET"
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Anime Franchise</label>
                  <input
                    type="text"
                    required
                    value={anime}
                    onChange={(e) => setAnime(e.target.value)}
                    placeholder="e.g. Jujutsu Kaisen"
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Silhouette Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  >
                    <option value="tees">Oversized Tees</option>
                    <option value="hoodies">Heavy Hoodies</option>
                    <option value="acid-wash">Acid Wash</option>
                    <option value="jackets">Jackets &amp; Techwear</option>
                    <option value="cargo">Tactical Cargo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. SAVE 55%, LIMITED DROP"
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Fabric GSM</label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
                  />
                </div>
              </div>

              <ImageInputWithUpload
                label="Primary Product Image"
                value={image1}
                onChange={setImage1}
                category="products"
                placeholder="https://... or upload from your computer"
                required
              />

              <ImageInputWithUpload
                label="Secondary Hover Image"
                value={image2}
                onChange={setImage2}
                category="products"
                placeholder="https://... or upload from your computer"
              />

              <div>
                <label className="block text-xs font-mono font-semibold text-[#555555] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg p-2.5 text-xs text-black outline-none font-mono"
                />
              </div>

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
                  Save Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
