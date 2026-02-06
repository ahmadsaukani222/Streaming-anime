import { Loader2 } from 'lucide-react';

/**
 * PageLoader - Simple loading state for lazy-loaded pages
 * Shows while code chunks are being loaded
 */
export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-[#0F0F1A]">
      <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
      <p className="mt-4 text-white/60 text-sm">Memuat halaman...</p>
    </div>
  );
}
