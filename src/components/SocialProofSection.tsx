import React from 'react';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { FadeUp } from './MotionReveal';

interface SocialProofSectionProps {
  onStartProject: () => void;
}

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({ onStartProject }) => {
  return (
    <section className="py-20 md:py-28 bg-[#F6F3EE] border-t border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <FadeUp distance={20}>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-3">
              Integrity & Track Record
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight leading-tight">
              Built for ambitious work. <br />
              <span className="italic font-light text-[#5C5853]">Work in progress. Proof follows.</span>
            </h2>

            <p className="text-base text-[#4A4641] leading-relaxed max-w-2xl mx-auto mt-4">
              We do not manufacture fake client logos, artificial testimonials, or fabricated ratings. We believe an agency’s reputation is earned through disciplined execution, transparent communication, and verified deliverables.
            </p>
          </FadeUp>

          {/* Reusable Verified Case Architecture Box */}
          <FadeUp delay={0.15} distance={20} className="pt-8">
            <div className="bg-[#FAF8F5] p-6 sm:p-8 rounded-sm border border-[#DDD7CD] text-left max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3 border-b border-[#EAE5DC] pb-4">
                <FileCheck2 className="w-5 h-5 text-[#581825]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#191816]">
                  Our Standards for Client Case Studies
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
                When active client engagements conclude, case studies are published with full attribution, measurable commercial outcomes, and verified client sign-off.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 text-xs text-[#7A746C]">
                <span>[Client Verification Roster · Updated upon project delivery]</span>
                <button
                  onClick={onStartProject}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#581825] hover:underline"
                >
                  <span>Commission the next flagship case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};
