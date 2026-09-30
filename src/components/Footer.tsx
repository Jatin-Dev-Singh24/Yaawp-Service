import React from 'react';
import { YLogo } from './YLogo';
import { ViewMode } from '../types';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: ViewMode, hash?: string) => void;
  onSelectService?: (serviceId: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectService, onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#191816] text-[#FAF8F5] border-t border-[#2A2825] pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section with Brand & Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-[#2A2825]">
          <div className="lg:col-span-4 space-y-4">
            <YLogo
              size="lg"
              variant="light"
              onClick={() => {
                onNavigate('home');
                scrollToTop();
              }}
            />
            <p className="text-sm text-[#A6A097] leading-relaxed max-w-sm pt-2">
              A lean digital agency delivering web development, marketing, design and creative services through a curated network of independent specialists.
            </p>
            <div className="text-xs text-[#7A746C] tracking-wide pt-1">
              Strategy · Execution · Coordinated Delivery
            </div>
          </div>

          {/* Nav Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Column 1: Services */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A6A097] mb-4">
                Services
              </h4>
              <ul className="space-y-2.5 text-sm text-[#DAD5CE]">
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('web-development')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Web Development
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('ui-ux-design')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    UI/UX & Design
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('branding')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Branding
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('marketing')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Marketing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('content-creative')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Content & Creative
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectService && onSelectService('custom-projects')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Custom Projects
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A6A097] mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm text-[#DAD5CE]">
                <li>
                  <button
                    onClick={() => onNavigate('work')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Work
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('process')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Process
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('home', '#contact')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: For Specialists */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A6A097] mb-4">
                For Specialists
              </h4>
              <ul className="space-y-2.5 text-sm text-[#DAD5CE]">
                <li>
                  <button
                    onClick={() => onNavigate('join-network')}
                    className="hover:text-[#FAF8F5] transition-colors text-left"
                  >
                    Join the YAAWP Network
                  </button>
                </li>
                <li>
                  <span className="text-xs text-[#7A746C] block mt-1">
                    Independent designers, developers & strategists
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A6A097] mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-[#DAD5CE]">
                <li>
                  <button
                    onClick={() => onNavigate('privacy')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('terms')}
                    className="hover:text-[#FAF8F5] transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
                {onOpenAdmin && (
                  <li>
                    <button
                      onClick={onOpenAdmin}
                      className="hover:text-[#FAF8F5] transition-colors text-left text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      Staff Portal
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A746C]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} YAAWP Services. All rights reserved.</span>
            {onOpenAdmin && (
              <>
                <span>·</span>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-[#FAF8F5] transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                >
                  Agency Workspace
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[#655F57]">[Social links available on engagement]</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 hover:text-[#FAF8F5] transition-colors focus:outline-none focus-visible:underline"
              aria-label="Scroll back to top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
