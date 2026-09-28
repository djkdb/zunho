import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { OBJECT_RECTS, PAN_STOPS, STAGE_HEIGHT, STAGE_WIDTH, rectCenter } from '../../game/data/layout';
import { OBJECT_LIST } from '../../game/data/objects';
import { check } from '../../game/engine/conditions';
import { useSettings } from '../../game/settings';
import { dispatch, gameStore, shallowSelector, useGame } from '../../game/store';
import type { GameState, ObjectId } from '../../game/types';
import { RoomArt, type RoomVisualState } from '../art/RoomArt';
import { IconChevronLeft, IconChevronRight } from '../common/icons';
import { useReducedMotion, useT, useViewportSize } from '../hooks';
import { UI } from '../strings';
import { Hotspot } from './Hotspot';

const WIDE_RATIO = STAGE_WIDTH / STAGE_HEIGHT;
const ZOOM_FACTOR = 1.85;
const DRAG_THRESHOLD = 8;

const selectVisual = shallowSelector((s: GameState): RoomVisualState => ({
  lampOn: s.flags.lampOn,
  clock: s.clock,
  clockCaseOpen: s.flags.clockCaseOpen,
  clockKeyTaken: s.takenPickups.includes('clock_key'),
  memoVisible: !s.collectedItems.includes('note_left'),
  drawerOpen: s.flags.drawerOpen,
  shelfOpen: s.flags.shelfOpen,
  journalTaken: s.takenPickups.includes('shelf_journal'),
  safeOpen: s.flags.safeOpen,
  safeEmpty: s.takenPickups.includes('safe_key') && s.takenPickups.includes('safe_letter'),
  doorKeyInserted: s.flags.doorKeyInserted,
  houseRemembers: s.flags.houseRemembers,
}));

const selectFocus = (s: GameState): ObjectId | null => {
  if (s.scene?.kind === 'object') return s.scene.id;
  if (s.scene?.kind === 'item' && s.prevScene?.kind === 'object') return s.prevScene.id;
  return null;
};

interface Layout {
  scale: number;
  stageW: number;
  stageH: number;
  offsetY: number;
  minPan: number;
  pannable: boolean;
}

function computeLayout(vw: number, vh: number): Layout {
  const ratio = vw / vh;
  const scale = ratio < WIDE_RATIO ? vh / STAGE_HEIGHT : vw / STAGE_WIDTH;
  const stageW = STAGE_WIDTH * scale;
  const stageH = STAGE_HEIGHT * scale;
  // When the room is taller than the screen, crop more ceiling than floor.
  const offsetY = stageH > vh ? (vh - stageH) * 0.6 : (vh - stageH) / 2;
  const minPan = Math.min(0, vw - stageW);
  return { scale, stageW, stageH, offsetY, minPan, pannable: stageW > vw + 1 };
}

function clampPan(pan: number, layout: Layout): number {
  if (!layout.pannable) return (layout.minPan) / 2;
  return Math.max(layout.minPan, Math.min(0, pan));
}

function panForX(stageX: number, layout: Layout, vw: number): number {
  return clampPan(vw / 2 - stageX * layout.scale, layout);
}

export function Room() {
  const t = useT();
  const visual = useGame(selectVisual);
  const focus = useGame(selectFocus);
  const phase = useGame((s) => s.phase);
  const heldItem = useGame((s) => s.heldItem);
  const discovered = useGame((s) => s.discoveredObjects);
  const collected = useGame((s) => s.collectedItems);
  const showZones = useSettings((s) => s.showHotspots);
  const reducedMotion = useReducedMotion();
  const { width: vw, height: vh } = useViewportSize();
  const layout = useMemo(() => computeLayout(vw, vh), [vw, vh]);

  const cameraRef = useRef<HTMLDivElement>(null);
  const panRef = useRef(panForX(PAN_STOPS[2]!, layout, vw));
  const [panEdges, setPanEdges] = useState({ left: false, right: false });
  const dragRef = useRef<{ startX: number; startPan: number; dragging: boolean; pointerId: number } | null>(null);
  const suppressClick = useRef(false);

  const visibleObjects = useMemo(() => {
    const state = gameStore.getState();
    return OBJECT_LIST.filter((o) => check(o.visibleWhen, state));
    // `collected` is the only input that changes visibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collected]);

  const applyTransform = useCallback(
    (animate: boolean) => {
      const el = cameraRef.current;
      if (!el) return;
      let transform: string;
      if (focus) {
        const center = rectCenter(OBJECT_RECTS[focus]);
        const z = reducedMotion ? 1 : ZOOM_FACTOR;
        const s = layout.scale * z;
        const tx = vw / 2 - center.x * s;
        const ty = vh / 2 - center.y * s;
        transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
      } else {
        transform = `translate3d(${panRef.current}px, ${layout.offsetY}px, 0) scale(${layout.scale})`;
      }
      el.style.transition = animate ? '' : 'none';
      el.style.transform = transform;
      setPanEdges({
        left: layout.pannable && panRef.current < -2,
        right: layout.pannable && panRef.current > layout.minPan + 2,
      });
    },
    [focus, layout, vw, vh, reducedMotion],
  );

  // Re-clamp on resize and whenever the focus changes.
  useLayoutEffect(() => {
    panRef.current = clampPan(panRef.current, layout);
    applyTransform(true);
  }, [applyTransform, layout]);

  // When returning from a close-up on a narrow screen, keep that object in view.
  useEffect(() => {
    if (focus && layout.pannable) {
      panRef.current = panForX(rectCenter(OBJECT_RECTS[focus]).x, layout, vw);
    }
  }, [focus, layout, vw]);

  const panBy = useCallback(
    (direction: -1 | 1) => {
      const centerX = (vw / 2 - panRef.current) / layout.scale;
      const stops = direction > 0 ? PAN_STOPS.filter((x) => x > centerX + 20) : PAN_STOPS.filter((x) => x < centerX - 20).reverse();
      const target = stops[0] ?? (direction > 0 ? STAGE_WIDTH : 0);
      panRef.current = panForX(target, layout, vw);
      applyTransform(true);
    },
    [applyTransform, layout, vw],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameStore.getState().scene || !layout.pannable) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [role="dialog"]')) return;
      if (e.key === 'ArrowLeft') panBy(-1);
      if (e.key === 'ArrowRight') panBy(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panBy, layout.pannable]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (focus || !layout.pannable || e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startPan: panRef.current, dragging: false, pointerId: e.pointerId };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (!drag.dragging && Math.abs(dx) > DRAG_THRESHOLD) {
      drag.dragging = true;
      cameraRef.current?.setPointerCapture?.(drag.pointerId);
    }
    if (drag.dragging) {
      panRef.current = clampPan(drag.startPan + dx, layout);
      applyTransform(false);
    }
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.dragging) {
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick.current = false;
    }
  };

  const activate = useCallback((id: ObjectId) => {
    const held = gameStore.getState().heldItem;
    if (held) dispatch({ type: 'USE_ITEM', item: held, target: id });
    else dispatch({ type: 'OPEN_OBJECT', object: id });
  }, []);

  const interactive = phase === 'exploration';

  return (
    <div
      className={`room ${focus ? 'is-focused' : ''} ${heldItem ? 'is-holding' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onClick={(e) => {
        // Tapping bare wall while holding something simply puts it away.
        if (heldItem && !(e.target as HTMLElement).closest('button')) dispatch({ type: 'HOLD_ITEM', item: null });
      }}
    >
      <div
        ref={cameraRef}
        className="room-camera"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
      >
        <RoomArt {...visual} />
        <div className={`room-hotspots ${showZones ? 'show-zones' : ''}`} aria-hidden={!interactive}>
          {visibleObjects.map((object, index) => (
            <Hotspot
              key={object.id}
              object={object}
              rect={OBJECT_RECTS[object.id]}
              discovered={discovered.includes(object.id)}
              holding={!!heldItem}
              disabled={!interactive}
              glintDelay={(index * 1.7) % 9}
              onActivate={activate}
            />
          ))}
        </div>
      </div>
      {layout.pannable && interactive && (
        <>
          {panEdges.left && (
            <button type="button" className="pan-arrow pan-arrow--left" onClick={() => panBy(-1)} aria-label={t(UI.lookLeft)}>
              <IconChevronLeft size={28} />
            </button>
          )}
          {panEdges.right && (
            <button type="button" className="pan-arrow pan-arrow--right" onClick={() => panBy(1)} aria-label={t(UI.lookRight)}>
              <IconChevronRight size={28} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
