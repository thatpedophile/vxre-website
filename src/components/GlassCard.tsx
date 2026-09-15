import React from 'react';
import { Shield } from 'lucide-react';

interface GlassCardProps {
  onOpenContact: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = () => {
  return (
    <div
      id="glass-card"
      className="relative w-full max-w-[340px] h-[460px] rounded-[48px] border border-[#2f2f2f]/20 p-8 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-xl bg-white/10 select-none group transition-all duration-500 hover:border-[#2f2f2f]/35 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      style={{
        boxShadow:
          'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 24px 48px -12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Background Liquid Glass Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none rounded-[48px]" />

      {/* Card Header & Shield */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="w-14 h-14 rounded-full bg-white/30 border border-[#2f2f2f]/15 backdrop-blur-2xl flex items-center justify-center shadow-xs transition-transform duration-500 group-hover:scale-105">
          <Shield className="w-5 h-5 text-[#2f2f2f]" />
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 border border-[#2f2f2f]/10 text-[10px] font-sans-custom font-bold uppercase tracking-wider text-[#2f2f2f]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Agency</span>
        </div>
      </div>

      {/* Card Body & Typography */}
      <div className="relative z-10">
        <h3 className="font-display text-[34px] sm:text-[38px] leading-[0.95] font-normal uppercase tracking-[0.02em] text-[#2f2f2f] mb-4">
          PROTECT THE WEB
          <br />
          <span className="font-light text-[#2f2f2f]/80">— UNBREAKABLE,</span>
          <br />
          INVISIBLE, ABSOLUTE
        </h3>

        <p className="font-sans-custom text-[13px] leading-[1.65] font-light text-[#2f2f2f]/70">
          Encrypt your traffic, amplify your authority, and dominate without restrictions. Full
          digital discretion and imperial creative execution.
        </p>
      </div>
    </div>
  );
};
