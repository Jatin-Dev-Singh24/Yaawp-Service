import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimation, Variants } from 'framer-motion';

// Premium editorial easing curve: rapid start with long, gentle settling
export const editorialEase = [0.16, 1, 0.3, 1] as const;

export interface UseScrollRevealOptions {
  /**
   * Index of the item within a grid or list to stagger its reveal.
   */
  staggerIndex?: number;
  /**
   * Additional base delay before the animation starts (in seconds).
   */
  baseDelay?: number;
  /**
   * Time increment in seconds per index step (defaults to 0.08s).
   */
  staggerIncrement?: number;
  /**
   * Vertical slide distance in pixels (defaults to 24px).
   */
  distance?: number;
  /**
   * Animation duration in seconds (defaults to 0.7s).
   */
  duration?: number;
  /**
   * Viewport intersection ratio before trigger (defaults to 0.12).
   */
  threshold?: number | number[];
  /**
   * Root margin offset (defaults to '0px 0px -40px 0px').
   */
  rootMargin?: string;
  /**
   * Whether the animation should trigger only once (defaults to true).
   */
  triggerOnce?: boolean;
}

export interface UseScrollRevealReturn<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T | null>;
  controls: ReturnType<typeof useAnimation>;
  isVisible: boolean;
  hasTriggered: boolean;
  variants: Variants;
  /**
   * Props helper that can be spread directly on a motion component:
   * <motion.div {...motionProps}>
   */
  motionProps: {
    ref: React.RefObject<T | null>;
    initial: string;
    animate: ReturnType<typeof useAnimation>;
    variants: Variants;
  };
}

/**
 * Custom hook using IntersectionObserver to trigger Framer Motion
 * slide-up and fade-in animations as elements enter the viewport,
 * with staggered delays for grid items and editorial project cards.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
): UseScrollRevealReturn<T> {
  const {
    staggerIndex = 0,
    baseDelay = 0,
    staggerIncrement = 0.08,
    distance = 24,
    duration = 0.7,
    threshold = 0.12,
    rootMargin = '0px 0px -40px 0px',
    triggerOnce = true,
  } = options;

  const totalDelay = baseDelay + staggerIndex * staggerIncrement;
  const ref = useRef<T | null>(null);
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const startAnimation = useCallback(() => {
    controls.start('visible');
  }, [controls]);

  useEffect(() => {
    // If IntersectionObserver is not supported, reveal immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      setHasTriggered(true);
      controls.start('visible');
      return;
    }

    const node = ref.current;
    if (!node) return;

    controls.set('hidden');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasTriggered(true);
            startAnimation();

            if (triggerOnce) {
              observer.unobserve(node);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            controls.start('hidden');
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
  }, [threshold, rootMargin, triggerOnce, controls, startAnimation]);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay: totalDelay,
        ease: editorialEase,
      },
    },
  };

  return {
    ref,
    controls,
    isVisible,
    hasTriggered,
    variants,
    motionProps: {
      ref,
      initial: 'hidden',
      animate: controls,
      variants,
    },
  };
}
