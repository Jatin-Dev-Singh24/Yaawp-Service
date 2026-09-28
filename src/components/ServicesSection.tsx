import React from 'react';
import { SERVICES } from '../data/agencyData';
import { ServiceItem } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { FadeUp } from './MotionReveal';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { motion } from 'framer-motion';

interface ServicesSectionProps {
  onSelectService: (service: ServiceItem) => void;
  onStartProjectWithService: (serviceTitle: string) => void;
}

const ServiceGridItem: React.FC<{
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

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onSelectService,
  onStartProjectWithService,
}) => {
  return (
    <section id="services" className="py-20 md:py-32 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

        {/* 6 Services Grid with useScrollReveal on each item */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((srv, index) => (
            <ServiceGridItem
              key={srv.id}
              srv={srv}
              index={index}
              onSelectService={onSelectService}
              onStartProjectWithService={onStartProjectWithService}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
