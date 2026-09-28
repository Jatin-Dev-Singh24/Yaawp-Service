import React, { useState } from 'react';
import { SpecialistApplicationData } from '../types';
import { ArrowLeft, CheckCircle2, Shield, Send, RefreshCw } from 'lucide-react';

interface JoinNetworkPageProps {
  onBackToHome: () => void;
}

export const JoinNetworkPage: React.FC<JoinNetworkPageProps> = ({ onBackToHome }) => {
  const [formData, setFormData] = useState<SpecialistApplicationData>({
    fullName: '',
    email: '',
    discipline: 'Full-Stack / Frontend Developer',
    portfolioUrl: '',
    yearsOfExperience: '5+ years',
    weeklyAvailability: '15-25 hours/week',
    primarySkills: '',
    briefBio: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const disciplines = [
    'Full-Stack / Frontend Developer',
    'UI/UX & Product Designer',
    'Brand Identity & Art Director',
    'Technical Growth & Performance Marketer',
    'Editorial Copywriter & Narrative Strategist',
    'Video & Creative Motion Specialist',
    'Other Specialized Domain Expert',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!formData.portfolioUrl.trim()) {
      setErrorMsg('Please provide a link to your portfolio, GitHub, or case studies.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      discipline: 'Full-Stack / Frontend Developer',
      portfolioUrl: '',
      yearsOfExperience: '5+ years',
      weeklyAvailability: '15-25 hours/week',
      primarySkills: '',
      briefBio: '',
    });
  };

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

        {/* Page Header */}
        <div className="border-b border-[#DDD7CD] pb-10 mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Specialist Network
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#191816] tracking-tight mb-4">
            Join the YAAWP Network.
          </h1>
          <p className="text-base sm:text-lg text-[#5C5853] font-normal leading-relaxed">
            Join a curated network of independent specialists and get considered for relevant YAAWP projects. We work with established designers, developers, writers, and strategists who value rigorous craft without agency bureaucracy.
          </p>
        </div>

        {/* Operating Principles for Specialists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#F2EFE9] p-6 rounded-sm border border-[#E0DBD0]">
            <h3 className="font-serif text-lg text-[#191816] mb-2 font-normal">
              No Client Chasing
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
              YAAWP handles client acquisition, contracts, scoping, and account management. You focus 100% on high-level execution.
            </p>
          </div>

          <div className="bg-[#F2EFE9] p-6 rounded-sm border border-[#E0DBD0]">
            <h3 className="font-serif text-lg text-[#191816] mb-2 font-normal">
              Prompt, Guaranteed Pay
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
              Never chase an invoice again. YAAWP pays agreed specialist rates directly on milestone delivery, irrespective of client pay cycles.
            </p>
          </div>

          <div className="bg-[#F2EFE9] p-6 rounded-sm border border-[#E0DBD0]">
            <h3 className="font-serif text-lg text-[#191816] mb-2 font-normal">
              Curated Peer Caliber
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5853] leading-relaxed">
              Collaborate only with other seasoned independent professionals who respect typography, clean code, and strict delivery standards.
            </p>
          </div>
        </div>

        {/* Application Form */}
        {submitted ? (
          <div className="bg-white border border-[#DDD7CD] p-8 sm:p-12 rounded-sm shadow-sm animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-[#581825]/10 text-[#581825] flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-3xl text-[#191816] font-normal mb-2">
              Application submitted, {formData.fullName}.
            </h3>
            <p className="text-sm text-[#5C5853] leading-relaxed mb-6">
              Thank you for applying to the YAAWP Network. Our leadership team reviews portfolios on a weekly basis. If your discipline and style align with upcoming client briefs, we will reach out to <strong>{formData.email}</strong> to schedule a 20-minute alignment call.
            </p>

            <div className="bg-[#FAF8F5] p-5 rounded-sm border border-[#EAE5DC] text-xs text-[#5C5853] space-y-1 mb-8">
              <div><strong>Discipline:</strong> {formData.discipline}</div>
              <div><strong>Portfolio:</strong> {formData.portfolioUrl}</div>
              <div><strong>Weekly Availability:</strong> {formData.weeklyAvailability}</div>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#581825] hover:text-[#3E0E18]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Submit another profile</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E2DDD5] p-8 sm:p-12 rounded-sm shadow-xs space-y-8"
          >
            {errorMsg && (
              <div className="p-3 bg-[#581825]/10 border border-[#581825]/20 text-[#581825] text-xs font-medium rounded-sm">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@studio.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Primary Discipline *
                </label>
                <select
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Portfolio / Case Study URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://yourportfolio.com or github.com/..."
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Years of Experience
                </label>
                <select
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                >
                  <option value="3-5 years">3–5 years (Senior)</option>
                  <option value="5-8 years">5–8 years (Lead)</option>
                  <option value="8+ years">8+ years (Principal / Veteran)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Typical Weekly Availability
                </label>
                <select
                  value={formData.weeklyAvailability}
                  onChange={(e) => setFormData({ ...formData, weeklyAvailability: e.target.value })}
                  className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                >
                  <option value="10-15 hours/week">10–15 hours / week</option>
                  <option value="15-25 hours/week">15–25 hours / week (Standard sprint)</option>
                  <option value="Full-time sprint availability">Full-time sprint availability</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                Primary Technologies / Tooling Stack
              </label>
              <input
                type="text"
                placeholder="e.g. Next.js, TypeScript, Tailwind, Figma, Cinema 4D, WebGL..."
                value={formData.primarySkills}
                onChange={(e) => setFormData({ ...formData, primarySkills: e.target.value })}
                className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                Brief Introduction & Ideal Projects
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what types of briefs you excel at, your current working setup, and any notable work..."
                value={formData.briefBio}
                onChange={(e) => setFormData({ ...formData, briefBio: e.target.value })}
                className="w-full text-sm p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-[#EAE5DC] flex items-center justify-between">
              <span className="text-xs text-[#87827B]">
                Applications reviewed confidentially by agency partners.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Apply to Network'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
