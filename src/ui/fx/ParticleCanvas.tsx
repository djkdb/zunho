import { useEffect, useRef } from 'react';
import type { FxId } from '../../game/types';
import { fxBus } from './fxBus';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  alpha: number;
  kind: 'mote' | 'spark' | 'ember';
}

const AMBIENT_MOTES = 34;
const MAX_DPR = 2;

const BURSTS: Partial<Record<FxId, { count: number; kind: Particle['kind'] }>> = {
  sparks: { count: 70, kind: 'spark' },
  dust: { count: 60, kind: 'mote' },
  reveal: { count: 46, kind: 'ember' },
};

function spawn(kind: Particle['kind'], x: number, y: number, w: number, h: number): Particle {
  const r = Math.random;
  if (kind === 'spark') {
    const angle = r() * Math.PI * 2;
    const speed = 2 + r() * 7;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 0, maxLife: 40 + r() * 40, size: 1 + r() * 2, hue: 35 + r() * 15, alpha: 1, kind };
  }
  if (kind === 'ember') {
    return { x: x + (r() - 0.5) * 220, y: y + (r() - 0.5) * 120, vx: (r() - 0.5) * 0.6, vy: -0.4 - r() * 1.2, life: 0, maxLife: 80 + r() * 80, size: 1 + r() * 2.2, hue: 30 + r() * 20, alpha: 1, kind };
  }
  // Ambient or burst dust mote
  return {
    x: x >= 0 ? x + (r() - 0.5) * 300 : r() * w,
    y: y >= 0 ? y + (r() - 0.5) * 200 : r() * h,
    vx: (r() - 0.5) * 0.25,
    vy: -0.05 - r() * 0.2,
    life: 0,
    maxLife: 400 + r() * 600,
    size: 0.6 + r() * 1.6,
    hue: 40,
    alpha: 0.15 + r() * 0.35,
    kind,
  };
}

/**
 * One canvas for all particles, driven by requestAnimationFrame —
 * completely outside React's render cycle.
 */
export function ParticleCanvas({ ambient, reducedMotion }: { ambient: boolean; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ ambient, reducedMotion });
  useEffect(() => {
    settings.current = { ambient, reducedMotion };
  }, [ambient, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    const particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const tick = () => {
      frame = 0;
      const { ambient: wantAmbient, reducedMotion: calm } = settings.current;
      const motes = particles.filter((p) => p.kind === 'mote' && p.maxLife > 300).length;
      if (wantAmbient && !calm && motes < AMBIENT_MOTES) particles.push(spawn('mote', -1, -1, width, height));

      ctx.clearRect(0, 0, width, height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.life += 1;
        if (p.life >= p.maxLife || (!wantAmbient && p.kind === 'mote' && p.maxLife > 300)) {
          particles.splice(i, 1);
          continue;
        }
        if (p.kind === 'spark') {
          p.vy += 0.18;
          p.vx *= 0.97;
        }
        p.x += p.vx;
        p.y += p.vy;
        const t = p.life / p.maxLife;
        const fade = p.kind === 'mote' ? Math.sin(t * Math.PI) : 1 - t;
        ctx.globalAlpha = Math.max(0, fade * p.alpha);
        ctx.fillStyle = `hsl(${p.hue}, 80%, ${p.kind === 'mote' ? 85 : 65}%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.length > 0 || settings.current.ambient) frame = requestAnimationFrame(tick);
      else running = false;
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const offFx = fxBus.on((fx) => {
      const burst = BURSTS[fx.id];
      if (!burst || settings.current.reducedMotion) {
        if (settings.current.ambient) start();
        return;
      }
      const x = fx.x ?? width / 2;
      const y = fx.y ?? height / 2;
      for (let i = 0; i < burst.count; i++) {
        const p = spawn(burst.kind, x, y, width, height);
        if (burst.kind === 'mote') {
          p.maxLife = 120 + Math.random() * 120;
          p.alpha = 0.5;
          p.vy = 0.3 + Math.random() * 0.8;
        }
        particles.push(p);
      }
      start();
    });

    start();
    window.addEventListener('resize', resize);
    return () => {
      offFx();
      window.removeEventListener('resize', resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Restart the loop when ambient is switched back on.
  useEffect(() => {
    if (ambient) fxBus.emit({ id: 'pulse' });
  }, [ambient]);

  return <canvas ref={canvasRef} className="fx-particles" aria-hidden="true" />;
}
