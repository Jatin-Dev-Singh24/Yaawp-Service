import React from 'react';
import { ProjectConcept } from '../types';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { editorialEase } from './MotionReveal';

interface ProjectModalProps {
  project: ProjectConcept | null;
  onClose: () => void;
  onStartSimilarProject: (category: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onStartSimilarProject,
}) => {
  return (
    <AnimatePresence>
      {project && (
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
            className="bg-[#FAF8F5] border border-[#E2DDD5] max-w-3xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative max-h-[92vh] overflow-y-auto z-10"
            role="dialog"
            aria-labelledby="modal-project-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-[#6B665F] hover:text-[#191816] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#581825]"
              aria-label="Close project showcase"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge & Category */}
            <div className="flex items-center gap-3 text-xs mb-2">
              <span className="font-semibold text-[#581825] uppercase tracking-wider">
                {project.badge}
              </span>
              <span className="text-[#87827B]">/</span>
              <span className="text-[#6B665F]">{project.category}</span>
            </div>

            {/* Title */}
            <h3 id="modal-project-title" className="font-serif text-3xl sm:text-4xl text-[#191816] font-normal mb-3">
              {project.title}
            </h3>

            <p className="text-base text-[#5C5853] mb-6">
              {project.shortDescription}
            </p>

            {/* Project Image Showcase */}
            <div className="aspect-[16/9] w-full bg-[#EAE5DC] overflow-hidden rounded-sm mb-6 border border-[#E2DDD5] relative">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Overview & Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-[#E8E4DC] pt-6 mb-6">
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#87827B]">
                  Concept Scope & Methodology
                </h4>
                <p className="text-sm text-[#363431] leading-relaxed">
                  {project.overview}
                </p>

                <div className="pt-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-[#581825] mb-2">
                    Architectural Highlights
                  </h5>
                  <ul className="space-y-2 text-xs text-[#363431]">
                    {project.architectureDetails.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#581825] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-5 bg-[#F2EFE9] p-5 rounded-sm border border-[#E5E0D6] space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#87827B] mb-2">
                    Disciplines Coordinated
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.servicesInvolved.map((srv, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 bg-white border border-[#DDD7CD] text-[#191816] rounded-sm font-medium"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#DDD7CD] pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#87827B] mb-2">
                    Deliverables Produced
                  </div>
                  <ul className="space-y-1 text-xs text-[#4A4641]">
                    {project.deliverables.map((item, idx) => (
                      <li key={idx}>· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E8E4DC]">
              <span className="text-xs text-[#87827B] italic">
                Note: Clearly marked as an independent concept to maintain absolute integrity.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-[#6B665F] hover:text-[#191816]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onStartSimilarProject(project.title);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
                >
                  <span>Build something similar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
