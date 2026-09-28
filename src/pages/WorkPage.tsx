import React, { useState } from 'react';
import { SELECTED_WORK } from '../data/agencyData';
import { ProjectConcept } from '../types';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '../components/MotionReveal';

interface WorkPageProps {
  onSelectProject: (project: ProjectConcept) => void;
  onBackToHome: () => void;
  onStartProject: () => void;
}

export const WorkPage: React.FC<WorkPageProps> = ({
  onSelectProject,
  onBackToHome,
  onStartProject,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const categories = ['All', 'Commerce & Digital Experience', 'Product Interface & Design System', 'Brand Identity & Creative Direction', 'Campaign & Digital Narrative'];

  const filteredWork = activeFilter === 'All'
    ? SELECTED_WORK
    : SELECTED_WORK.filter((p) => p.category === activeFilter);

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
        <FadeUp distance={20} className="border-b border-[#DDD7CD] pb-10 mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
            Archive & Index
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#191816] tracking-tight mb-4">
            Selected Work.
          </h1>
          <p className="text-base sm:text-lg text-[#5C5853] max-w-2xl font-normal leading-relaxed">
            A curated record of our design systems, technical builds, and visual identities. We do not invent fictional client contracts: every entry here is clearly labeled as an independent concept or sample showcase.
          </p>

          {/* Interactive Filter Tabs (Zero-pill, clean segmented controls) */}
          <div className="flex flex-wrap items-center gap-2 pt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors ${
                  activeFilter === cat
                    ? 'bg-[#191816] text-[#FAF8F5]'
                    : 'bg-[#F2EFE9] text-[#5C5853] hover:text-[#191816] hover:bg-[#EAE5DC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* Work Grid with Staggered Intersection Observer Reveal */}
        <StaggerContainer key={activeFilter} staggerDelay={0.1} delayChildren={0.05} className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {filteredWork.map((project, idx) => (
            <StaggerItem
              key={project.id}
              distance={28}
              className="group cursor-pointer flex flex-col space-y-4"
            >
              <div
                onClick={() => onSelectProject(project)}
                className="flex flex-col space-y-4"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-sm bg-[#EAE5DC] border border-[#DDD7CD] shadow-sm">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute top-4 left-4 bg-[#FAF8F5]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#581825] border border-[#DDD7CD] rounded-xs">
                    {project.badge}
                  </div>

                  <div className="absolute bottom-4 right-4 bg-[#191816]/85 text-[#FAF8F5] p-2 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs text-[#7A746C] mb-1">
                    <span>{project.category}</span>
                    <span className="font-mono text-[11px]">PROJECT 0{idx + 1}</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-[#191816] group-hover:text-[#581825] transition-colors font-normal leading-snug">
                    {project.title}
                  </h3>

                  <p className="text-sm text-[#5C5853] mt-2 leading-relaxed">
                    {project.shortDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-[#7A746C]">
                    {project.servicesInvolved.map((s, i) => (
                      <span key={i} className="text-xs text-[#6B665F]">
                        {s}{i < project.servicesInvolved.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Closing CTA */}
        <FadeUp distance={20} className="mt-20 pt-12 border-t border-[#DDD7CD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl text-[#191816] font-normal mb-1">
              Have a bespoke challenge in mind?
            </h3>
            <p className="text-sm text-[#5C5853]">
              We assemble senior specialists around your specific deliverables.
            </p>
          </div>

          <button
            onClick={onStartProject}
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
          >
            Start a project brief
          </button>
        </FadeUp>
      </div>
    </div>
  );
};
