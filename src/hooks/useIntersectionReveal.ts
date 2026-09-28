import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimation } from 'framer-motion';

export type MotionAnimationControls = ReturnType<typeof useAnimation>;

export interface UseIntersectionRevealOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  initialState?: string;
  animateState?: string;
}

export interface UseIntersectionRevealReturn<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>;
  controls: MotionAnimationControls;
  isVisible: boolean;
  hasTriggered: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Custom hook that uses the browser's native IntersectionObserver
 * to trigger Framer Motion slide-up and staggered reveal animations
 * as elements enter the viewport on long editorial pages.
 */
export function useIntersectionReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionRevealOptions = {}
): UseIntersectionRevealReturn<T> {
  const {
    threshold = 0.12,
    rootMargin = '0px 0px -40px 0px',
    triggerOnce = true,
    delay = 0,
    initialState = 'hidden',
    animateState = 'visible',
  } = options;

  const ref = useRef<T | null>(null);
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const startAnimation = useCallback(() => {
    if (delay > 0) {
      const timer = window.setTimeout(() => {
        controls.start(animateState);
      }, delay * 1000);
      return () => clearTimeout(timer);
    } else {
      controls.start(animateState);
    }
  }, [controls, animateState, delay]);

  useEffect(() => {
    // If IntersectionObserver is not supported, reveal immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      setHasTriggered(true);
      controls.start(animateState);
      return;
    }

    const node = ref.current;
    if (!node) return;

    // Initialize animation state
    controls.set(initialState);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((obsEntry) => {
          setEntry(obsEntry);
          if (obsEntry.isIntersecting) {
            setIsVisible(true);
            setHasTriggered(true);
            startAnimation();

            if (triggerOnce) {
              observer.unobserve(node);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            controls.start(initialState);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, initialState, animateState, controls, startAnimation]);

  return {
    ref,
    controls,
    isVisible,
    hasTriggered,
    entry,
  };
}
