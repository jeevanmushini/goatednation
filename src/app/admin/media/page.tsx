'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Upload,
  Link,
  Copy,
  Check,
  Trash2,
  X,
  Plus,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { CmsMediaItem } from '../../../types/cms';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FileUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

type TabType = 'upload' | 'url';
type MediaCategory = 'banners' | 'products' | 'categories' | 'editorial';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
const MAX_SIZE_MB = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminMediaPage() {
  const { media, addMedia, deleteMedia } = useCmsStore();

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  // ── Upload tab state ──
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('products');
  const [fileQueue, setFileQueue] = useState<FileUploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── URL tab state ──
  const [urlName, setUrlName] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [urlCategory, setUrlCategory] = useState<MediaCategory>('banners');
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // ── Filtered list ──
  const filteredMedia = media.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  // ─── Drag & Drop ───────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const validFiles: FileUploadItem[] = [];

    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`"${file.name}" is not a supported format. Use JPG, PNG, WebP, AVIF, GIF, or SVG.`);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB size limit.`);
        return;
      }

      validFiles.push({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'idle',
        progress: 0,
      });
    });

    setFileQueue((prev) => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        addFilesToQueue(e.dataTransfer.files);
      }
    },
    [addFilesToQueue]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFilesToQueue(e.target.files);
      e.target.value = '';
    }
  };

  // ─── Upload Handler ────────────────────────────────────────────────────────

  const uploadFile = async (item: FileUploadItem) => {
    setFileQueue((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('category', uploadCategory);

      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90);
            setFileQueue((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success) {
                resolve(data.url);
              } else {
                reject(new Error(data.error || 'Upload failed'));
              }
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', '/api/media/upload');
        xhr.send(formData);
      });

      // Add to CMS store
      const sizeLabel = item.file.size > 1024 * 1024
        ? `${(item.file.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(item.file.size / 1024)} KB`;

      addMedia({
        name: item.file.name,
        url: uploadedUrl,
        category: uploadCategory,
        size: sizeLabel,
      });

      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'done', progress: 100, uploadedUrl }
            : f
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'error', progress: 0, error: errorMsg } : f
        )
      );
    }
  };

  const uploadAll = () => {
    fileQueue
      .filter((f) => f.status === 'idle')
      .forEach((f) => uploadFile(f));
  };

  const removeFromQueue = (id: string) => {
    setFileQueue((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearDoneItems = () => {
    setFileQueue((prev) => {
      prev.filter((f) => f.status === 'done').forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return prev.filter((f) => f.status !== 'done');
    });
  };

  // ─── URL Import ────────────────────────────────────────────────────────────

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlName || !urlValue) return;
    setIsAddingUrl(true);
    addMedia({ name: urlName, url: urlValue, category: urlCategory, size: 'External' });
    setUrlName('');
    setUrlValue('');
    setTimeout(() => setIsAddingUrl(false), 600);
  };

  // ─── Copy URL ──────────────────────────────────────────────────────────────

  const handleCopy = (m: CmsMediaItem) => {
    navigator.clipboard.writeText(m.url);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const idleCount = fileQueue.filter((f) => f.status === 'idle').length;
  const doneCount = fileQueue.filter((f) => f.status === 'done').length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D00]">
            DIGITAL ASSET STORAGE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mt-1 flex items-center gap-2 font-mono">
            <ImageIcon className="w-6 h-6 text-black" />
            MEDIA ASSET LIBRARY ({media.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Upload images from your laptop or import via URL — instantly available across all storefront sections.
          </p>
        </div>
      </div>

      {/* ── Upload / URL Tabs ── */}
      <div className="p-6 rounded-xl bg-white border border-[#EAEAEA] shadow-sm">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#F2F2F2] border border-[#E5E5E5] mb-5 w-fit">
          {([
            { id: 'upload', label: 'Upload from Laptop', Icon: Upload },
            { id: 'url', label: 'Import via URL', Icon: Link },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-bold uppercase transition-all ${
                activeTab === id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-[#666666] hover:text-black'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── UPLOAD TAB ── */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="text-[11px] font-mono text-[#555555] mb-1 block uppercase tracking-wider font-semibold">
                Target Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
                className="bg-white border border-[#D5D5D5] focus:border-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              >
                <option value="products">Product Artwork</option>
                <option value="banners">Promotional Banner</option>
                <option value="categories">Category Tile</option>
                <option value="editorial">Editorial / Lookbook</option>
              </select>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-black bg-black/5'
                  : 'border-[#D0D0D0] hover:border-black bg-[#FAFAFA] hover:bg-[#F5F5F5]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className={`p-4 rounded-xl mb-3 ${isDragging ? 'bg-black/10' : 'bg-white border border-[#EAEAEA]'}`}>
                <ImageIcon className={`w-8 h-8 ${isDragging ? 'text-black' : 'text-[#666666]'}`} />
              </div>
              <p className="text-sm font-bold text-black text-center font-mono uppercase">
                {isDragging ? 'Drop image files here' : 'Drag & drop image files from laptop'}
              </p>
              <p className="text-xs text-[#777777] text-center mt-1 font-mono">
                or <span className="text-black font-bold underline">click to select from your computer</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                {['JPG', 'PNG', 'WebP', 'AVIF', 'GIF', 'SVG'].map((ext) => (
                  <span key={ext} className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#EEEEEE] text-[#555555]">
                    {ext}
                  </span>
                ))}
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#EEEEEE] text-[#555555]">
                  Max 10 MB
                </span>
              </div>
            </div>

            {/* File Queue */}
            {fileQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#666666] uppercase font-semibold">
                    {fileQueue.length} file{fileQueue.length !== 1 ? 's' : ''} queued
                  </span>
                  <div className="flex gap-2">
                    {doneCount > 0 && (
                      <button
                        onClick={clearDoneItems}
                        className="text-[11px] font-mono text-[#666666] hover:text-black underline"
                      >
                        Clear done
                      </button>
                    )}
                    {idleCount > 0 && (
                      <button
                        onClick={uploadAll}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload All ({idleCount})
                      </button>
                    )}
                  </div>
                </div>

                {fileQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#EEEEEE] shrink-0 border border-[#E0E0E0]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-black font-semibold truncate font-mono">{item.file.name}</p>
                      <p className="text-[10px] text-[#777777] font-mono">
                        {(item.file.size / 1024).toFixed(0)} KB · {item.file.type.split('/')[1]?.toUpperCase()}
                      </p>

                      {/* Progress bar */}
                      {item.status === 'uploading' && (
                        <div className="mt-1.5 h-1 bg-[#E0E0E0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error message */}
                      {item.status === 'error' && item.error && (
                        <p className="text-[10px] text-[#DC2626] font-mono mt-0.5">{item.error}</p>
                      )}

                      {/* Success URL */}
                      {item.status === 'done' && item.uploadedUrl && (
                        <p className="text-[10px] text-[#16A34A] font-mono mt-0.5 truncate font-semibold">
                          ✓ {item.uploadedUrl}
                        </p>
                      )}
                    </div>

                    {/* Status Icon / Actions */}
                    <div className="shrink-0 flex items-center gap-2">
                      {item.status === 'idle' && (
                        <button
                          onClick={() => uploadFile(item)}
                          className="px-3 py-1.5 rounded-lg bg-black text-white font-mono font-bold text-[10px] uppercase hover:bg-neutral-800 transition-colors shadow-sm"
                        >
                          Upload
                        </button>
                      )}
                      {item.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-black animate-spin" />
                      )}
                      {item.status === 'done' && (
                        <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                      )}

                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1 text-[#888888] hover:text-[#DC2626] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── URL TAB ── */}
        {activeTab === 'url' && (
          <form onSubmit={handleAddUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-[#555555] mb-1 uppercase tracking-wider">Asset Name</label>
              <input
                type="text"
                required
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                placeholder="e.g. Zenin Streetwear Lookbook Banner"
                className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#555555] mb-1 uppercase tracking-wider">Asset Category</label>
              <select
                value={urlCategory}
                onChange={(e) => setUrlCategory(e.target.value as MediaCategory)}
                className="w-full bg-white border border-[#D5D5D5] focus:border-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              >
                <option value="products">Product Artwork</option>
                <option value="banners">Promotional Banner</option>
                <option value="categories">Category Tile</option>
                <option value="editorial">Editorial / Lookbook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#555555] mb-1 uppercase tracking-wider">Public Image URL</label>
              <input
                type="url"
                required
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://zenin.co.in/cdn/shop/files/..."
                className="w-full bg-white border border-[#D5D5D5] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase transition-all shadow-sm"
            >
              {isAddingUrl ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {isAddingUrl ? 'Added!' : 'Add to Library'}
            </button>
          </form>
        )}
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {['all', 'banners', 'products', 'categories', 'editorial'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg uppercase transition-colors ${
              selectedCategory === cat
                ? 'bg-black text-white font-bold'
                : 'bg-[#F2F2F2] text-[#666666] hover:text-black hover:bg-[#EAEAEA]'
            }`}
          >
            {cat}
            {cat !== 'all' && (
              <span className="ml-1.5 text-[9px] opacity-70">
                ({media.filter((m) => m.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Media Grid ── */}
      {filteredMedia.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-[#EAEAEA]">
          <div className="p-4 rounded-xl bg-[#F5F5F5] mb-3">
            <FolderOpen className="w-8 h-8 text-[#888888]" />
          </div>
          <p className="text-sm font-bold text-black font-mono uppercase">No media assets in this view</p>
          <p className="text-xs text-[#777777] mt-1 font-mono">
            Upload images from your laptop or import via URL above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredMedia.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-white border border-[#EAEAEA] shadow-sm hover:border-black transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#F5F5F5] mb-3 border border-[#EEEEEE]">
                  <Image
                    src={m.url}
                    alt={m.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                    unoptimized={m.url.startsWith('/uploads/')}
                  />
                  <span className="absolute top-2 left-2 text-[9px] font-mono px-2 py-0.5 rounded bg-black text-white uppercase font-bold">
                    {m.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-black truncate font-mono" title={m.name}>
                  {m.name}
                </h4>
                <div className="text-[10px] text-[#777777] font-mono mt-0.5">
                  {m.size} &bull; {m.uploadedAt}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                <button
                  onClick={() => handleCopy(m)}
                  className="flex items-center space-x-1 text-[11px] font-mono text-[#555555] hover:text-black transition-colors"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[#16A34A] font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete media asset "${m.name}"?`)) deleteMedia(m.id);
                  }}
                  className="p-1 rounded text-[#888888] hover:text-[#DC2626] transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
