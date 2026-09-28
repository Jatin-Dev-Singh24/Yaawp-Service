import React, { useState } from 'react';
import { PRICING_SCOPES } from '../data/agencyData';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from './MotionReveal';

interface PricingSectionProps {
  onDiscussProject: (tierName?: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onDiscussProject }) => {
  const [selectedTierIndex, setSelectedTierIndex] = useState(1);

  const scopingFactors = [
    { title: 'Scope', description: 'Volume of bespoke screens, digital assets, or system architectures.' },
    { title: 'Complexity', description: 'Technical integrations, custom interactions, and domain depth.' },
    { title: 'Specialist Requirements', description: 'Seniority and specialized expertise required on the squad.' },
    { title: 'Timeline', description: 'Accelerated turnarounds vs. standard sprint cadences.' },
    { title: 'Deliverables', description: 'Production code, brand books, design tokens, and handover documentation.' },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-[#FAF8F5] border-t border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <FadeUp distance={20} className="max-w-3xl mb-16 pb-6 border-b border-[#E5E0D6]">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Commercial Framework
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight mb-4">
            Pricing that follows the brief.
          </h2>
          <p className="text-base sm:text-lg text-[#3D3A36] leading-relaxed">
            Every project is different. We scope around the work, the expertise required and the timeline rather than forcing every client into a fixed package or artificial subscription tiers.
          </p>
        </FadeUp>

        {/* 3 Project-Based Tiers (Editorial Agency Cards, with Staggered reveal) */}
        <StaggerContainer staggerDelay={0.1} delayChildren={0.05} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {PRICING_SCOPES.map((scope, idx) => {
            const isFeatured = idx === selectedTierIndex;
            return (
              <StaggerItem
                key={scope.tier}
                distance={24}
                className="h-full"
              >
                <div
                  onClick={() => setSelectedTierIndex(idx)}
                  className={`cursor-pointer p-8 rounded-sm transition-all border flex flex-col justify-between h-full ${
                    isFeatured
                      ? 'bg-[#FAF8F5] border-[#581825] ring-1 ring-[#581825] shadow-lg relative'
                      : 'bg-white border-[#E2DDD5] hover:border-[#CDC6B9]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono uppercase tracking-wider text-[#87827B]">
                        Model 0{idx + 1}
                      </span>
                      {isFeatured && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#581825] bg-[#581825]/10 px-2 py-0.5 rounded-xs">
                          Most Requested
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl font-normal text-[#191816] mb-3">
                      {scope.tier}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed mb-6">
                      {scope.description}
                    </p>

                    <div className="space-y-2 py-4 border-y border-[#EAE5DC] mb-6 text-xs text-[#4A4641]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#87827B]">Typical cadence:</span>
                        <span className="font-semibold text-[#191816]">{scope.timeline}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#87827B]">Squad configuration:</span>
                        <span className="font-semibold text-[#191816]">{scope.specialistCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#87827B]">Fee structure:</span>
                        <span className="font-semibold text-[#581825]">[Milestone-based quotation]</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#87827B]">
                        Typical Inclusions:
                      </div>
                      {scope.typicalInclusions.map((inc, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#191816]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#581825] shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EAE5DC]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDiscussProject(scope.tier);
                      }}
                      className={`w-full py-3 text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm flex items-center justify-center gap-2 ${
                        isFeatured
                          ? 'bg-[#581825] text-white hover:bg-[#3E0E18]'
                          : 'bg-transparent text-[#191816] border border-[#DDD7CD] hover:border-[#191816]'
                      }`}
                    >
                      <span>Discuss your project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Transparent Scoping Factors Grid */}
        <FadeUp distance={24} className="bg-[#F2EFE9] p-8 sm:p-10 rounded-sm border border-[#E0DBD0]">
          <h4 className="font-serif text-xl sm:text-2xl text-[#191816] mb-2 font-normal">
            How we calculate transparent project estimates
          </h4>
          <p className="text-xs sm:text-sm text-[#5C5853] mb-8 max-w-2xl">
            You receive a comprehensive, line-item proposal after our discovery call with zero hidden costs or retainer traps. Every quote directly reflects:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {scopingFactors.map((factor, i) => (
              <div key={i} className="border-t border-[#DDD7CD] pt-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#581825] mb-1">
                  0{i + 1} · {factor.title}
                </div>
                <p className="text-xs text-[#5C5853] leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
};
