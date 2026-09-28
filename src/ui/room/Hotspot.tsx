import { memo } from 'react';
import type { Rect } from '../../game/data/layout';
import type { RoomObjectDef } from '../../game/data/objects';
import { audio } from '../../audio/AudioEngine';
import type { ObjectId } from '../../game/types';
import { useT } from '../hooks';

interface HotspotProps {
  object: RoomObjectDef;
  rect: Rect;
  discovered: boolean;
  holding: boolean;
  disabled: boolean;
  glintDelay: number;
  onActivate: (id: ObjectId) => void;
}

/**
 * Invisible, focusable interaction zone over a room object.
 * Affordance comes from light, not labels: a soft glow on hover/focus,
 * and an occasional glint on objects the player has not examined yet.
 */
function HotspotImpl({ object, rect, discovered, holding, disabled, glintDelay, onActivate }: HotspotProps) {
  const t = useT();
  const labelAbove = rect.y > 120;
  return (
    <button
      type="button"
      className={`hotspot hotspot--${object.id} ${discovered ? 'is-discovered' : ''} ${holding ? 'is-target' : ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      onClick={() => onActivate(object.id)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') audio.play('uiHover');
      }}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={t(object.name)}
      aria-description={t(object.hover)}
      data-object={object.id}
    >
      <span className="hotspot-glow" aria-hidden="true" />
      {!discovered && (
        <span className="hotspot-glint" style={{ animationDelay: `${glintDelay}s` }} aria-hidden="true" />
      )}
      <span className={`hotspot-label ${labelAbove ? '' : 'is-below'}`} aria-hidden="true">
        <strong>{t(object.name)}</strong>
        <em>{t(object.hover)}</em>
      </span>
    </button>
  );
}

export const Hotspot = memo(HotspotImpl);
