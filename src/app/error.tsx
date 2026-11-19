'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global App Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-xs text-center space-y-5">
        <div className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold tracking-widest uppercase">
          SYSTEM FAULT // 500
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
          SOMETHING WENT WRONG
        </h1>
        <p className="text-xs text-[#666666] leading-relaxed">
          An unexpected glitch occurred while rendering this interface. Our syndicate engineers have been notified.
        </p>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>TRY AGAIN</span>
          </button>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-lg border border-[#D5D5D5] hover:border-black text-black text-xs uppercase tracking-widest font-bold transition-colors"
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
