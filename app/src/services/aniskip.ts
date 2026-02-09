// AniSkip API Service
// Dokumentasi: https://github.com/AniSkip/aniskip-api

const ANISKIP_API_URL = 'https://api.aniskip.com/v1';

export interface SkipTime {
  startTime: number;
  endTime: number;
}

export interface SkipTimes {
  op?: SkipTime; // Opening
  ed?: SkipTime; // Ending
}

interface AniSkipResponse {
  found: boolean;
  results?: Array<{
    skipType: 'op' | 'ed';
    interval: {
      startTime: number;
      endTime: number;
    };
  }>;
}

/**
 * Fetch skip times (intro/outro) untuk anime dari AniSkip API
 * @param malId - MyAnimeList ID (atau AniList ID)
 * @param episode - Nomor episode
 * @returns Skip times untuk opening dan ending
 */
export async function fetchSkipTimes(
  malId: string | number | undefined,
  episode: number
): Promise<SkipTimes | null> {
  if (!malId) return null;

  try {
    const response = await fetch(
      `${ANISKIP_API_URL}/skip-times/${malId}?episodeNumber=${episode}&types=op,ed`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Data tidak tersedia untuk anime/episode ini
        return null;
      }
      throw new Error(`AniSkip API error: ${response.status}`);
    }

    const data: AniSkipResponse = await response.json();

    if (!data.found || !data.results) {
      return null;
    }

    const skipTimes: SkipTimes = {};

    for (const result of data.results) {
      if (result.skipType === 'op' || result.skipType === 'ed') {
        skipTimes[result.skipType] = {
          startTime: result.interval.startTime,
          endTime: result.interval.endTime,
        };
      }
    }

    return skipTimes;
  } catch (error) {
    console.error('[AniSkip] Failed to fetch skip times:', error);
    return null;
  }
}

/**
 * Format detik ke format waktu mm:ss
 */
export function formatSkipTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
