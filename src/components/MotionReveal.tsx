import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { useIntersectionReveal, UseIntersectionRevealOptions } from '../hooks/useIntersectionReveal';
import { useScrollReveal, UseScrollRevealOptions } from '../hooks/useScrollReveal';

// Re-export hooks so components can use them directly
export { useIntersectionReveal, useScrollReveal };
export type { UseIntersectionRevealOptions, UseScrollRevealOptions };

// Premium editorial easing curve: rapid start with long, gentle settling
export const editorialEase = [0.16, 1, 0.3, 1] as const;

interface FadeUpProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  viewportMargin?: string;
  threshold?: number;
}

export const FadeUp: React.FC<FadeUpProps> = ({
  children,
  delay = 0,
  duration = 0.7,
  distance = 24,
  className = '',
  viewportMargin = '0px 0px -40px 0px',
  threshold = 0.1,
  ...props
}) => {
  const { ref, controls } = useIntersectionReveal<HTMLDivElement>({
    threshold,
    rootMargin: viewportMargin,
    triggerOnce: true,
  });

  const variants: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: editorialEase,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  viewportMargin?: string;
  threshold?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.08,
  delayChildren = 0.05,
  className = '',
  viewportMargin = '0px 0px -40px 0px',
  threshold = 0.08,
  ...props
}) => {
  const { ref, controls } = useIntersectionReveal<HTMLDivElement>({
    threshold,
    rootMargin: viewportMargin,
    triggerOnce: true,
  });

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: ReactNode;
  distance?: number;
  duration?: number;
  className?: string;
}> = ({
  children,
  distance = 20,
  duration = 0.65,
  className = '',
}) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        ease: editorialEase,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};
