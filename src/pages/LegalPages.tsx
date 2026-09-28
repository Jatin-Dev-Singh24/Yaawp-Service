import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  type: 'privacy' | 'terms';
  onBackToHome: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBackToHome }) => {
  return (
    <div className="pt-8 pb-24 sm:pb-32 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {type === 'privacy' ? (
          <div>
            <div className="border-b border-[#DDD7CD] pb-8 mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
                Legal Notice
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#191816] tracking-tight mb-3">
                Privacy Policy
              </h1>
              <p className="text-xs text-[#7A746C]">
                Last updated: September 2026 · Operational standard
              </p>
            </div>

            <div className="prose prose-stone max-w-none text-sm text-[#4A4641] space-y-6 leading-relaxed">
              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">1. Overview</h2>
                <p>
                  YAAWP Services operates as a boutique digital agency. We respect the confidentiality of prospective clients, engaged partners, and independent specialists. This document outlines how project inquiries and network applications are handled.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">2. Information Collection</h2>
                <p>
                  We only collect information voluntarily submitted through our brief intake form (name, work email, organization, project specifications) or specialist network application (portfolio links, professional discipline, background).
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">3. Commercial Use & Non-Disclosure</h2>
                <p>
                  Information shared regarding proprietary concepts, product roadmaps, and business metrics is treated under strict commercial confidentiality. We do not sell or transfer prospect data to third-party brokers or advertisers.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">4. Contact Information</h2>
                <p>
                  For inquiries regarding privacy, data removal, or confidentiality agreements, contact YAAWP Services leadership via our inquiry form.
                </p>
              </section>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-[#DDD7CD] pb-8 mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
                Legal Notice
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#191816] tracking-tight mb-3">
                Terms of Service
              </h1>
              <p className="text-xs text-[#7A746C]">
                Last updated: September 2026 · Operational standard
              </p>
            </div>

            <div className="prose prose-stone max-w-none text-sm text-[#4A4641] space-y-6 leading-relaxed">
              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">1. Master Service Engagements</h2>
                <p>
                  All commercial deliverables, timelines, milestone schedules, and IP transfers are governed by individualized Statements of Work (SOW) executed directly between the client and YAAWP Services.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">2. Independent Specialist Coordination</h2>
                <p>
                  YAAWP Services retains and orchestrates independent contractors under strict proprietary contractor agreements. Clients contract exclusively with YAAWP Services, which assumes single-source commercial accountability for delivered work.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">3. Intellectual Property</h2>
                <p>
                  Upon final milestone settlement and sign-off, all custom-produced client deliverables, source code repositories, and brand identity assets transfer completely to the client, as stipulated in each project agreement.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl text-[#191816] font-normal mb-2">4. Concept Work Notice</h2>
                <p>
                  Work labeled on this website as "Independent Concept" or "Sample Project" represents exploratory design studies created by YAAWP and its specialist network to demonstrate aesthetic capability and technical craft.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
