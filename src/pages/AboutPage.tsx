import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { FadeUp } from '../components/MotionReveal';

interface AboutPageProps {
  onBackToHome: () => void;
  onStartProject: () => void;
  onJoinNetwork: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onBackToHome,
  onStartProject,
  onJoinNetwork,
}) => {
  return (
    <div className="pt-8 pb-24 sm:pb-32 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B665F] hover:text-[#191816] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </button>
        </div>

        {/* Page Header */}
        <FadeUp distance={20} className="border-b border-[#DDD7CD] pb-10 mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Agency Manifesto
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#191816] tracking-tight mb-4">
            A boutique studio built for how work happens now.
          </h1>
          <p className="text-base sm:text-lg text-[#5C5853] max-w-2xl font-normal leading-relaxed">
            The traditional agency model is broken: bloated overhead, junior staff doing senior work, and excessive retainer fees. YAAWP is the alternative.
          </p>
        </FadeUp>

        {/* Narrative Section */}
        <FadeUp distance={24} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-3xl text-[#191816] font-normal leading-snug">
              Why the curated specialist network exists
            </h2>
            <div className="w-12 h-0.5 bg-[#581825]"></div>
            <p className="text-sm text-[#4A4641] leading-relaxed">
              The world’s best designers, developers, and creative minds no longer want to sit inside 400-person holding companies. They work independently.
            </p>
            <p className="text-sm text-[#4A4641] leading-relaxed">
              However, for clients, hiring and managing five separate freelance contractors is a logistical nightmare. Who coordinates the handoffs? Who guarantees quality? Who enforces deadlines?
            </p>
            <p className="text-sm text-[#4A4641] leading-relaxed font-semibold text-[#191816]">
              YAAWP bridges that gap. We curate the best independent specialists and orchestrate them as ONE cohesive agency.
            </p>
          </div>

          <div className="lg:col-span-7 bg-[#F2EFE9] p-8 sm:p-12 rounded-sm border border-[#DDD7CD] space-y-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#581825] mb-2">
                What clients can expect
              </h3>
              <p className="font-serif text-2xl text-[#191816] font-normal mb-4">
                The polish of an established agency. The agility of modern specialists.
              </p>
            </div>

            <div className="space-y-4 text-sm text-[#3D3A36]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#581825] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <strong>Single agency point of contact:</strong> You deal directly with our agency director. No scheduling coordination across six different calendars.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#581825] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <strong>Senior talent on the tools:</strong> Every specialist on your project is a seasoned craftsperson, not an intern learning on your budget.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#581825] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <strong>Institutional quality control:</strong> YAAWP conducts exhaustive code reviews, visual QA, and accessibility checks before client presentation.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#581825] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <strong>Direct commercial accountability:</strong> We sign one transparent contract, stand behind our delivery dates, and handle all specialist compensation behind the scenes.
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Specialist Banner */}
        <FadeUp distance={20} className="bg-[#FAF8F5] border border-[#DDD7CD] p-8 sm:p-10 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-xl sm:text-2xl text-[#191816] font-normal">
              Are you an independent specialist?
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5853]">
              We regularly vet senior developers, UI/UX designers, brand strategists, and copywriters for upcoming client briefs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onJoinNetwork}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#191816] border border-[#191816] hover:bg-[#191816] hover:text-[#FAF8F5] transition-colors rounded-sm"
            >
              <span>Join the network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStartProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
            >
              <span>Start a project</span>
            </button>
          </div>
        </FadeUp>
      </div>
    </div>
  );
};
