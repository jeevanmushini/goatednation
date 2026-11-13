'use client';

import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  const sizeChartInches = [
    { size: 'S', chest: '44', length: '28', shoulder: '21' },
    { size: 'M', chest: '46', length: '29', shoulder: '22' },
    { size: 'L', chest: '48', length: '30', shoulder: '23' },
    { size: 'XL', chest: '50', length: '31', shoulder: '24' },
    { size: 'XXL', chest: '52', length: '32', shoulder: '25' },
  ];

  const sizeChartCm = [
    { size: 'S', chest: '112', length: '71', shoulder: '53' },
    { size: 'M', chest: '117', length: '74', shoulder: '56' },
    { size: 'L', chest: '122', length: '76', shoulder: '58' },
    { size: 'XL', chest: '127', length: '79', shoulder: '61' },
    { size: 'XXL', chest: '132', length: '81', shoulder: '63' },
  ];

  const activeChart = unit === 'inches' ? sizeChartInches : sizeChartCm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-[#E8FF00]" />
            <h3 className="font-bold text-base text-white tracking-wide">
              OVERSIZED STREETWEAR SIZE GUIDE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#777777] hover:text-white hover:bg-[#1E1E1E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between py-4">
          <p className="text-xs text-[#A0A0A0]">
            Our garments feature a signature relaxed drop-shoulder cut.
          </p>
          <div className="flex bg-[#1A1A1A] rounded-lg p-0.5 border border-[#262626] text-xs font-mono">
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded-md transition-all ${
                unit === 'inches'
                  ? 'bg-[#E8FF00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              IN
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-md transition-all ${
                unit === 'cm'
                  ? 'bg-[#E8FF00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto rounded-xl border border-[#222222]">
          <table className="w-full text-xs text-left text-[#CCCCCC]">
            <thead className="bg-[#181818] text-[#888888] font-mono uppercase">
              <tr>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Chest ({unit})</th>
                <th className="py-2.5 px-3">Length ({unit})</th>
                <th className="py-2.5 px-3">Shoulder ({unit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C] font-mono">
              {activeChart.map((row) => (
                <tr key={row.size} className="hover:bg-[#161616]">
                  <td className="py-2.5 px-3 font-bold text-[#E8FF00]">{row.size}</td>
                  <td className="py-2.5 px-3">{row.chest}</td>
                  <td className="py-2.5 px-3">{row.length}</td>
                  <td className="py-2.5 px-3">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-[#0E0E0E] rounded-lg border border-[#1E1E1E] text-[11px] text-[#888888] space-y-1">
          <p>
            <strong className="text-white">Fit Recommendation:</strong> If you want the intended modern oversized look, choose your regular size. For a regular standard fit, size down by one.
          </p>
        </div>
      </div>
    </div>
  );
};

