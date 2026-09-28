import React from 'react';
import { ServiceItem } from '../types';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { editorialEase } from './MotionReveal';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onScopeService: (serviceTitle: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onScopeService,
}) => {
  return (
    <AnimatePresence>
      {service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: editorialEase }}
            className="bg-[#FAF8F5] border border-[#E2DDD5] max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative max-h-[90vh] overflow-y-auto z-10"
            role="dialog"
            aria-labelledby="modal-service-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-[#6B665F] hover:text-[#191816] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#581825]"
              aria-label="Close service details"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="text-xs font-mono text-[#581825] mb-1 font-semibold">{service.number} // SOLUTION PROFILE</div>
              <h3 id="modal-service-title" className="font-serif text-3xl text-[#191816] font-normal">
                {service.title}
              </h3>
              <p className="text-sm font-medium text-[#5C5853] mt-2">
                {service.headline}
              </p>
            </div>

            {/* Narrative Description */}
            <div className="border-t border-[#E8E4DC] pt-5 pb-6">
              <p className="text-[#363431] text-[15px] leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Deliverables List */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#87827B] mb-3">
                Core Scope & Deliverables
              </h4>
              <ul className="space-y-2">
                {service.deliverables.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-[#191816]">
                    <CheckCircle2 className="w-4 h-4 text-[#581825] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specialist Squad Profiles */}
            <div className="bg-[#F2EFE9] p-4 rounded-sm mb-6 border border-[#E5E0D6]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#581825] mb-1">
                Assembled Specialist Roster
              </div>
              <div className="text-sm text-[#191816] flex flex-wrap gap-2 pt-1">
                {service.specialistProfiles.map((role, idx) => (
                  <span key={idx} className="text-xs font-medium text-[#4A4641]">
                    {role}{idx < service.specialistProfiles.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#6B665F] mt-2 border-t border-[#E0DBD0] pt-2">
                <strong>Ideal Context:</strong> {service.idealFor}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E8E4DC]">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-[#6B665F] hover:text-[#191816] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onScopeService(service.title);
                  onClose();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
              >
                <span>Start a brief with this service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
