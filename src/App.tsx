/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewMode, ServiceItem, ProjectConcept } from './types';
import { SERVICES } from './data/agencyData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { ProjectModal } from './components/ProjectModal';
import { HomePage } from './pages/HomePage';
import { WorkPage } from './pages/WorkPage';
import { ProcessPage } from './pages/ProcessPage';
import { AboutPage } from './pages/AboutPage';
import { PricingPage } from './pages/PricingPage';
import { JoinNetworkPage } from './pages/JoinNetworkPage';
import { LegalPage } from './pages/LegalPages';
import { AdminWorkspacePage } from './pages/AdminWorkspacePage';
import { AnimatePresence, motion } from 'framer-motion';
import { editorialEase } from './components/MotionReveal';

export default function App() {
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard') ||
      hash === '#admin' ||
      hash === '#dashboard'
    );
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(checkIsAdmin);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activeModalService, setActiveModalService] = useState<ServiceItem | null>(null);
  const [activeModalProject, setActiveModalProject] = useState<ProjectConcept | null>(null);
  const [contactInitialService, setContactInitialService] = useState<string>('Web Development');
  const [contactInitialTier, setContactInitialTier] = useState<string>('Comprehensive Project');

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(checkIsAdmin());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Handle global key events for modals (e.g., ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalService(null);
        setActiveModalProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: ViewMode, hash?: string) => {
    setCurrentView(view);

    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectServiceById = (serviceId: string) => {
    const matched = SERVICES.find((s) => s.id === serviceId);
    if (matched) {
      setActiveModalService(matched);
    }
  };

  const handleStartProjectWithService = (serviceTitle?: string) => {
    if (serviceTitle) {
      setContactInitialService(serviceTitle);
    }
    if (currentView !== 'home') {
      setCurrentView('home');
    }
    setTimeout(() => {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleStartSimilarProject = (projectName: string) => {
    setContactInitialService(`Similar to ${projectName}`);
    if (currentView !== 'home') {
      setCurrentView('home');
    }
    setTimeout(() => {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (isAdminView) {
    return (
      <AdminWorkspacePage
        onReturnToPublic={() => {
          setIsAdminView(false);
          window.history.pushState(null, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#191816]">
      {/* Global Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSelectService={handleSelectServiceById}
        onOpenAdmin={() => {
          setIsAdminView(true);
          window.history.pushState(null, '', '/admin');
        }}
      />

      {/* Main View Area with Smooth Motion Transitions */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <HomePage
                onStartProject={() => handleStartProjectWithService()}
                onExploreServices={() => handleNavigate('home', '#services')}
                onLearnMoreProcess={() => handleNavigate('process')}
                onViewAllWork={() => handleNavigate('work')}
                onSelectService={(service) => setActiveModalService(service)}
                onSelectProject={(project) => setActiveModalProject(project)}
                onStartProjectWithService={handleStartProjectWithService}
                onOpenPrivacy={() => handleNavigate('privacy')}
                initialServiceForContact={contactInitialService}
                initialTierForContact={contactInitialTier}
              />
            </motion.div>
          )}

          {currentView === 'work' && (
            <motion.div
              key="work"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <WorkPage
                onSelectProject={(project) => setActiveModalProject(project)}
                onBackToHome={() => handleNavigate('home')}
                onStartProject={() => handleStartProjectWithService()}
              />
            </motion.div>
          )}

          {currentView === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <ProcessPage
                onBackToHome={() => handleNavigate('home')}
                onStartProject={() => handleStartProjectWithService()}
              />
            </motion.div>
          )}

          {currentView === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <AboutPage
                onBackToHome={() => handleNavigate('home')}
                onStartProject={() => handleStartProjectWithService()}
                onJoinNetwork={() => handleNavigate('join-network')}
              />
            </motion.div>
          )}

          {currentView === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <PricingPage
                onBackToHome={() => handleNavigate('home')}
                onSelectTier={(tierName) => {
                  setContactInitialTier(tierName);
                  handleStartProjectWithService();
                }}
                onRequestQuote={() => handleStartProjectWithService()}
              />
            </motion.div>
          )}

          {currentView === 'join-network' && (
            <motion.div
              key="join-network"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <JoinNetworkPage onBackToHome={() => handleNavigate('home')} />
            </motion.div>
          )}

          {currentView === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <LegalPage type="privacy" onBackToHome={() => handleNavigate('home')} />
            </motion.div>
          )}

          {currentView === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: editorialEase }}
            >
              <LegalPage type="terms" onBackToHome={() => handleNavigate('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        onSelectService={handleSelectServiceById}
        onOpenAdmin={() => {
          setIsAdminView(true);
          window.history.pushState(null, '', '/admin');
        }}
      />

      {/* Interactive Detail Modals */}
      <ServiceDetailModal
        service={activeModalService}
        onClose={() => setActiveModalService(null)}
        onScopeService={handleStartProjectWithService}
      />

      <ProjectModal
        project={activeModalProject}
        onClose={() => setActiveModalProject(null)}
        onStartSimilarProject={handleStartSimilarProject}
      />
    </div>
  );
}
