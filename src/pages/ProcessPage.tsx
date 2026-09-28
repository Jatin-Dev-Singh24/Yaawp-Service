import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { FadeUp } from '../components/MotionReveal';

interface ProcessPageProps {
  onBackToHome: () => void;
  onStartProject: () => void;
}

export const ProcessPage: React.FC<ProcessPageProps> = ({
  onBackToHome,
  onStartProject,
}) => {
  const detailedSteps = [
    {
      num: '01',
      title: 'Brief & Scope Formulation',
      phase: 'Discovery & Constraints',
      whatWeDo: [
        'Discovery session with YAAWP leadership to outline commercial objectives and technical parameters.',
        'Define explicit deliverables, boundaries, and acceptance criteria.',
        'Create a transparent, milestone-based budget estimate and timeline schedule.',
      ],
      clientRole: 'Share existing materials, business metrics, and aesthetic preferences. Review and approve the final project scope.',
    },
    {
      num: '02',
      title: 'Assemble the Specialist Squad',
      phase: 'Talent Curation & Onboarding',
      whatWeDo: [
        'Vetting and selecting domain-specific specialists from the YAAWP network based on your exact technology stack and creative direction.',
        'Align team cadences, tooling repositories, and design token architectures.',
        'Establish direct YAAWP oversight, daily standup check-ins, and deliverable sprint tracks.',
      ],
      clientRole: 'Meet your dedicated YAAWP Lead who serves as your single point of contact. Relax knowing senior hands are executing.',
    },
    {
      num: '03',
      title: 'Execution & Unified Orchestration',
      phase: 'Design, Engineering & Production',
      whatWeDo: [
        'Design prototyping, typography systems, and interaction choreography in weekly sprints.',
        'High-performance clean code implementation with strict accessibility and performance audits.',
        'Content formulation, brand collateral preparation, and cross-discipline integration managed continuously by YAAWP.',
      ],
      clientRole: 'Attend structured milestone check-ins, provide feedback through a centralized dashboard or async video notes, and witness steady progress.',
    },
    {
      num: '04',
      title: 'Rigorous QA & Production Delivery',
      phase: 'Polish, Benchmarking & Handover',
      whatWeDo: [
        'Cross-browser and multi-device QA testing, Lighthouse performance optimization, and security audits.',
        'Comprehensive documentation, component guides, and source repository transfers.',
        'Production release deployment and post-launch verification check.',
      ],
      clientRole: 'Sign off on final acceptance criteria and take ownership of pristine, production-grade assets with zero technical debt.',
    },
  ];

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
            The YAAWP Delivery Standard
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#191816] tracking-tight mb-4">
            How we take work from brief to delivery.
          </h1>
          <p className="text-base sm:text-lg text-[#5C5853] max-w-2xl font-normal leading-relaxed">
            A transparent breakdown of how YAAWP manages specialist squads, ensures uncompromised quality, and keeps you shielded from the logistical chaos of managing multiple contractors.
          </p>
        </FadeUp>

        {/* Deep Dive 4 Steps with IntersectionObserver Reveals */}
        <div className="space-y-12">
          {detailedSteps.map((step) => (
            <FadeUp
              key={step.num}
              distance={28}
              className="bg-white p-8 sm:p-12 rounded-sm border border-[#E2DDD5] shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-3">
                <div className="text-3xl font-serif text-[#581825] font-light mb-2">
                  {step.num}
                </div>
                <h2 className="font-serif text-2xl text-[#191816] font-normal leading-snug mb-1">
                  {step.title}
                </h2>
                <div className="text-xs uppercase tracking-wider text-[#87827B] font-semibold">
                  {step.phase}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#581825]">
                  YAAWP Orchestration & Responsibilities
                </h3>
                <ul className="space-y-2.5">
                  {step.whatWeDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#3D3A36]">
                      <CheckCircle2 className="w-4 h-4 text-[#581825] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-4 bg-[#F2EFE9] p-6 rounded-sm border border-[#E0DBD0]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#581825]" />
                  <span>The Client Experience</span>
                </div>
                <p className="text-xs sm:text-sm text-[#4A4641] leading-relaxed">
                  {step.clientRole}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Quality Benchmark Section */}
        <FadeUp distance={24} className="mt-16 bg-[#191816] text-[#FAF8F5] p-8 sm:p-12 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#FAF8F5]/60">
              Quality Assurance Protocol
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
              Accountability stays with YAAWP.
            </h3>
            <p className="text-sm text-[#A6A097] leading-relaxed">
              If an independent specialist gets sick, needs substitution, or hits a roadblock, YAAWP absorbs the friction. The delivery date and technical quality remain our contractually backed responsibility.
            </p>
          </div>

          <button
            onClick={onStartProject}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#191816] bg-[#FAF8F5] hover:bg-[#EAE5DC] transition-colors rounded-sm shrink-0"
          >
            <span>Commission a project brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </FadeUp>
      </div>
    </div>
  );
};
