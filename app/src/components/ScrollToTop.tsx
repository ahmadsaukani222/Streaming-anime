import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls to the top of the page when the route changes.
 * Works with or without Lenis (Lenis is disabled on mobile for performance).
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Try Lenis first (desktop), fallback to native scroll (mobile)
        const lenis = (window as any).__lenis as { scrollTo?: (target: number, options?: any) => void } | undefined;
        if (lenis?.scrollTo) {
            lenis.scrollTo(0, { immediate: true });
            return;
        }

        // Native scroll for mobile (no Lenis)
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto'
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return null;
}
