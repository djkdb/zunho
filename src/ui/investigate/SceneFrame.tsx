import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ITEMS } from '../../game/data/items';
import { dispatch, useGame } from '../../game/store';
import type { ItemId, TargetId } from '../../game/types';
import { ItemArt } from '../art/ItemArt';
import { useT } from '../hooks';
import { UI } from '../strings';

interface SceneFrameProps {
  id: string;
  title: string;
  caption?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Scales a close-up down (never up) so it always fits the space it is given —
 * landscape phones and short laptop screens included — instead of pushing
 * keypads or buttons off-screen.
 */
function useFitToParent(): { outer: React.RefObject<HTMLDivElement | null>; inner: React.RefObject<HTMLDivElement | null> } {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = outer.current;
    const content = inner.current;
    if (!box || !content) return;
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scale = Math.min(1, box.clientWidth / content.offsetWidth, box.clientHeight / content.offsetHeight);
        content.style.transform = scale < 0.999 ? `scale(${Math.max(0.4, scale)})` : '';
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    observer.observe(content);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return { outer, inner };
}

export function SceneFrame({ id, title, caption, children, actions }: SceneFrameProps) {
  const t = useT();
  const { outer, inner } = useFitToParent();
  return (
    <div ref={outer} className="scene-fit">
      <div ref={inner} className={`scene scene--${id}`}>
        <header className="scene-head">
          <p className="scene-kicker">{t(UI.sceneOpen)}</p>
          <h2 id="scene-title">{title}</h2>
        </header>
        <div className="scene-body">{children}</div>
        {caption && <div className="scene-caption">{caption}</div>}
        {actions && <div className="scene-actions">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Convenience shortcut shown inside a scene when the player carries the right item.
 * Holding the item and tapping the target works too; this just keeps touch play smooth.
 */
export function UseItemChip({ item, target, visible }: { item: ItemId; target: TargetId; visible: boolean }) {
  const t = useT();
  const has = useGame((s) => s.inventory.includes(item));
  if (!has || !visible) return null;
  return (
    <button type="button" className="chip chip--use" onClick={() => dispatch({ type: 'USE_ITEM', item, target })}>
      <ItemArt item={item} className="chip-art" />
      {t(UI.useItem)}: {t(ITEMS[item].name)}
    </button>
  );
}

export function PickupButton({
  item,
  onTake,
  className,
  style,
}: {
  item: ItemId;
  onTake: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useT();
  return (
    <button
      type="button"
      className={`pickup ${className ?? ''}`}
      style={style}
      onClick={onTake}
      aria-label={`${t(UI.take)}: ${t(ITEMS[item].name)}`}
    >
      <ItemArt item={item} className="pickup-art" />
      <span className="pickup-label">{t(ITEMS[item].name)}</span>
    </button>
  );
}
