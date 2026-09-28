import React, { useState, useRef, useEffect } from 'react';
import { YLogo } from './YLogo';
import { ViewMode } from '../types';
import { SERVICES } from '../data/agencyData';
import { ChevronDown, ArrowRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode, hash?: string) => void;
  onSelectService?: (serviceId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onSelectService,
}) => {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSolutionsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setSolutionsOpen(false);
    }, 150);
  };

  const handleServiceClick = (serviceId: string) => {
    setSolutionsOpen(false);
    setMobileMenuOpen(false);
    if (onSelectService) {
      onSelectService(serviceId);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E4DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark / Mark */}
        <div className="flex items-center">
          <YLogo
            size="md"
            variant="dark"
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#4A4641]" aria-label="Main Navigation">
          {/* Solutions Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className={`inline-flex items-center gap-1.5 py-2 hover:text-[#191816] transition-colors focus:outline-none focus-visible:underline ${
                solutionsOpen ? 'text-[#191816]' : ''
              }`}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
            >
              <span>Solutions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  solutionsOpen ? 'rotate-180 text-[#581825]' : 'text-[#87827B]'
                }`}
              />
            </button>

            {/* Mega Dropdown Panel matching reference video */}
            {solutionsOpen && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[720px] shadow-2xl rounded-sm z-50 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="bg-white border border-[#E2DDD5] p-6 shadow-[0_20px_50px_rgba(25,24,22,0.12)] grid grid-cols-12 gap-6">
                  {/* Left 2 Columns: 6 Services */}
                  <div className="col-span-7 grid grid-cols-2 gap-x-4 gap-y-4">
                    {SERVICES.map((srv) => (
                      <button
                        key={srv.id}
                        onClick={() => handleServiceClick(srv.id)}
                        className="text-left group p-2 rounded hover:bg-[#FAF8F5] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#581825]"
                        role="menuitem"
                      >
                        <div className="text-xs font-serif text-[#87827B] mb-0.5">{srv.number}</div>
                        <div className="text-[14px] font-semibold text-[#191816] group-hover:text-[#581825] transition-colors leading-snug">
                          {srv.title}
                        </div>
                        <div className="text-xs text-[#6B665F] line-clamp-1 mt-0.5 font-normal">
                          {srv.headline}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Editorial Highlight Card matching reference video */}
                  <div className="col-span-5 bg-[#581825] text-[#FAF8F5] p-5 flex flex-col justify-between rounded-sm">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FAF8F5]/70 block mb-2">
                        Delivery Architecture
                      </span>
                      <h4 className="font-serif text-lg leading-snug text-[#FAF8F5] mb-2">
                        Solutions built around the brief, not a fixed roster.
                      </h4>
                      <p className="text-xs text-[#FAF8F5]/85 leading-relaxed">
                        We assemble senior independent specialists around each project and manage the entire lifecycle under one roof.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSolutionsOpen(false);
                        onNavigate('process');
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#FAF8F5] hover:underline mt-4 group pt-2 border-t border-white/15"
                    >
                      <span>Explore how we deliver</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('work')}
            className={`py-2 hover:text-[#191816] transition-colors focus:outline-none focus-visible:underline ${
              currentView === 'work' ? 'text-[#191816] font-semibold' : ''
            }`}
          >
            Work
          </button>

          <button
            onClick={() => onNavigate('process')}
            className={`py-2 hover:text-[#191816] transition-colors focus:outline-none focus-visible:underline ${
              currentView === 'process' ? 'text-[#191816] font-semibold' : ''
            }`}
          >
            Process
          </button>

          <button
            onClick={() => onNavigate('about')}
            className={`py-2 hover:text-[#191816] transition-colors focus:outline-none focus-visible:underline ${
              currentView === 'about' ? 'text-[#191816] font-semibold' : ''
            }`}
          >
            About
          </button>

          <button
            onClick={() => onNavigate('pricing')}
            className={`py-2 hover:text-[#191816] transition-colors focus:outline-none focus-visible:underline ${
              currentView === 'pricing' ? 'text-[#191816] font-semibold' : ''
            }`}
          >
            Pricing
          </button>
        </nav>

        {/* Zone 3: Primary Action & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home', '#contact')}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#581825]"
          >
            Get started
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#191816] hover:bg-[#EFEAE2] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#581825]"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 bg-[#FAF8F5] z-50 overflow-y-auto px-6 py-8 border-t border-[#E8E4DC] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-[#E8E4DC] pb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#87827B] mb-3">
                Solutions & Services
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {SERVICES.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => handleServiceClick(srv.id)}
                    className="text-left py-1.5 flex items-center justify-between text-sm font-medium text-[#191816] hover:text-[#581825]"
                  >
                    <span>{srv.title}</span>
                    <span className="text-xs text-[#87827B] font-mono">{srv.number}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('work');
                }}
                className="block w-full text-left text-lg font-serif text-[#191816] py-1.5 hover:text-[#581825]"
              >
                Selected Work
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('process');
                }}
                className="block w-full text-left text-lg font-serif text-[#191816] py-1.5 hover:text-[#581825]"
              >
                Our Process
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('about');
                }}
                className="block w-full text-left text-lg font-serif text-[#191816] py-1.5 hover:text-[#581825]"
              >
                About YAAWP
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('pricing');
                }}
                className="block w-full text-left text-lg font-serif text-[#191816] py-1.5 hover:text-[#581825]"
              >
                Pricing Framework
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('join-network');
                }}
                className="block w-full text-left text-sm font-medium text-[#581825] py-2"
              >
                Join the Specialist Network →
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E8E4DC] mt-6">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('home', '#contact');
              }}
              className="w-full py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#581825] hover:bg-[#3E0E18] transition-colors rounded-sm"
            >
              Get started — Discuss a project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
