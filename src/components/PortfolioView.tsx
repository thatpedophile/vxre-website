import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface PortfolioViewProps {
  onOpenContact: () => void;
}

const CASE_STUDIES = [
  {
    id: 'vault',
    tag: 'FinTech & Sovereign Security',
    year: '2026',
    title: 'Imperial Vault Protocol',
    subtitle: 'Zero-Knowledge Wealth Security Portal & Rebranding',
    description:
      'Designed and engineered an elite privacy-first asset portal, backed by an enigmatic luxury campaign that positioned the brand as the paramount choice for ultra-high-net-worth liquidity.',
    metrics: [
      { label: 'Capital Inflow', val: '$42M' },
      { label: 'Conversion Lift', val: '+340%' },
      { label: 'Timeframe', val: '90 Days' },
    ],
    disciplines: ['Private Brand Architecture', 'Editorial Design', 'Encrypted UX'],
  },
  {
    id: 'aethelgard',
    tag: 'Haute Horlogerie & Luxury',
    year: '2026',
    title: 'Aethelgard Timepieces',
    subtitle: 'Viral Cinematic Campaign & Exclusive Global Drop',
    description:
      'Engineered an immersive cinematic video series and targeted programmatic acquisition framework that drove viral cultural conversation across watch aficionados and private collectors.',
    metrics: [
      { label: 'Sell-Out Speed', val: '48 Hours' },
      { label: 'Audience Reach', val: '2.8M Views' },
      { label: 'Target ROAS', val: '6.4x' },
    ],
    disciplines: ['Cinematic Production', 'Viral Shortform', 'Meta Media Buying'],
  },
  {
    id: 'sovereign',
    tag: 'Private Advisory & AI Infrastructure',
    year: '2025',
    title: 'Kestrel Sovereign Intelligence',
    subtitle: 'Digital Footprint Neutralization & Brand Defense',
    description:
      'Comprehensive erasure and sovereign digital reconstruction for a multinational family office. Established encrypted communication nodes, impenetrable PR defense, and authoritative search dominance.',
    metrics: [
      { label: 'Footprint Scrubbed', val: '100%' },
      { label: 'Adverse PR Resolved', val: 'Zero Trace' },
      { label: 'Infrastructure Uptime', val: '99.999%' },
    ],
    disciplines: ['Digital Sovereignty', 'Cyber Resilience', 'Brand Shielding'],
  },
];

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onOpenContact }) => {
  return (
    <div className="w-full my-8 lg:my-12 animate-fade-in">
      {/* Editorial Title */}
      <div className="max-w-4xl mb-10 sm:mb-14">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display text-xl font-medium tracking-[0.14em] uppercase text-[#2f2f2f]">
            VXRE
          </span>
          <span className="text-xs font-sans-custom tracking-widest text-[#2f2f2f]/50 uppercase">
            // Selected Case Engagements
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[0.88] font-normal uppercase tracking-tight text-[#2f2f2f] mb-5">
          Curated Case
          <br />
          <span className="font-light text-[#2f2f2f]/80">— Engagements & Triumphs</span>
        </h1>

        <p className="font-sans-custom text-sm sm:text-base font-light text-[#2f2f2f]/75 max-w-2xl leading-relaxed">
          Every project is an imperial deployment executed with mathematical rigor, supreme
          aesthetic discretion, and undeniable market outcome.
        </p>
      </div>

      {/* Case Studies Stack */}
      <div className="flex flex-col gap-6 lg:gap-8 mb-12">
        {CASE_STUDIES.map((cs) => (
          <div
            key={cs.id}
            className="relative rounded-[36px] sm:rounded-[44px] border border-[#2f2f2f]/15 p-7 sm:p-10 bg-white/40 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row justify-between gap-6 group transition-all duration-500 hover:border-[#2f2f2f]/35 hover:bg-white/60"
          >
            {/* Left Overview */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-0.5 rounded-full bg-[#2f2f2f] text-white text-[10px] font-sans-custom font-bold uppercase tracking-widest">
                  {cs.tag}
                </span>
                <span className="font-mono text-xs text-[#2f2f2f]/60 font-semibold">{cs.year}</span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-tight text-[#2f2f2f] leading-tight mb-2">
                {cs.title}
              </h2>

              <div className="font-sans-custom text-xs sm:text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3">
                {cs.subtitle}
              </div>

              <p className="font-sans-custom text-xs sm:text-sm font-light text-[#2f2f2f]/75 leading-relaxed mb-5 max-w-2xl">
                {cs.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {cs.disciplines.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 rounded-full bg-white/70 border border-[#2f2f2f]/10 text-[11px] font-sans-custom font-medium text-[#2f2f2f]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Metrics Box */}
            <div className="lg:w-[320px] flex flex-col justify-between p-5 sm:p-7 rounded-[30px] bg-white/60 border border-[#2f2f2f]/10 shadow-xs">
              <div>
                <div className="text-[10px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]/60 mb-3 pb-2 border-b border-[#2f2f2f]/10">
                  Documented Outcomes
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                  {cs.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="font-mono text-2xl sm:text-3xl font-bold text-[#2f2f2f] tracking-tight">
                        {m.val}
                      </div>
                      <div className="text-[11px] font-sans-custom font-medium text-[#2f2f2f]/60 mt-0.5">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenContact}
                className="w-full mt-5 py-3 rounded-2xl bg-[#2f2f2f] hover:bg-black text-white font-sans-custom text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <span>Commission Similar Scope</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
