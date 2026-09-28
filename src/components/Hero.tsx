import React, { useState } from 'react';
import { HERO_IMAGE } from '../data/agencyData';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { editorialEase } from './MotionReveal';

interface HeroProps {
  onStartProject: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartProject, onExploreServices }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Agency Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: editorialEase }}
            className="lg:col-span-6 space-y-6 sm:space-y-8 z-10"
          >
            {/* Pill-free Editorial Eyebrow matching reference video */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: editorialEase }}
              className="inline-flex items-center gap-3 text-xs tracking-wider text-[#6B665F]"
            >
              <span className="font-semibold text-[#191816]">Clarity that sells</span>
              <span className="text-[#A39E96]">·</span>
              <button
                onClick={onExploreServices}
                className="group inline-flex items-center gap-1 hover:text-[#581825] transition-colors focus:outline-none focus-visible:underline"
              >
                <span>Explore capabilities</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: editorialEase }}
              className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#191816] leading-[1.05] text-balance"
            >
              Digital work, <br className="hidden sm:inline" />
              <span className="italic font-light">sharpened.</span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: editorialEase }}
              className="space-y-3 max-w-xl"
            >
              <p className="text-base sm:text-lg text-[#3D3A36] leading-relaxed font-normal">
                A lean digital agency delivering web development, marketing and creative work through a curated network of independent specialists.
              </p>
              <div className="text-xs uppercase tracking-widest text-[#7A746C] font-semibold pt-1">
                Strategy · Execution · Delivery
              </div>
            </motion.div>

            {/* Call to Action Group */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: editorialEase }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button
                onClick={onStartProject}
                className="inline-flex items-center justify-center px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm shadow-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#581825]"
              >
                <span>Start a Project</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExploreServices}
                className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#191816] bg-transparent hover:bg-[#EFEAE2] border border-[#DDD7CD] hover:border-[#191816] transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191816]"
              >
                Explore Services
              </button>
            </motion.div>

            {/* Operational Anchor Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: editorialEase }}
              className="pt-4 border-t border-[#EAE5DC] flex items-center gap-3 text-xs text-[#6B665F]"
            >
              <div className="w-2 h-2 rounded-full bg-[#581825]/75"></div>
              <span>One direct agency point of contact. Vetted specialist network execution.</span>
            </motion.div>
          </motion.div>

          {/* Right Column: High-Impact Editorial Visual Asset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: editorialEase }}
            className="lg:col-span-6 relative"
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/11] lg:aspect-[16/12] w-full overflow-hidden rounded-sm bg-[#EFECE6] border border-[#E5E0D6] shadow-[0_20px_40px_rgba(25,24,22,0.06)]">
              {/* Fallback while image loads or if error */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#EAE5DC]">
                  <Sparkles className="w-8 h-8 text-[#87827B] mb-2 animate-pulse" />
                  <span className="text-xs font-medium text-[#6B665F]">
                    Studio Workspace · Editorial Direction
                  </span>
                </div>
              )}

              <img
                src={HERO_IMAGE}
                alt="YAAWP Studio Creative Environment and Workspace"
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                referrerPolicy="no-referrer"
              />

              {/* Editorial Caption Watermark */}
              <div className="absolute bottom-3 right-3 bg-[#FAF8F5]/85 backdrop-blur-xs px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-[#4A4641] rounded-xs border border-white/50">
                YAAWP Studio · Craft & Strategy
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
