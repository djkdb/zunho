import { useEffect, useRef, useState, type RefObject } from 'react';
import { gameStore } from '../../game/store';
import type { ItemId } from '../../game/types';
import { ItemArt } from '../art/ItemArt';
import { fxBus } from './fxBus';
import { ParticleCanvas } from './ParticleCanvas';

const SHAKE_FRAMES: Keyframe[] = [
  { transform: 'translate3d(0,0,0)' },
  { transform: 'translate3d(-9px, 3px, 0)' },
  { transform: 'translate3d(8px, -4px, 0)' },
  { transform: 'translate3d(-6px, -2px, 0)' },
  { transform: 'translate3d(5px, 3px, 0)' },
  { transform: 'translate3d(-2px, 1px, 0)' },
  { transform: 'translate3d(0,0,0)' },
];

interface FlyingItem {
  key: number;
  item: ItemId;
}

let flyKey = 1;

/** Screen flash, camera shake, particle bursts and the "item flies into your pocket" beat. */
export function FxLayer({ shakeTarget, reducedMotion }: { shakeTarget: RefObject<HTMLElement | null>; reducedMotion: boolean }) {
  const [flash, setFlash] = useState<{ key: number; warm: boolean } | null>(null);
  const [flying, setFlying] = useState<FlyingItem[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    const offFx = fxBus.on((fx) => {
      if (fx.id === 'flash' || fx.id === 'flashWarm') {
        const key = Date.now();
        setFlash({ key, warm: fx.id === 'flashWarm' });
        later(() => setFlash((f) => (f?.key === key ? null : f)), 900);
      }
      if ((fx.id === 'shake' || fx.id === 'shakeSoft') && !reducedMotion) {
        const el = shakeTarget.current;
        if (el?.animate) {
          const scale = fx.id === 'shake' ? 1 : 0.45;
          el.animate(
            SHAKE_FRAMES.map((f) => ({
              transform: String(f.transform).replace(/-?\d+px/g, (m) => `${parseFloat(m) * scale}px`),
            })),
            { duration: fx.id === 'shake' ? 420 : 520, easing: 'ease-out' },
          );
        }
      }
    });
    const offGame = gameStore.onEvent((event) => {
      if (event.type === 'fx') fxBus.emit({ id: event.id });
      if (event.type === 'itemAcquired' && !reducedMotion) {
        const entry = { key: flyKey++, item: event.item };
        setFlying((f) => [...f, entry]);
        later(() => setFlying((f) => f.filter((x) => x.key !== entry.key)), 1100);
      }
    });
    const list = timers.current;
    return () => {
      offFx();
      offGame();
      list.forEach((id) => window.clearTimeout(id));
    };
  }, [shakeTarget, reducedMotion]);

  return (
    <div className="fx-layer" aria-hidden="true">
      <ParticleCanvas ambient reducedMotion={reducedMotion} />
      {flash && <div key={flash.key} className={`fx-flash ${flash.warm ? 'fx-flash--warm' : ''}`} />}
      {flying.map((f) => (
        <div key={f.key} className="fx-fly">
          <ItemArt item={f.item} />
        </div>
      ))}
    </div>
  );
}
