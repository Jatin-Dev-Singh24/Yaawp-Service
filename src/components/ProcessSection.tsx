import React from 'react';
import { PROCESS_STEPS } from '../data/agencyData';
import { ArrowRight, UserCheck, Shield } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from './MotionReveal';

interface ProcessSectionProps {
  onLearnMoreProcess: () => void;
  onStartProject: () => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({
  onLearnMoreProcess,
  onStartProject,
}) => {
  return (
    <section id="process" className="py-20 md:py-32 bg-[#FAF8F5] border-t border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeUp distance={20} className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#E5E0D6]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
              Lifecycle
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight">
              From brief to delivery.
            </h2>
          </div>
          <p className="text-sm text-[#6B665F] max-w-md mt-4 md:mt-0 font-normal">
            How we assemble elite independent talent and coordinate execution while giving you one direct, accountable agency partner.
          </p>
        </FadeUp>

        {/* 4 Steps Grid with Staggered Reveal */}
        <StaggerContainer staggerDelay={0.1} delayChildren={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PROCESS_STEPS.map((step) => (
            <StaggerItem
              key={step.number}
              distance={24}
              className="relative bg-white p-7 rounded-sm border border-[#E5E0D6] shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Step Number */}
                <div className="text-2xl font-serif text-[#581825] font-light mb-4">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="font-serif text-2xl font-normal text-[#191816] mb-1">
                  {step.title}
                </h3>
                <div className="text-xs uppercase tracking-wider text-[#87827B] font-semibold mb-4">
                  {step.subtitle}
                </div>

                <p className="text-sm text-[#4A4641] leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              {/* Client Experience Highlight */}
              <div className="pt-4 border-t border-[#F0ECE4] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A746C] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#581825]" />
                  <span>Client Experience</span>
                </div>
                <p className="text-xs text-[#5C5853] leading-relaxed">
                  {step.clientExperience}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Accountability Box */}
        <FadeUp delay={0.15} distance={20} className="mt-12 bg-[#F2EFE9] p-6 sm:p-8 rounded-sm border border-[#E0DBD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-sm bg-[#581825] text-white flex items-center justify-center shrink-0 mt-1">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg text-[#191816] font-normal mb-1">
                Zero Freelancer Management Overhead for You
              </h4>
              <p className="text-xs sm:text-sm text-[#5C5853] max-w-2xl leading-relaxed">
                You never manage contracts, time tracking, specialist onboarding, or individual deliverable reviews. YAAWP handles all coordinator and QA responsibilities under a single master service contract.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto">
            <button
              onClick={onLearnMoreProcess}
              className="text-xs font-semibold uppercase tracking-wider text-[#191816] hover:text-[#581825] transition-colors"
            >
              Detailed breakdown
            </button>
            <button
              onClick={onStartProject}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
            >
              <span>Submit a brief</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};
