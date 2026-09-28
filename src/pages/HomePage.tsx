import React from 'react';
import { Hero } from '../components/Hero';
import { Positioning } from '../components/Positioning';
import { ProcessSection } from '../components/ProcessSection';
import { WhyYaawpSection } from '../components/WhyYaawpSection';
import { PricingSection } from '../components/PricingSection';
import { SocialProofSection } from '../components/SocialProofSection';
import { ContactSection } from '../components/ContactSection';
import { FadeUp } from '../components/MotionReveal';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { SERVICES, SELECTED_WORK } from '../data/agencyData';
import { ServiceItem, ProjectConcept } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomePageProps {
  onStartProject: () => void;
  onExploreServices: () => void;
  onLearnMoreProcess: () => void;
  onViewAllWork: () => void;
  onSelectService: (service: ServiceItem) => void;
  onSelectProject: (project: ProjectConcept) => void;
  onStartProjectWithService: (serviceTitle?: string) => void;
  onOpenPrivacy: () => void;
  initialServiceForContact?: string;
  initialTierForContact?: string;
}

/**
 * Service Grid Item configured with the useScrollReveal hook
 * for staggered editorial entrance as the user scrolls down.
 */
const ServiceCardItem: React.FC<{
  srv: ServiceItem;
  index: number;
  onSelectService: (service: ServiceItem) => void;
  onStartProjectWithService: (serviceTitle: string) => void;
}> = ({ srv, index, onSelectService, onStartProjectWithService }) => {
  const { motionProps } = useScrollReveal<HTMLDivElement>({
    staggerIndex: index,
    staggerIncrement: 0.08,
    distance: 26,
    threshold: 0.1,
  });

  return (
    <motion.div
      {...motionProps}
      className="group bg-[#FAF8F5] hover:bg-[#F4EFEB] p-7 sm:p-8 rounded-sm border border-[#E5E0D6] hover:border-[#CDC6B9] transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono font-medium text-[#87827B]">
            {srv.number}
          </span>
          <button
            onClick={() => onSelectService(srv)}
            className="p-1.5 text-[#87827B] group-hover:text-[#581825] transition-colors rounded hover:bg-[#FAF8F5]"
            aria-label={`View full scope of ${srv.title}`}
          >
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <h3 className="font-serif text-2xl font-normal text-[#191816] mb-3 group-hover:text-[#581825] transition-colors">
          {srv.title}
        </h3>

        <p className="text-xs font-semibold uppercase tracking-wider text-[#7A746C] mb-3">
          {srv.headline}
        </p>

        <p className="text-sm text-[#4A4641] leading-relaxed mb-6 font-normal">
          {srv.description}
        </p>
      </div>

      <div className="pt-4 border-t border-[#E8E4DC] flex items-center justify-between">
        <button
          onClick={() => onSelectService(srv)}
          className="text-xs font-medium text-[#6B665F] group-hover:text-[#191816] underline underline-offset-4 decoration-[#D1CBC0] hover:decoration-[#191816] transition-all"
        >
          View deliverables
        </button>

        <button
          onClick={() => onStartProjectWithService(srv.title)}
          className="text-xs font-semibold uppercase tracking-wider text-[#581825] hover:text-[#3E0E18] transition-colors"
        >
          Scope project →
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Project Card Item configured with the useScrollReveal hook
 * for staggered editorial entrance as the user scrolls down.
 */
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

export const HomePage: React.FC<HomePageProps> = ({
  onStartProject,
  onExploreServices,
  onLearnMoreProcess,
  onViewAllWork,
  onSelectService,
  onSelectProject,
  onStartProjectWithService,
  onOpenPrivacy,
  initialServiceForContact,
  initialTierForContact,
}) => {
  return (
    <main>
      {/* SECTION 1 — HERO */}
      <Hero
        onStartProject={onStartProject}
        onExploreServices={onExploreServices}
      />

      {/* SECTION 2 — POSITIONING */}
      <Positioning onLearnMoreProcess={onLearnMoreProcess} />

      {/* SECTION 3 — SOLUTIONS / SERVICES (Uses useScrollReveal with staggered delays) */}
      <section id="services" className="py-20 md:py-32 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp distance={20} className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#E5E0D6]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-2">
                Capabilities
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#191816] tracking-tight">
                Solutions built around the brief.
              </h2>
            </div>
            <p className="text-sm text-[#6B665F] max-w-md mt-4 md:mt-0 font-normal">
              Specialized craft delivered by vetted independent talent, coordinated under single-source agency management.
            </p>
          </FadeUp>

          {/* Staggered Service Grid items triggered by useScrollReveal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((srv, index) => (
              <ServiceCardItem
                key={srv.id}
                srv={srv}
                index={index}
                onSelectService={onSelectService}
                onStartProjectWithService={(title) => {
                  if (onStartProjectWithService) onStartProjectWithService(title);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — SELECTED WORK (Uses useScrollReveal with staggered delays) */}
      <section id="work" className="py-20 md:py-32 bg-[#F6F3EE] border-t border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Staggered Project Cards triggered by useScrollReveal */}
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

      {/* SECTION 5 — HOW IT WORKS */}
      <ProcessSection
        onLearnMoreProcess={onLearnMoreProcess}
        onStartProject={onStartProject}
      />

      {/* SECTION 6 — WHY YAAWP */}
      <WhyYaawpSection />

      {/* SECTION 7 — PRICING */}
      <PricingSection onDiscussProject={onStartProjectWithService} />

      {/* SECTION 8 — SOCIAL PROOF */}
      <SocialProofSection onStartProject={onStartProject} />

      {/* SECTION 9 — CONTACT / START A PROJECT */}
      <ContactSection
        initialService={initialServiceForContact}
        initialBudget={initialTierForContact}
        onOpenPrivacy={onOpenPrivacy}
      />
    </main>
  );
};
