import React from 'react';

interface HelmetCardProps {
  onOpenContact?: () => void;
}

export const HelmetCard: React.FC<HelmetCardProps> = ({ onOpenContact }) => {
  return (
    <div
      id="helmet-card"
      onClick={onOpenContact}
      className="relative w-[180px] sm:w-[220px] h-[260px] sm:h-[320px] rounded-[40px] border border-white/40 overflow-hidden shadow-xl bg-gradient-to-b from-white/20 to-black/10 backdrop-blur-md cursor-pointer select-none group transition-all duration-700 hover:border-white/70 hover:shadow-2xl"
    >
      {/* 3D Classical Marble Bust Statue with Crown */}
      <img
        src="/assets/statue-helmet.png"
        alt="VXRE Imperial Marble Bust"
        className="w-full h-full object-cover transition-transform duration-1000 ease-out scale-140 rotate-15 group-hover:scale-145 group-hover:rotate-18"
      />

      {/* Subtle Specular Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

      {/* Bottom Tag */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <span className="px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-md font-sans-custom text-[9px] font-bold tracking-widest uppercase text-[#2f2f2f] shadow-xs">
          Imperial
        </span>
        <span className="font-sans-custom text-[9px] font-semibold tracking-widest text-white/90 drop-shadow-md">
          VXRE
        </span>
      </div>
    </div>
  );
};
