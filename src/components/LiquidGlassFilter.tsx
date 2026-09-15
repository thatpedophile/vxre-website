import React from 'react';

export const LiquidGlassFilter: React.FC = () => {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
      <filter id="liquid-glass-refraction" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.015"
          numOctaves="3"
          result="noise"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 100 0"
          result="alphaBoost"
        />
        <feGaussianBlur in="alphaBoost" stdDeviation="45" result="edgeBlur" />
        <feComponentTransfer in="edgeBlur" result="edgeMask">
          <feFuncA type="linear" slope="-1.3" intercept="1" />
        </feComponentTransfer>
        <feComposite
          in="noise"
          in2="edgeMask"
          operator="arithmetic"
          k1="1"
          k2="0"
          k3="0"
          k4="0"
          result="edgeNoise"
        />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="rChannel"
        />
        <feDisplacementMap
          in="rChannel"
          in2="edgeNoise"
          scale="65"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rDisp"
        />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="gChannel"
        />
        <feDisplacementMap
          in="gChannel"
          in2="edgeNoise"
          scale="56"
          xChannelSelector="R"
          yChannelSelector="G"
          result="gDisp"
        />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="bChannel"
        />
        <feDisplacementMap
          in="bChannel"
          in2="edgeNoise"
          scale="47"
          xChannelSelector="R"
          yChannelSelector="G"
          result="bDisp"
        />
        <feBlend in="rDisp" in2="gDisp" mode="screen" result="rg" />
        <feBlend in="rg" in2="bDisp" mode="screen" />
      </filter>
    </svg>
  );
};
