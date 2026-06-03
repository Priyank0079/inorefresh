import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: ReactNode;
}

// Dashboard areas use fixed-height layouts with their OWN inner `overflow-y-auto`
// scroll containers. Lenis smooths the WINDOW, which barely scrolls there, so it
// just fights the native nested scroll and causes jank. Only enable Lenis on the
// customer-facing pages where the window itself scrolls.
const DASHBOARD_PREFIXES = ['/admin', '/warehouse', '/delivery', '/port'];

// Touch devices (phones, and the Play Store WebView) already have smooth,
// GPU-accelerated momentum scrolling. Running Lenis on top of that re-implements
// scrolling in JS via a per-frame rAF loop, which FIGHTS native scroll and makes
// it laggy/janky. Lenis' benefit (smooth mouse-wheel) only applies to desktop,
// so we enable it only for fine-pointer (mouse) devices.
const isTouchDevice =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

export default function SmoothScroll({ children }: SmoothScrollProps) {
    const { pathname } = useLocation();
    const prefersReducedMotion = useReducedMotion();

    const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
    const enabled = !isDashboard && !prefersReducedMotion && !isTouchDevice;

    useEffect(() => {
        if (!enabled) return; // native scroll for dashboards / reduced-motion users

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        let rafId = 0;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);

        return () => {
            // Stop the RAF loop too — the old code only destroyed Lenis and leaked the loop.
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, [enabled]);

    return <>{children}</>;
}
