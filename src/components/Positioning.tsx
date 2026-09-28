import React from 'react';
import { ArrowRight, ShieldCheck, Compass, Users2, Layers, CheckCircle } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from './MotionReveal';

interface PositioningProps {
  onLearnMoreProcess: () => void;
}

export const Positioning: React.FC<PositioningProps> = ({ onLearnMoreProcess }) => {
  const benefits = [
    {
      icon: Users2,
      title: 'Precision expertise for the brief',
      description: 'Instead of assigning generalists from an idle agency bench, we handpick vetted specialists whose specific craft matches your requirements.',
    },
    {
      icon: Layers,
      title: 'Lean by design, zero overhead',
      description: 'No bloated account layers, superfluous downtown real estate, or internal politics. Your budget goes entirely into creative and technical execution.',
    },
    {
      icon: Compass,
      title: 'One accountable point of contact',
      description: 'You communicate exclusively with dedicated YAAWP agency leadership. We manage timelines, briefs, and client communications seamlessly.',
    },
    {
      icon: ShieldCheck,
      title: 'Strict quality control by YAAWP',
      description: 'Every deliverable undergoes strict QA by YAAWP before client review. You experience the consistency and security of an established boutique studio.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F3EFEA] border-y border-[#E8E2D8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Statement Header */}
        <FadeUp distance={24} duration={0.8} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
              The YAAWP Model
            </span>
            <div className="w-10 h-0.5 bg-[#581825] mb-4"></div>
            <p className="text-sm text-[#6B665F] leading-relaxed">
              Rethinking traditional agency bloat. We bring together high-caliber independent talent under unified agency stewardship.
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] leading-tight text-balance">
              Built around the work, <br className="hidden sm:inline" />
              <span className="italic font-light">not a fixed roster.</span>
            </h2>
            <p className="text-base sm:text-lg text-[#3D3A36] leading-relaxed max-w-2xl font-normal">
              Traditional agencies force your brief onto whoever is currently unbilled in their office. YAAWP operates differently: we assemble a bespoke squad of senior independent specialists curated specifically for your challenge, coordinated and quality-assured entirely under the YAAWP banner.
            </p>
          </div>
        </FadeUp>

        {/* 4 Pillars of the Operating Model with Stagger */}
        <StaggerContainer staggerDelay={0.1} delayChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <StaggerItem
                key={index}
                distance={24}
                className="bg-[#FAF8F5] p-6 sm:p-7 rounded-sm border border-[#E5E0D6] flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-sm bg-[#581825]/8 flex items-center justify-center text-[#581825] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-[#191816] mb-2 leading-snug">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#EAE5DC] flex items-center gap-1.5 text-[11px] font-semibold text-[#581825]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>YAAWP Standard</span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Action Link */}
        <FadeUp delay={0.2} distance={16} className="mt-12 text-center">
          <button
            onClick={onLearnMoreProcess}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#191816] hover:text-[#581825] transition-colors group"
          >
            <span>Read how our 4-step delivery lifecycle works</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </FadeUp>
      </div>
    </section>
  );
};
