import Link from 'next/link';
import { ZeninHeader } from '../components/zenin/ZeninHeader';
import { ZeninFooter } from '../components/zenin/ZeninFooter';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninHeader />

      <main className="flex-1 flex items-center justify-center py-24 px-4 text-center font-mono">
        <div className="max-w-md w-full space-y-6">
          <div className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold tracking-widest uppercase">
            404 // NOT FOUND
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-black">
            DROP OUT OF BOUNDS
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            The page or limited streetwear drop you requested does not exist or has been vaulted into the syndicate archives.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs uppercase font-bold tracking-widest transition-colors shadow-sm"
            >
              Return Home
            </Link>
            <Link
              href="/collections"
              className="px-6 py-3 rounded-lg border border-[#D5D5D5] hover:border-black text-black text-xs uppercase font-bold tracking-widest transition-colors"
            >
              Explore Drops
            </Link>
          </div>
        </div>
      </main>

      <ZeninFooter />
    </div>
  );
}
