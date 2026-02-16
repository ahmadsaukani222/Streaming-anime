import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preconnectOrigins, lazyLoadImages } from './utils/performance'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Performance optimizations
// Preconnect to critical origins
preconnectOrigins()

// Initialize lazy loading for images
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', lazyLoadImages)
} else {
  lazyLoadImages()
}

// Re-run lazy loading after React renders
setTimeout(lazyLoadImages, 100)

// Service Worker disabled - caching handled by Cloudflare
// Unregister existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    });
  });
}
