/**
 * Generate clean slug dari title anime (tanpa ID)
 * Fungsi ini sama dengan yang ada di backend
 */
export function generateCleanSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Hapus karakter special
    .replace(/\s+/g, '-') // Spasi jadi dash
    .replace(/-+/g, '-') // Multiple dash jadi satu
    .replace(/^-|-$/g, ''); // Hapus dash di awal/akhir
}

/**
 * Get anime URL dengan format clean (tanpa ID)
 */
export function getAnimeUrl(anime: { id: string; title: string; cleanSlug?: string }): string {
  // Prioritaskan cleanSlug jika tersedia dari API
  if (anime.cleanSlug) {
    return `/anime/${encodeURIComponent(anime.cleanSlug)}`;
  }
  
  // Fallback: generate dari title
  const slug = generateCleanSlug(anime.title);
  if (slug) {
    return `/anime/${encodeURIComponent(slug)}`;
  }
  
  // Fallback terakhir: pakai id asli
  return `/anime/${encodeURIComponent(anime.id)}`;
}

/**
 * Get watch URL dengan format clean (tanpa ID)
 */
export function getWatchUrl(anime: { id: string; title: string; cleanSlug?: string }, episode: number): string {
  // Prioritaskan cleanSlug jika tersedia dari API
  if (anime.cleanSlug) {
    return `/watch/${encodeURIComponent(anime.cleanSlug)}/${episode}`;
  }
  
  // Fallback: generate dari title
  const slug = generateCleanSlug(anime.title);
  if (slug) {
    return `/watch/${encodeURIComponent(slug)}/${episode}`;
  }
  
  // Fallback terakhir: pakai id asli
  return `/watch/${encodeURIComponent(anime.id)}/${episode}`;
}

/**
 * Get optimized image URL (WebP/AVIF) dengan fallback
 * Mengubah URL .jpg/.png ke .webp untuk performa lebih baik
 */
export function getOptimizedImageUrl(url: string, format: 'webp' | 'avif' = 'webp'): string {
  if (!url) return '';
  
  // Jika URL sudah dalam format optimized, return as-is
  if (url.endsWith('.webp') || url.endsWith('.avif')) {
    return url;
  }
  
  // Ubah .jpg/.png ke format yang diminta
  return url.replace(/\.(jpg|jpeg|png)$/i, `.${format}`);
}
