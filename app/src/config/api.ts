// ==========================================
// API CONFIGURATION
// Reads from environment variables (.env.local)
// ==========================================

/**
 * Determine the backend URL based on environment
 * Priority: VITE_BACKEND_URL env > auto-detect > localhost fallback
 */
const resolveBackendUrl = (): string => {
  // 1. Check environment variable (recommended for development)
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl;
  }

  // 2. Auto-detect based on hostname (for production/staging)
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // Production domain
    if (hostname === 'animeku.xyz' || hostname === 'www.animeku.xyz') {
      return `${protocol}//api.animeku.xyz`;
    }
    
    // Staging domain (optional)
    if (hostname === 'staging.animeku.xyz') {
      return `${protocol}//staging-api.animeku.xyz`;
    }
    
    // Local development fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Default to same origin
    return `${protocol}//${hostname}`;
  }

  // 3. Fallback for SSR/build time
  return 'http://localhost:5000';
};

/**
 * Determine R2 Public URL for video streaming
 */
const resolveR2PublicUrl = (): string => {
  const envUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  if (envUrl) return envUrl;
  return 'https://streaminganime.animeku.xyz';
};

/**
 * Determine R2 Frontend URL for assets
 */
const resolveR2FrontendUrl = (): string => {
  const envUrl = import.meta.env.VITE_R2_FRONTEND_URL;
  if (envUrl) return envUrl;
  return 'https://front-end.animeku.xyz';
};

// ==========================================
// EXPORTS
// ==========================================

export const BACKEND_URL = resolveBackendUrl();
export const R2_PUBLIC_URL = resolveR2PublicUrl();
export const R2_FRONTEND_URL = resolveR2FrontendUrl();

// Environment checks
export const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.VITE_ENV_MODE === 'development';
export const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.VITE_ENV_MODE === 'production';
export const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === 'true' || IS_DEVELOPMENT;
export const DEBUG_ERROR_BOUNDARY = import.meta.env.VITE_DEBUG_ERROR_BOUNDARY === 'true' || IS_DEVELOPMENT;
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// ==========================================
// DRAMA BOS API CONFIGURATION
// ==========================================

export const API_CONFIG = {
  // DramaBos API - Working video streams!
  BASE_URL: 'https://dramabos.asia/api/tensei',

  // Old Sansekai API (stream always empty)
  // BASE_URL: 'https://api.sansekai.my.id/api',

  // Endpoints
  endpoints: {
    home: '/home',           // Latest/home releases
    ongoing: '/ongoing',     // Ongoing anime
    search: '/search',       // Search: ?q=query
    detail: '/detail',       // Detail: /detail/{slug}
    watch: '/watch',         // Watch: /watch/{slug} (Embeds)
    stream: '/stream',       // Stream: /stream/{episodeSlug}
  }
};

export const getApiUrl = (endpoint: string): string => `${API_CONFIG.BASE_URL}${endpoint}`;

// ==========================================
// SITE CONFIGURATION
// ==========================================

export const DEFAULT_SITE_NAME = 'Animeku';
export const DEFAULT_SITE_DESCRIPTION = 'Platform streaming anime terbaik untuk penggemar anime Indonesia';

// Helper to get site name from settings (will be used with React state)
export const getStoredSiteName = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('siteName') || DEFAULT_SITE_NAME;
  }
  return DEFAULT_SITE_NAME;
};

export const setStoredSiteName = (name: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('siteName', name);
  }
};

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

/**
 * Log configuration in development mode
 */
export const logConfig = (): void => {
  if (DEBUG_LOGS) {
    console.log('🚀 [Config] Current Environment:', {
      mode: IS_DEVELOPMENT ? 'development' : IS_PRODUCTION ? 'production' : 'unknown',
      backendUrl: BACKEND_URL,
      r2PublicUrl: R2_PUBLIC_URL,
      debugLogs: DEBUG_LOGS,
      useMockData: USE_MOCK_DATA,
    });
  }
};

// Auto-log on import in development
if (DEBUG_LOGS) {
  logConfig();
}
