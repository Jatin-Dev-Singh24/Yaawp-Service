import React, { useState } from 'react';
import { PRICING_SCOPES } from '../data/agencyData';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';

interface PricingPageProps {
  onBackToHome: () => void;
  onSelectTier: (tierName: string) => void;
  onRequestQuote: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToHome,
  onSelectTier,
  onRequestQuote,
}) => {
  const [selectedService, setSelectedService] = useState('Web Development');
  const [selectedUrgency, setSelectedUrgency] = useState('Standard (4-8 weeks)');
  const [teamSizeRequirement, setTeamSizeRequirement] = useState('Dedicated Specialist Squad (2-3 specialists)');

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
        <div className="border-b border-[#DDD7CD] pb-10 mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Commercial Model
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#191816] tracking-tight mb-4">
            Transparent, project-based pricing.
          </h1>
          <p className="text-base sm:text-lg text-[#5C5853] max-w-2xl font-normal leading-relaxed">
            We reject the artificial $29/mo or $49/mo SaaS pricing tiers commonly found on templated sites. As a premier managed agency, every quote is scoped strictly around the work, the specialist talent required, and your delivery milestones.
          </p>
        </div>

        {/* 3 Scope Architectures */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {PRICING_SCOPES.map((scope, idx) => (
            <div
              key={scope.tier}
              className="bg-white p-8 rounded-sm border border-[#E2DDD5] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#87827B]">
                    Option 0{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#581825] bg-[#581825]/8 px-2 py-0.5 rounded-xs">
                    Milestone Scoped
                  </span>
                </div>

                <h2 className="font-serif text-2xl font-normal text-[#191816] mb-2">
                  {scope.tier}
                </h2>
                <p className="text-xs sm:text-sm text-[#5C5853] mb-6 leading-relaxed">
                  {scope.description}
                </p>

                <div className="p-4 bg-[#F2EFE9] rounded-sm mb-6 space-y-2 text-xs text-[#363431]">
                  <div><strong>Cadence:</strong> {scope.timeline}</div>
                  <div><strong>Specialist Squad:</strong> {scope.specialistCount}</div>
                  <div><strong>Billing:</strong> 50% deposit / 50% on milestone sign-off</div>
                </div>

                <div className="space-y-2 mb-8">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                    Scope Deliverables:
                  </div>
                  {scope.typicalInclusions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#191816]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#581825] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectTier(scope.tier)}
                className="w-full py-3 text-xs font-semibold uppercase tracking-wider bg-[#581825] hover:bg-[#3E0E18] text-[#FAF8F5] transition-colors rounded-sm flex items-center justify-center gap-2"
              >
                <span>Request formal quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Interactive Scope Configurator */}
        <div className="bg-[#FAF8F5] border border-[#DDD7CD] p-8 sm:p-12 rounded-sm shadow-xs mb-16">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
              Scope Estimator
            </span>
            <h3 className="font-serif text-3xl text-[#191816] font-normal mb-2">
              Configure your preliminary brief parameters
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5853]">
              Select your parameters below to generate a focused brief for our initial scoping review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                Primary Capability
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full p-3 bg-white border border-[#DDD7CD] rounded-sm text-xs sm:text-sm text-[#191816]"
              >
                <option value="Web Development">Web Development</option>
                <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                <option value="Branding & Identity">Branding & Identity</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Content & Creative">Content & Creative</option>
                <option value="Custom Bespoke Project">Custom Bespoke Project</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                Delivery Urgency
              </label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="w-full p-3 bg-white border border-[#DDD7CD] rounded-sm text-xs sm:text-sm text-[#191816]"
              >
                <option value="Accelerated Sprint (2-3 weeks)">Accelerated Sprint (2-3 weeks)</option>
                <option value="Standard (4-8 weeks)">Standard (4-8 weeks)</option>
                <option value="Phased Multi-quarter Roadmap">Phased Multi-quarter Roadmap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                Squad Configuration
              </label>
              <select
                value={teamSizeRequirement}
                onChange={(e) => setTeamSizeRequirement(e.target.value)}
                className="w-full p-3 bg-white border border-[#DDD7CD] rounded-sm text-xs sm:text-sm text-[#191816]"
              >
                <option value="Focused Specialist (1 specialist + YAAWP Lead)">Focused (1 Specialist + YAAWP Lead)</option>
                <option value="Dedicated Specialist Squad (2-3 specialists)">Dedicated Squad (2-3 Specialists)</option>
                <option value="Full Cross-discipline Team (4+ specialists)">Full Cross-discipline Team (4+ Specialists)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#F2EFE9] p-6 rounded-sm border border-[#E0DBD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-[#4A4641] space-y-1">
              <div><strong>Configured Scope:</strong> {selectedService} · {selectedUrgency}</div>
              <div><strong>Team Architecture:</strong> {teamSizeRequirement}</div>
            </div>

            <button
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-[#581825] hover:bg-[#3E0E18] text-[#FAF8F5] transition-colors rounded-sm shrink-0"
            >
              <span>Submit this scope for quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pricing FAQ Section */}
        <div className="max-w-3xl">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#191816] font-normal mb-6">
            Frequently answered commercial questions
          </h3>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-sm border border-[#E2DDD5]">
              <h4 className="text-sm font-semibold text-[#191816] mb-2">
                How do milestone payments work?
              </h4>
              <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
                We believe in mutual skin in the game. Most engagements are structured with a project kickoff deposit, a mid-sprint staging milestone, and a final sign-off upon asset delivery and QA verification.
              </p>
            </div>

            <div className="bg-white p-6 rounded-sm border border-[#E2DDD5]">
              <h4 className="text-sm font-semibold text-[#191816] mb-2">
                Who pays the independent specialists?
              </h4>
              <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
                YAAWP handles all specialist compensation directly. You receive one compliant invoice from YAAWP Services, with zero 1099 or cross-border contractor management headaches on your side.
              </p>
            </div>

            <div className="bg-white p-6 rounded-sm border border-[#E2DDD5]">
              <h4 className="text-sm font-semibold text-[#191816] mb-2">
                What if our scope shifts mid-project?
              </h4>
              <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
                Our model makes scope adjustments seamless. If you need to add specialized 3D assets or adjust a technical integration, your YAAWP Lead simply rotates in the required specialist without tearing up the core contract.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
