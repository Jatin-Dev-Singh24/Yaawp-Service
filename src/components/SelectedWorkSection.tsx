import React from 'react';
import { SELECTED_WORK } from '../data/agencyData';
import { ProjectConcept } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { FadeUp } from './MotionReveal';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { motion } from 'framer-motion';

interface SelectedWorkSectionProps {
  onSelectProject: (project: ProjectConcept) => void;
  onViewAllWork: () => void;
}

const ProjectCardItem: React.FC<{
  project: ProjectConcept;
  index: number;
  onSelectProject: (project: ProjectConcept) => void;
}> = ({ project, index, onSelectProject }) => {
  const { motionProps } = useScrollReveal<HTMLDivElement>({
    staggerIndex: index,
    staggerIncrement: 0.12,
    distance: 30,
    threshold: 0.1,
  });

  return (
    <motion.div
      {...motionProps}
      onClick={() => onSelectProject(project)}
      className="group cursor-pointer flex flex-col space-y-4"
    >
      {/* Large Image Frame */}
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-sm bg-[#EAE5DC] border border-[#DDD7CD] shadow-sm">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
          referrerPolicy="no-referrer"
        />

        {/* Honest Concept Stamp */}
        <div className="absolute top-4 left-4 bg-[#FAF8F5]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold text-[#581825] border border-[#DDD7CD] rounded-xs">
          {project.badge}
        </div>

        <div className="absolute bottom-4 right-4 bg-[#191816]/80 text-[#FAF8F5] p-2 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Editorial Meta & Title */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-xs text-[#7A746C] mb-1">
          <span>{project.category}</span>
          <span className="font-mono text-[11px]">0{index + 1}</span>
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl text-[#191816] group-hover:text-[#581825] transition-colors font-normal leading-snug">
          {project.title}
        </h3>

        <p className="text-sm text-[#5C5853] mt-2 line-clamp-2">
          {project.shortDescription}
        </p>

        {/* Services Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-[#7A746C]">
          {project.servicesInvolved.map((s, i) => (
            <span key={i} className="text-xs text-[#6B665F]">
              {s}{i < project.servicesInvolved.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const SelectedWorkSection: React.FC<SelectedWorkSectionProps> = ({
  onSelectProject,
  onViewAllWork,
}) => {
  return (
    <section id="work" className="py-20 md:py-32 bg-[#F6F3EE] border-t border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeUp distance={20} className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#DDD7CD]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#581825]">
                Portfolio
              </span>
              <span className="text-xs text-[#87827B]">·</span>
              <span className="text-xs font-medium text-[#6B665F]">
                Demonstrating capability & craft
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight">
              Selected work.
            </h2>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <span className="text-xs text-[#87827B] italic hidden sm:inline">
              All entries clearly labeled as independent concepts
            </span>
            <button
              onClick={onViewAllWork}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#191816] hover:text-[#581825] transition-colors"
            >
              <span>View full archive</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </FadeUp>

        {/* Editorial Project Showcase - with useScrollReveal on each item */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {SELECTED_WORK.map((project, idx) => (
            <ProjectCardItem
              key={project.id}
              project={project}
              index={idx}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
