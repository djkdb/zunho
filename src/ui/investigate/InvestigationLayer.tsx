import { useEffect, useRef } from 'react';
import { dispatch, useGame } from '../../game/store';
import type { ObjectId, SceneRef } from '../../game/types';
import { IconBack } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';
import { ItemScene } from './ItemScene';
import { BasketScene } from './scenes/BasketScene';
import { BookshelfScene } from './scenes/BookshelfScene';
import { ClockScene } from './scenes/ClockScene';
import { DoorScene } from './scenes/DoorScene';
import { DrawerScene } from './scenes/DrawerScene';
import { PaintingScene } from './scenes/PaintingScene';
import { SafeScene } from './scenes/SafeScene';
import { WindowScene } from './scenes/WindowScene';

const OBJECT_SCENES: Partial<Record<ObjectId, () => React.ReactElement>> = {
  clock: ClockScene,
  painting: PaintingScene,
  bookshelf: BookshelfScene,
  drawer: DrawerScene,
  safe: SafeScene,
  door: DoorScene,
  window: WindowScene,
  basket: BasketScene,
};

function sceneKey(scene: SceneRef): string {
  return scene.kind === 'object' ? `o:${scene.id}` : `i:${scene.id}`;
}

/**
 * Close-up layer. The room camera zooms toward the object underneath,
 * and the detailed scene fades in on top — one continuous space, not a popup.
 */
export function InvestigationLayer() {
  const t = useT();
  const scene = useGame((s) => s.scene);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scene) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_SCENE' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scene]);

  // Move focus into the scene for keyboard and screen reader users.
  const key = scene ? sceneKey(scene) : null;
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const previous = lastKey.current;
    lastKey.current = key;
    if (key) {
      const el = rootRef.current?.querySelector<HTMLElement>('.scene button:not([disabled]), .scene [tabindex="0"]');
      (el ?? rootRef.current)?.focus({ preventScroll: true });
      return;
    }
    // Closed: hand focus back to whatever opened the close-up, like any well-behaved dialog.
    if (!previous) return;
    const [kind, id] = previous.split(':');
    const selector = kind === 'o' ? `[data-object="${id}"]` : `[data-item="${id}"]`;
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [key]);

  if (!scene) return null;
  const Scene = scene.kind === 'object' ? OBJECT_SCENES[scene.id] : undefined;

  return (
    <div
      ref={rootRef}
      className={`investigation investigation--${scene.kind}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scene-title"
      tabIndex={-1}
    >
      <div className="investigation-backdrop" onClick={() => dispatch({ type: 'CLOSE_SCENE' })} aria-hidden="true" />
      <div className="investigation-stage" key={key}>
        {scene.kind === 'item' ? <ItemScene item={scene.id} page={scene.page ?? 0} /> : Scene ? <Scene /> : null}
      </div>
      <button type="button" className="investigation-back" onClick={() => dispatch({ type: 'CLOSE_SCENE' })}>
        <IconBack size={20} />
        <span>{t(UI.back)}</span>
      </button>
    </div>
  );
}
