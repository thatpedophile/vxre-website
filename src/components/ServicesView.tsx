import React from 'react';
import { Shield, ArrowUpRight } from 'lucide-react';
import { AGENCY_SERVICES } from '../types';

interface ServicesViewProps {
  onOpenContact: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onOpenContact }) => {
  return (
    <div className="w-full my-8 lg:my-12 animate-fade-in">
      {/* Editorial Title */}
      <div className="max-w-4xl mb-10 sm:mb-14">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display text-xl font-medium tracking-[0.14em] uppercase text-[#2f2f2f]">
            VXRE
          </span>
          <span className="text-xs font-sans-custom tracking-widest text-[#2f2f2f]/50 uppercase">
            // Disciplines & Capabilities
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.88] font-normal uppercase tracking-tight text-[#2f2f2f] mb-5">
          Imperial Agency
          <br />
          <span className="font-light text-[#2f2f2f]/80">— Architecture & Strategy</span>
        </h1>

        <p className="font-sans-custom text-sm sm:text-base font-light text-[#2f2f2f]/75 max-w-2xl leading-relaxed">
          We design, orchestrate, and deploy high-impact creative campaigns, algorithmic social
          retention architectures, and private digital defense infrastructures for brands that refuse
          to be ignored.
        </p>
      </div>

      {/* Grid of Agency Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
        {AGENCY_SERVICES.map((srv, idx) => (
          <div
            key={srv.id}
            className="relative rounded-[36px] sm:rounded-[44px] border border-[#2f2f2f]/15 p-7 sm:p-9 bg-white/40 backdrop-blur-xl shadow-xl flex flex-col justify-between group transition-all duration-500 hover:border-[#2f2f2f]/35 hover:bg-white/60"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-[#2f2f2f]/50 tracking-widest uppercase">
                  0{idx + 1} // Discipline
                </span>
                <Shield className="w-5 h-5 text-[#2f2f2f]/40 group-hover:text-[#2f2f2f] transition-colors" />
              </div>

              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-[#2f2f2f] leading-none mb-2">
                {srv.title}
              </h2>

              <div className="font-sans-custom text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-3">
                {srv.subtitle}
              </div>

              <p className="font-sans-custom text-xs sm:text-sm font-light text-[#2f2f2f]/75 leading-relaxed mb-6">
                {srv.description}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#2f2f2f]/10 mb-5">
                {srv.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-white/70 border border-[#2f2f2f]/10 text-[11px] font-sans-custom font-medium text-[#2f2f2f]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={onOpenContact}
                className="w-full py-3 rounded-2xl bg-[#2f2f2f] hover:bg-black text-white font-sans-custom text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <span>Engage VXRE For {srv.title.split(' ')[0]}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
