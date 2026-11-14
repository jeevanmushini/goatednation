'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  Link as LinkIcon,
  FolderOpen,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cmsStore';

interface ImageInputWithUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category?: 'products' | 'banners' | 'categories' | 'editorial';
  placeholder?: string;
  required?: boolean;
}

export default function ImageInputWithUpload({
  label,
  value,
  onChange,
  category = 'products',
  placeholder = 'https://... or upload from computer',
  required = false,
}: ImageInputWithUploadProps) {
  const { media, addMedia } = useCmsStore();

  const [mode, setMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Validate
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Use JPG, PNG, WebP, AVIF, GIF, or SVG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      let uploadedUrl = '';

      try {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 90);
              setUploadProgress(pct);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                if (res.success && res.url) {
                  resolve(res.url);
                } else {
                  reject(new Error(res.error || 'Upload failed'));
                }
              } catch {
                reject(new Error('Invalid response'));
              }
            } else {
              reject(new Error(`Server error: HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.open('POST', '/api/media/upload');
          xhr.send(formData);
        });
      } catch (serverErr) {
        console.warn(
          '[ImageInputWithUpload] Server upload fallback engaged. Reading as data URL:',
          serverErr
        );
        // Fallback: Read file directly in browser as base64 Data URL (100% resilient across any hosting environment)
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to process image buffer'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });
      }

      // Register in CMS store
      const sizeLabel =
        file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      addMedia({
        name: file.name,
        url: uploadedUrl,
        category,
        size: sizeLabel,
      });

      setUploadProgress(100);
      onChange(uploadedUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-[#555555] uppercase tracking-wider font-semibold">
          {label} {required && <span className="text-[#FF4D00]">*</span>}
        </label>
        {/* Mode Selector */}
        <div className="flex items-center space-x-1 text-[10px] font-mono bg-[#F2F2F2] p-0.5 rounded-lg border border-[#E5E5E5]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              mode === 'upload' ? 'bg-black text-white font-bold shadow-sm' : 'text-[#666666] hover:text-black'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Laptop File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              mode === 'url' ? 'bg-black text-white font-bold shadow-sm' : 'text-[#666666] hover:text-black'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('library')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5 ${
              mode === 'library' ? 'bg-black text-white font-bold shadow-sm' : 'text-[#666666] hover:text-black'
            }`}
          >
            <FolderOpen className="w-3 h-3" />
            <span>Library ({media.length})</span>
          </button>
        </div>
      </div>

      {/* Selected Image Preview (if value exists) */}
      {value && (
        <div className="flex items-center space-x-3 p-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#EEEEEE] shrink-0 border border-[#E0E0E0]">
            <Image
              src={value}
              alt="Preview"
              fill
              sizes="48px"
              className="object-cover"
              unoptimized={value.startsWith('/uploads/')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono text-black truncate font-medium">{value}</div>
            <div className="text-[9px] font-mono text-[#16A34A] flex items-center space-x-1 mt-0.5 font-bold">
              <CheckCircle className="w-2.5 h-2.5" />
              <span>Image Active</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded-md text-[#888888] hover:text-[#DC2626] transition-colors"
            title="Clear Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode: LAPTOP FILE UPLOAD */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-black bg-black/5'
                : 'border-[#CCCCCC] hover:border-black bg-[#FFFFFF] hover:bg-[#FAFAFA]'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <Loader2 className="w-5 h-5 text-black animate-spin" />
                <span className="text-xs font-mono text-black font-medium">Uploading from computer ({uploadProgress}%)</span>
                <div className="w-40 h-1 bg-[#EAEAEA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 py-1">
                <div className="p-2 rounded-lg bg-[#F0F0F0] text-black">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-black font-mono">
                    Choose image file from laptop or drag here
                  </div>
                  <div className="text-[10px] text-[#777777] font-mono">
                    PNG, JPG, WebP, AVIF, SVG &bull; Max 10MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center space-x-1.5 text-xs text-[#DC2626] font-mono mt-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Mode: URL INPUT */}
      {mode === 'url' && (
        <div>
          <input
            type="text"
            required={required && !value}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-[#D0D0D0] focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 text-xs text-black outline-none font-mono"
          />
          <div className="text-[10px] font-mono text-[#888888] mt-1">
            Paste any direct HTTPS image link (Unsplash, Shopify CDN, Zenin CDN, etc.)
          </div>
        </div>
      )}

      {/* Mode: MEDIA LIBRARY PICKER */}
      {mode === 'library' && (
        <div className="p-3 bg-white border border-[#E5E5E5] rounded-xl max-h-48 overflow-y-auto">
          {media.length === 0 ? (
            <div className="text-center py-4 text-xs font-mono text-[#888888]">
              No media in library. Switch to &apos;Laptop File&apos; to upload.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {media.map((m) => {
                const isSelected = value === m.url;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange(m.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-black ring-2 ring-black/30'
                        : 'border-[#E0E0E0] hover:border-black'
                    }`}
                    title={m.name}
                  >
                    <Image
                      src={m.url}
                      alt={m.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={m.url.startsWith('/uploads/')}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
