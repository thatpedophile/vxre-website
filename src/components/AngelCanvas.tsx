import React, { useEffect, useRef, useState } from 'react';

const TRAIL_MAX_POINTS = 50;
const TRAIL_HEAD_R = 140;
const TRAIL_NOISE_AMP = 44;
const TRAIL_BLOB_PTS = 24;
const TRAIL_FADE_SPEED = 0.92;
const TRAIL_SAMPLE_DIST = 10;

interface Point {
  x: number;
  y: number;
  r: number;
  alpha: number;
  seed: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftSpeed: number;
  driftAmp: number;
  phase: number;
  baseAlpha: number;
}

function drawMorphBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  seed: number,
  alpha: number
) {
  if (r < 2) return;
  const pts: [number, number][] = [];
  for (let i = 0; i < TRAIL_BLOB_PTS; i++) {
    const angle = (i / TRAIL_BLOB_PTS) * Math.PI * 2;
    const n1 = Math.sin(angle * 3 + t * 1.4 + seed) * 0.45;
    const n2 = Math.sin(angle * 5 - t * 0.9 + seed * 2.3) * 0.3;
    const n3 = Math.cos(angle * 2 + t * 1.8 + seed * 0.7) * 0.25;
    const noise = (n1 + n2 + n3) * TRAIL_NOISE_AMP * (r / TRAIL_HEAD_R);
    const rad = r + noise;
    pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }

  ctx.globalAlpha = alpha;
  ctx.beginPath();
  const first = pts[0];
  const last = pts[pts.length - 1];
  ctx.moveTo((first[0] + last[0]) / 2, (first[1] + last[1]) / 2);
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const mx = (cur[0] + next[0]) / 2;
    const my = (cur[1] + next[1]) / 2;
    ctx.quadraticCurveTo(cur[0], cur[1], mx, my);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.globalAlpha = 1;
}

export const AngelCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const angelWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealImgRef = useRef<HTMLImageElement | null>(null);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Preload reveal image
    const revealImg = new Image();
    revealImg.src = '/assets/angel-reveal.webp';
    revealImgRef.current = revealImg;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let animId: number;
    const points: Point[] = [];
    const ambientParticles: AmbientParticle[] = [];
    let headRadius = 0;
    let time = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let hovering = false;
    let headSeed = Math.random() * 100;
    let targetGridX = 0;
    let targetGridY = 0;
    let currentGridX = 0;
    let currentGridY = 0;
    let targetAngelX = 0;
    let targetAngelY = 0;
    let currentAngelX = 0;
    let currentAngelY = 0;

    const initParticles = (w: number, h: number) => {
      ambientParticles.length = 0;
      for (let i = 0; i < 28; i++) {
        ambientParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.1 + Math.random() * 1.6,
          speedY: 0.2 + Math.random() * 0.4,
          driftSpeed: 0.5 + Math.random() * 0.7,
          driftAmp: 0.5 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          baseAlpha: 0.15 + Math.random() * 0.3,
        });
      }
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const onPointerMove = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;
      hovering = true;

      const cx = clientX / window.innerWidth - 0.5;
      const cy = clientY / window.innerHeight - 0.5;
      targetGridX = cx * 16;
      targetGridY = cy * 16;
      targetAngelX = cx * -16;
      targetAngelY = cy * -10;
    };

    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerEnter = () => {
      hovering = true;
    };

    const handlePointerLeave = () => {
      hovering = false;
      targetAngelX = 0;
      targetAngelY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    document.body.addEventListener('mouseenter', handlePointerEnter);
    document.body.addEventListener('mouseleave', handlePointerLeave);

    const render = () => {
      time += 0.016;

      const rect = container.getBoundingClientRect();
      const targetR = hovering ? TRAIL_HEAD_R : 0;
      const lerp = hovering ? 0.14 : 0.04;
      headRadius += (targetR - headRadius) * lerp;

      if (hovering && headRadius > 5) {
        const last = points[points.length - 1];
        const dist = last ? Math.hypot(mouseX - last.x, mouseY - last.y) : Infinity;
        if (dist > TRAIL_SAMPLE_DIST) {
          points.push({
            x: mouseX,
            y: mouseY,
            r: headRadius,
            alpha: 1,
            seed: Math.random() * 100,
          });
          if (points.length > TRAIL_MAX_POINTS) points.shift();
        }
      }

      for (let i = 0; i < points.length; i++) {
        points[i].alpha *= TRAIL_FADE_SPEED;
        points[i].r *= 0.995;
      }

      // Filter dead points
      while (points.length > 0 && points[0].alpha < 0.02) {
        points.shift();
      }

      // Smooth parallax and continuous ambient floating wave on angel wrapper
      const floatOffsetY = Math.sin(time * 0.9) * 8;
      const floatOffsetX = Math.cos(time * 0.45) * 4;

      currentAngelX += (targetAngelX - currentAngelX) * 0.04;
      currentAngelY += (targetAngelY - currentAngelY) * 0.04;
      if (angelWrapperRef.current) {
        angelWrapperRef.current.style.transform = `translate3d(${(currentAngelX + floatOffsetX).toFixed(2)}px, ${(currentAngelY + floatOffsetY).toFixed(2)}px, 0)`;
      }

      // Update grid parallax
      currentGridX += (targetGridX - currentGridX) * 0.06;
      currentGridY += (targetGridY - currentGridY) * 0.06;
      setGridOffset({
        x: Number(currentGridX.toFixed(2)),
        y: Number(currentGridY.toFixed(2)),
      });

      // Render canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (revealImgRef.current && revealImgRef.current.complete) {
        ctx.save();
        // 1. Draw organic mask shapes
        ctx.globalCompositeOperation = 'source-over';

        // Ambient gentle pulse on the wings for continuous subtle life
        const ambientBreath = (Math.sin(time * 0.7) + 1) * 0.5;
        const leftWingX = rect.width * 0.38;
        const rightWingX = rect.width * 0.62;
        const wingY = rect.height * 0.42;
        const ambientRadius = 100 + ambientBreath * 30;
        const ambientAlpha = 0.2 + 0.15 * ambientBreath;

        drawMorphBlob(ctx, leftWingX, wingY, ambientRadius, time * 0.8, 25, ambientAlpha);
        drawMorphBlob(ctx, rightWingX, wingY, ambientRadius, time * 0.8, 65, ambientAlpha);

        for (const p of points) {
          drawMorphBlob(ctx, p.x, p.y, p.r, time, p.seed, p.alpha);
        }
        if (hovering && headRadius > 2) {
          drawMorphBlob(ctx, mouseX, mouseY, headRadius, time, headSeed, 1);
        }

        // 2. Mask the reveal image inside the blobs
        ctx.globalCompositeOperation = 'source-in';
        // Compute cover crop coordinates
        const img = revealImgRef.current;
        const imgRatio = img.naturalWidth / img.naturalHeight || 1280 / 759;
        const containerRatio = rect.width / rect.height;

        let drawW = rect.width;
        let drawH = rect.height;
        let drawX = 0;
        let drawY = 0;

        if (containerRatio > imgRatio) {
          drawW = rect.width;
          drawH = rect.width / imgRatio;
          drawY = (rect.height - drawH) / 2;
        } else {
          drawH = rect.height;
          drawW = rect.height * imgRatio;
          drawX = (rect.width - drawW) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // Render floating sacred motes around angel & wings
      for (let i = 0; i < ambientParticles.length; i++) {
        const p = ambientParticles[i];
        p.y -= p.speedY;
        p.x += Math.sin(time * p.driftSpeed + p.phase) * (p.driftAmp * 0.5);

        if (p.y < -10) {
          p.y = rect.height + 10;
          p.x = Math.random() * rect.width;
        }

        const particleAlpha = p.baseAlpha * (0.8 + 0.4 * Math.sin(time * 2.5 + p.phase));
        ctx.fillStyle = `rgba(160, 140, 115, ${particleAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchMove);
      document.body.removeEventListener('mouseenter', handlePointerEnter);
      document.body.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  return (
    <div
      id="bg-media-container"
      ref={containerRef}
      className="fixed inset-0 bg-[#f4f0ea] z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Animated Angel Background with smooth breathing and 2.5D parallax */}
      <div
        id="angel-motion-wrapper"
        ref={angelWrapperRef}
        className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] z-[1] pointer-events-none will-change-transform"
      >
        <img
          id="bg-image"
          src="/assets/angel-bg.webp"
          alt="VXRE Imperial Angel"
          className="w-full h-full object-cover animate-angel-breath"
          loading="eager"
        />

        {/* Ethereal Wing Light Sweep Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-soft-light animate-wing-shimmer"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,250,235,0.9) 0%, rgba(250,240,220,0.4) 40%, transparent 75%)',
          }}
        />
      </div>

      {/* Dynamic Reveal Canvas with Morphing Blobs and Floating Motes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-[2] pointer-events-none"
      />

      {/* Subtle Classical Architectural Grid */}
      <svg
        id="grid-overlay"
        className="absolute inset-0 w-full h-full z-[3] opacity-10 pointer-events-none"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
            x={gridOffset.x}
            y={gridOffset.y}
          >
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2f2f2f" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
};
