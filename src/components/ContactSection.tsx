import React, { useState } from 'react';
import { ProjectInquiryData } from '../types';
import { SERVICES } from '../data/agencyData';
import { Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { FadeUp } from './MotionReveal';
import { motion } from 'framer-motion';
import { agencyApi } from '../services/agencyApi';

interface ContactSectionProps {
  initialService?: string;
  initialBudget?: string;
  onOpenPrivacy?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  initialService,
  initialBudget,
  onOpenPrivacy,
}) => {
  const [formData, setFormData] = useState<ProjectInquiryData>({
    name: '',
    email: '',
    company: '',
    service: initialService || 'Web Development',
    budgetRange: initialBudget || 'Comprehensive Project',
    timeline: 'Within 4-8 weeks',
    projectDetails: '',
    agreedToPrivacy: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please provide a valid work email address.');
      return;
    }
    if (!formData.agreedToPrivacy) {
      setErrorMsg('Please confirm agreement to the privacy policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      await agencyApi.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company?.trim() || undefined,
        service: formData.service,
        budgetRange: formData.budgetRange,
        timeline: formData.timeline,
        projectDetails: formData.projectDetails?.trim() || undefined,
      });
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit quote inquiry:', err);
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Unable to submit your inquiry at this moment. Please try again.');
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      company: '',
      service: 'Web Development',
      budgetRange: 'Comprehensive Project',
      timeline: 'Within 4-8 weeks',
      projectDetails: '',
      agreedToPrivacy: true,
    });
  };

  return (
    <section id="contact" className="py-20 md:py-32 bg-[#FAF8F5] border-t border-[#E8E2D8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeUp distance={20} className="mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Get in touch
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight mb-3">
            Have a brief?
          </h2>
          <p className="text-base sm:text-lg text-[#5C5853] font-normal leading-relaxed">
            Tell us what you’re building, what you need and where you want to take it.
          </p>
        </FadeUp>

        {/* Polished Form or Success State */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-[#DDD7CD] p-8 sm:p-12 rounded-sm shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-[#581825]/10 text-[#581825] flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-3xl text-[#191816] font-normal mb-2">
              Brief received, {formData.name}.
            </h3>
            <p className="text-sm text-[#5C5853] leading-relaxed mb-6">
              Thank you for reaching out. YAAWP leadership will review your requirements for <strong>{formData.service}</strong> and respond to <strong>{formData.email}</strong> within 1 business day with scoping thoughts and team availability.
            </p>

            <div className="bg-[#FAF8F5] p-5 rounded-sm border border-[#EAE5DC] text-xs text-[#5C5853] space-y-1.5 mb-8">
              <div><strong>Organization:</strong> {formData.company || 'Not specified'}</div>
              <div><strong>Service:</strong> {formData.service}</div>
              <div><strong>Estimated Timeline:</strong> {formData.timeline}</div>
              <div><strong>Engagement Tier:</strong> {formData.budgetRange}</div>
              {formData.projectDetails && (
                <div className="pt-1 border-t border-[#EAE5DC] mt-2">
                  <strong>Notes:</strong> {formData.projectDetails}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#581825] hover:text-[#3E0E18]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Submit another inquiry</span>
            </button>
          </motion.div>
        ) : (
          <FadeUp distance={24} delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#E2DDD5] p-6 sm:p-10 rounded-sm shadow-xs space-y-8"
            >
              {errorMsg && (
                <div className="p-3 bg-[#581825]/10 border border-[#581825]/20 text-[#581825] text-xs font-medium rounded-sm">
                  {errorMsg}
                </div>
              )}

              {/* Conversational Header Block matching video */}
              <div className="space-y-4">
                <div className="text-base sm:text-lg text-[#191816] leading-loose font-serif">
                  Hey, I’m{' '}
                  <input
                    type="text"
                    placeholder="your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="font-sans inline-block px-2.5 py-1 text-sm bg-[#FAF8F5] border-b-2 border-[#DDD7CD] focus:border-[#581825] focus:outline-none text-[#191816] min-w-[140px] max-w-[200px]"
                    required
                  />
                  {' '}from{' '}
                  <input
                    type="text"
                    placeholder="company / organization"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="font-sans inline-block px-2.5 py-1 text-sm bg-[#FAF8F5] border-b-2 border-[#DDD7CD] focus:border-[#581825] focus:outline-none text-[#191816] min-w-[160px] max-w-[240px]"
                  />
                  {', and I’m seeking '}
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="font-sans inline-block px-2.5 py-1 text-sm bg-[#FAF8F5] border-b-2 border-[#DDD7CD] focus:border-[#581825] focus:outline-none text-[#191816] cursor-pointer"
                  >
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                    <option value="Multi-disciplinary Squad">Multi-disciplinary Squad</option>
                  </select>
                  {'. Reach out at '}
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="font-sans inline-block px-2.5 py-1 text-sm bg-[#FAF8F5] border-b-2 border-[#DDD7CD] focus:border-[#581825] focus:outline-none text-[#191816] min-w-[180px] max-w-[260px]"
                    required
                  />
                  {'.'}
                </div>
              </div>

              {/* Scope & Timeline Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#EAE5DC]">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                    Scope Tier / Investment Range
                  </label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                  >
                    <option value="Targeted Sprint (2-3 weeks)">Targeted Sprint (Focused execution)</option>
                    <option value="Comprehensive Project (4-8 weeks)">Comprehensive Project (Full design & build)</option>
                    <option value="Bespoke Multi-quarter Engagement">Bespoke Custom Engagement</option>
                    <option value="To be scoped after discovery">To be scoped after discovery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                    Expected Timeline
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816]"
                  >
                    <option value="Immediate (Next 1-2 weeks)">Immediate (Next 1-2 weeks)</option>
                    <option value="Within 4-8 weeks">Within 4-8 weeks</option>
                    <option value="Next quarter">Next quarter</option>
                    <option value="Flexible / Exploring capabilities">Flexible / Exploring</option>
                  </select>
                </div>
              </div>

              {/* Project Details Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-2">
                  Project Overview & Specific Requirements
                </label>
                <textarea
                  rows={4}
                  placeholder="Give us a brief overview of the context, technical objectives, or challenges you are looking to solve..."
                  value={formData.projectDetails}
                  onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm focus:outline-none focus:border-[#581825] text-[#191816] placeholder:text-[#9E988F]"
                ></textarea>
              </div>

              {/* Privacy Checkbox & Submit Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-[#EAE5DC]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5C5853]">
                  <input
                    type="checkbox"
                    checked={formData.agreedToPrivacy}
                    onChange={(e) => setFormData({ ...formData, agreedToPrivacy: e.target.checked })}
                    className="w-4 h-4 rounded text-[#581825] border-[#DDD7CD] focus:ring-[#581825]"
                  />
                  <span>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="underline text-[#191816] hover:text-[#581825]"
                    >
                      privacy policy
                    </button>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] disabled:opacity-50 transition-colors rounded-sm shadow-sm"
                >
                  <span>{isSubmitting ? 'Transmitting brief...' : 'Start a project'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </FadeUp>
        )}
      </div>
    </section>
  );
};
