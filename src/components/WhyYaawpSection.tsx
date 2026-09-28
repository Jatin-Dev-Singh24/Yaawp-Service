import React from 'react';
import { WHY_YAAWP_POINTS } from '../data/agencyData';
import { FadeUp, StaggerContainer, StaggerItem } from './MotionReveal';

export const WhyYaawpSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-[#F5F2ED] border-t border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeUp distance={20} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 pb-6 border-b border-[#DDD7CD]">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
              Operating Philosophy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight">
              Why the curated agency model wins.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm text-[#5C5853] leading-relaxed">
              We replaced the high fees of traditional holding companies and the chaotic risks of freelance boards with a disciplined, managed studio model.
            </p>
          </div>
        </FadeUp>

        {/* 5 Operating Points with Staggered Slide-up */}
        <StaggerContainer staggerDelay={0.08} delayChildren={0.05} className="space-y-4">
          {WHY_YAAWP_POINTS.map((point) => (
            <StaggerItem
              key={point.number}
              distance={20}
              className="bg-[#FAF8F5] p-6 sm:p-8 rounded-sm border border-[#E2DDD5] grid grid-cols-1 md:grid-cols-12 gap-6 items-start hover:border-[#CDC6B9] transition-all"
            >
              <div className="md:col-span-1 text-lg font-serif text-[#581825] font-light">
                {point.number}
              </div>

              <div className="md:col-span-4">
                <h3 className="font-serif text-xl sm:text-2xl text-[#191816] font-normal leading-snug">
                  {point.title}
                </h3>
              </div>

              <div className="md:col-span-4">
                <p className="text-sm text-[#3D3A36] leading-relaxed">
                  {point.description}
                </p>
              </div>

              <div className="md:col-span-3 text-xs text-[#7A746C] bg-[#F2EFE9] p-3 rounded-xs border border-[#E5E0D6]">
                {point.detail}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
