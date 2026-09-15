import React, { useState, useEffect } from 'react';
import { AngelCanvas } from './components/AngelCanvas';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import { Header } from './components/Header';
import { ServicesView } from './components/ServicesView';
import { PortfolioView } from './components/PortfolioView';
import { ContactModal } from './components/ContactModal';
import { NavSection } from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('features');
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Sync with URL params for seamless browser back/forward navigation in the same page
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'services') {
        setActiveSection('services');
      } else if (view === 'portfolio') {
        setActiveSection('portfolio');
      } else {
        setActiveSection('features');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    if (section === 'features') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', section);
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full select-none overflow-x-hidden bg-[#f4f0ea]">
      {/* SVG Liquid Glass Refraction Filter Definition */}
      <LiquidGlassFilter />

      {/* Interactive Angel Dual-Layer Morphing Background */}
      <AngelCanvas />

      {/* Main Responsive Layout Container */}
      <div
        id="main-layout"
        className="relative z-10 min-h-screen max-w-[1800px] mx-auto px-6 sm:px-12 py-6 sm:py-10 flex flex-col justify-between"
      >
        {/* Top Navigation Bar */}
        <Header
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onOpenContact={() => setContactModalOpen(true)}
        />

        {/* Dynamic In-Page Section Views */}
        {activeSection === 'features' && (
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end flex-1 my-8 lg:my-12 animate-fade-in">
            {/* Left Column: Imperial Headline & Copy */}
            <div className="lg:col-span-7 flex flex-col justify-between self-stretch pt-6 lg:pt-16 max-w-4xl">
              <div>
                {/* Grand Display Headline */}
                <h1 className="font-display text-[11vw] sm:text-[8vw] lg:text-[5.4vw] leading-[0.82] font-normal uppercase tracking-[-0.01em] text-[#2f2f2f] animate-fade-up">
                  <span className="block">CONQUER THE WEB</span>
                  <span className="block font-light text-[#2f2f2f]/95">— UNSEEN,</span>
                  <span className="block text-[#2f2f2f]/90">UNTOUCHABLE,</span>
                  <span className="block text-[#2f2f2f]/80">IMPERIAL</span>
                </h1>

                {/* Vertical Gradient Rule */}
                <div
                  className="w-[1px] h-28 sm:h-44 lg:h-52 my-6 sm:my-8 bg-gradient-to-b from-[#2f2f2f]/40 via-[#2f2f2f]/15 to-transparent animate-rule-in"
                  aria-hidden="true"
                />

                {/* Editorial Agency & Security Copy */}
                <p className="font-sans-custom text-sm sm:text-[15px] leading-[1.65] font-light text-[#2f2f2f]/70 max-w-[420px] animate-fade-in">
                  Encrypt your digital footprint, command brand dominance, and bypass every boundary. Full
                  strategic discretion, media architecture, and private intelligence — no logs, no limits, no
                  compromises.
                </p>
              </div>
            </div>

            {/* Right Column: Pure Display Typography (No Box / No Container) */}
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end text-left lg:text-right pb-2 animate-fade-in select-none">
              <h2 className="font-display text-[9vw] sm:text-[6vw] lg:text-[4.2vw] leading-[0.85] font-normal uppercase tracking-tight text-[#2f2f2f]">
                <span className="block">PROTECT THE WEB</span>
                <span className="block font-light text-[#2f2f2f]/90">— UNBREAKABLE,</span>
                <span className="block text-[#2f2f2f]/80">ABSOLUTE</span>
              </h2>

              {/* Minimal Accent Divider */}
              <div
                className="w-20 h-[1px] my-5 lg:ml-auto bg-gradient-to-r lg:bg-gradient-to-l from-[#2f2f2f]/40 to-transparent"
                aria-hidden="true"
              />

              <p className="font-sans-custom text-xs sm:text-sm font-light text-[#2f2f2f]/70 max-w-[320px] leading-[1.65]">
                Zero logs, sovereign brand architecture, and private digital defense for high-stakes leadership.
              </p>
            </div>
          </main>
        )}

        {/* Services View - Opens In Same Page */}
        {activeSection === 'services' && (
          <main className="flex-1">
            <ServicesView onOpenContact={() => setContactModalOpen(true)} />
          </main>
        )}

        {/* Portfolio View - Opens In Same Page */}
        {activeSection === 'portfolio' && (
          <main className="flex-1">
            <PortfolioView onOpenContact={() => setContactModalOpen(true)} />
          </main>
        )}

        {/* Subtle Bottom Information Bar */}
        <footer className="relative z-20 pt-4 pb-2 border-t border-[#2f2f2f]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-sans-custom text-[#2f2f2f]/60">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm tracking-[0.1em] uppercase text-[#2f2f2f] font-semibold">
              VXRE
            </span>
            <span>•</span>
            <span>Imperial Marketing & Social Architecture</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setContactModalOpen(true)}
              className="hover:text-[#2f2f2f] font-semibold uppercase tracking-wider cursor-pointer"
            >
              Direct Transmit
            </button>
          </div>
        </footer>
      </div>

      {/* Direct Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
}
