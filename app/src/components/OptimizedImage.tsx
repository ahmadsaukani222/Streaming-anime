import { useState, useEffect, useRef, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  aspectRatio?: 'poster' | 'banner' | 'square' | 'video';
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Convert image URL to WebP version
function getWebPUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // Skip if already WebP/AVIF or data URL
  if (originalUrl.endsWith('.webp') || originalUrl.endsWith('.avif') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // Replace extension with .webp
  return originalUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
}

// Check if browser supports WebP
function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      // WebP is supported if the canvas can export to WebP
      resolve(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else {
      resolve(false);
    }
  });
}

// Get aspect ratio class
function getAspectRatioClass(ratio: string): string {
  switch (ratio) {
    case 'poster':
      return 'aspect-[2/3]';
    case 'banner':
      return 'aspect-[16/9]';
    case 'square':
      return 'aspect-square';
    case 'video':
      return 'aspect-video';
    default:
      return '';
  }
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  aspectRatio,
  containerClassName = '',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [useWebP, setUseWebP] = useState(false);
  const [webPFallback, setWebPFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check WebP support on mount
  useEffect(() => {
    checkWebPSupport().then((supported) => {
      setUseWebP(supported);
    });
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Determine image source
  const imageSrc = useMemo(() => {
    if (!src) return '';
    if (webPFallback) return src; // Fallback to original
    if (useWebP) return getWebPUrl(src); // Try WebP
    return src; // Use original
  }, [src, useWebP, webPFallback]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (useWebP && !webPFallback) {
      // Try fallback to original format
      setWebPFallback(true);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#1A1A2E] ${
        aspectRatio ? getAspectRatioClass(aspectRatio) : ''
      } ${containerClassName}`}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A] animate-pulse" />
      )}

      {/* Main image */}
      {(isInView || priority) && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          loading={loading}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]">
          <span className="text-white/30 text-xs text-center px-2">{alt || 'Image'}</span>
        </div>
      )}
    </div>
  );
}
