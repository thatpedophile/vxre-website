import React, { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NavSection } from '../types';

interface HeaderProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenContact: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavSection; label: string }[] = [
    { id: 'features', label: 'Features' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolio' },
  ];

  return (
    <header className="relative z-30 flex items-center justify-between py-4 sm:py-6 animate-fade-down">
      {/* Brand Logo & Wordmark */}
      <a
        href="#top"
        id="header-brand-logo"
        className="group flex items-center gap-3 cursor-pointer select-none"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('features');
        }}
      >
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 text-[#2f2f2f] transition-transform duration-500 ease-out group-hover:scale-105"
          viewBox="0 0 57 56"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M28.5 2 L38 20 L28.5 16 L19 20 Z" />
          <path d="M6 26 L28.5 18 L51 26 L28.5 32 Z" />
          <path d="M10 32 L28.5 26 L47 32 L28.5 40 L10 32 Z" />
          <path d="M14 40 L28.5 34 L43 40 L28.5 54 L14 40 Z" />
        </svg>
        <span className="font-display text-2xl sm:text-3xl font-medium tracking-[0.14em] uppercase text-[#2f2f2f]">
          VXRE
        </span>
      </a>

      {/* Desktop Navigation Pill */}
      <nav
        id="nav-pill"
        className="hidden md:flex items-center h-14 sm:h-16 px-2 sm:px-3 gap-1 rounded-full glass-pill"
        aria-label="Primary Navigation"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectSection(item.id)}
              className={`relative px-4 sm:px-5 py-2.5 rounded-full font-sans-custom text-[11px] sm:text-xs font-bold uppercase tracking-[0.06em] transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'text-[#2f2f2f] bg-[rgba(47,47,47,0.12)] shadow-xs'
                  : 'text-[#2f2f2f]/60 hover:text-[#2f2f2f] hover:bg-white/30'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Header Action Buttons */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
        {/* WhatsApp Direct Action (Arrow) */}
        <a
          href="https://wa.me/573151969168"
          target="_blank"
          rel="noopener noreferrer"
          id="btn-whatsapp-circle"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center glass-btn text-[#2f2f2f] group"
          title="Direct WhatsApp Chat: +57 315 1969168"
          aria-label="Chat on WhatsApp"
        >
          <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        {/* Contact Us Glass Capsule */}
        <button
          onClick={onOpenContact}
          id="btn-contact-us"
          className="h-12 sm:h-14 px-6 sm:px-7 rounded-full flex items-center justify-center glass-btn font-sans-custom text-xs font-bold uppercase tracking-[0.08em] text-[#2f2f2f] cursor-pointer"
        >
          Contact Us
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        id="btn-mobile-menu"
        className="flex sm:hidden w-11 h-11 rounded-full items-center justify-center bg-[#2f2f2f] text-white shadow-md cursor-pointer"
        aria-label="Toggle Navigation Menu"
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile Menu Dropdown & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay to prevent underlying content bleed */}
          <div
            className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Opaque, high-contrast Mobile Menu Dropdown */}
          <div
            id="mobile-dropdown"
            className="sm:hidden absolute top-full left-0 right-0 mt-3 p-5 rounded-3xl bg-[#f4f0ea] border border-[#2f2f2f]/20 shadow-2xl flex flex-col gap-3 z-50 animate-fade-down text-[#2f2f2f]"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(47, 47, 47, 0.15)',
            }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2f2f2f]/60 px-2 pt-1">
              Navigation Menu
            </div>

            <div className="flex flex-col gap-2 pb-3 border-b border-[#2f2f2f]/15">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl text-left font-sans-custom text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                    activeSection === item.id
                      ? 'bg-[#2f2f2f] text-white shadow-md'
                      : 'bg-white hover:bg-neutral-100 text-[#2f2f2f] border border-[#2f2f2f]/10'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeSection === item.id ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#2f2f2f]/40" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Contact Action on Mobile */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="w-full py-4 rounded-2xl bg-[#2f2f2f] hover:bg-black text-white font-sans-custom text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>Contact Us</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
