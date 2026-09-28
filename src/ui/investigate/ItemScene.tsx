import { useEffect, useRef, useState } from 'react';
import { DOCS, type DocPage } from '../../game/data/docs';
import { ITEMS } from '../../game/data/items';
import { check } from '../../game/engine/conditions';
import { dispatch, gameStore, useGame } from '../../game/store';
import type { ItemId } from '../../game/types';
import { ItemArt } from '../art/ItemArt';
import { PhotoArt } from '../art/PhotoArt';
import { IconChevronLeft, IconChevronRight } from '../common/icons';
import { fxMemory } from '../fx/fxBus';
import { useT } from '../hooks';
import { UI } from '../strings';
import { SceneFrame } from './SceneFrame';

const REVEAL_WINDOW_MS = 1800;

/** True for a short while after a heat-reveal happened, so the text can "burn in". */
function useRevealAnimation(revealed: boolean): boolean {
  const [animating, setAnimating] = useState(
    () => revealed && performance.now() - fxMemory.lastRevealAt < REVEAL_WINDOW_MS,
  );
  const [prevRevealed, setPrevRevealed] = useState(revealed);
  if (revealed !== prevRevealed) {
    // Revealed while the page is open: burn the text in.
    setPrevRevealed(revealed);
    if (revealed) setAnimating(true);
  }
  useEffect(() => {
    if (!animating) return;
    const id = window.setTimeout(() => setAnimating(false), 3200);
    return () => window.clearTimeout(id);
  }, [animating]);
  return animating;
}

function PageText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`doc-text ${className ?? ''}`}>
      {text.split('\n').map((line, i) => (
        <p key={i}>{line || ' '}</p>
      ))}
    </div>
  );
}

function usePageContent(page: DocPage | undefined) {
  const revealed = useGame((s) => !!page?.hidden && check(page.hidden.when, s));
  return { revealed, text: page ? (revealed && page.hidden ? page.hidden.text : page.text) : null };
}

function Pager({ item, page, count }: { item: ItemId; page: number; count: number }) {
  const t = useT();
  if (count <= 1) return null;
  const doc = ITEMS[item].doc!;
  const go = (p: number) => dispatch({ type: 'READ_PAGE', doc, page: p });
  return (
    <div className="pager">
      <button type="button" className="pager-btn" onClick={() => go(page - 1)} disabled={page <= 0} aria-label={t(UI.prevPage)}>
        <IconChevronLeft />
      </button>
      <span className="pager-count">
        {page + 1} / {count}
      </span>
      <button type="button" className="pager-btn" onClick={() => go(page + 1)} disabled={page >= count - 1} aria-label={t(UI.nextPage)}>
        <IconChevronRight />
      </button>
    </div>
  );
}

function LampButton({ item }: { item: ItemId }) {
  const t = useT();
  return (
    <button type="button" className="brass-button brass-button--glow" onClick={() => dispatch({ type: 'USE_ITEM', item, target: 'lamp' })}>
      {t(UI.holdToLamp)}
    </button>
  );
}

function DocumentView({ item, page }: { item: ItemId; page: number }) {
  const t = useT();
  const doc = DOCS[ITEMS[item].doc!];
  const pageDef = doc.pages[Math.min(page, doc.pages.length - 1)];
  const { revealed, text } = usePageContent(pageDef);
  const animating = useRevealAnimation(revealed);
  const inkRevealed = useGame((s) => s.flags.inkRevealed);
  const onBlankPage = item === 'journal' && page === 3 && !inkRevealed;

  // Swipe between pages on touch screens.
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0]?.clientX ?? null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    const next = page + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < doc.pages.length) dispatch({ type: 'READ_PAGE', doc: doc.id, page: next });
  };

  return (
    <div className="doc-wrap">
      <article
        key={page}
        className={`doc doc--${doc.style} doc--${item} ${animating ? 'is-revealing' : ''}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={t(ITEMS[item].name)}
      >
        {text && <PageText text={t(text)} className={revealed ? 'doc-text--ink' : ''} />}
      </article>
      <Pager item={item} page={page} count={doc.pages.length} />
      {onBlankPage && <LampButton item="journal" />}
    </div>
  );
}

function PhotoView({ page }: { page: number }) {
  const t = useT();
  const truth = useGame((s) => s.flags.photoTruth);
  const psRead = useGame((s) => s.flags.psRead);
  const back = page === 1;
  const doc = DOCS.photograph;
  const { revealed, text } = usePageContent(doc.pages[1]);
  const animating = useRevealAnimation(truth);

  return (
    <div className="doc-wrap">
      <div className={`photo ${back ? 'is-back' : ''} ${animating ? 'is-revealing' : ''}`}>
        <div className="photo-face photo-front">
          <PhotoArt truth={truth} />
        </div>
        <div className="photo-face photo-back">
          {text && <PageText text={t(text)} className={revealed ? 'doc-text--ink' : ''} />}
        </div>
      </div>
      <p className="doc-caption">{t(back ? { en: 'The back.', ko: '뒷면.' } : doc.pages[0]!.text)}</p>
      <div className="scene-actions">
        <button
          type="button"
          className="chip"
          onClick={() => dispatch({ type: 'READ_PAGE', doc: 'photograph', page: back ? 0 : 1 })}
        >
          {t(UI.turnOver)}
        </button>
        {psRead && !truth && <LampButton item="photograph" />}
      </div>
    </div>
  );
}

export function ItemScene({ item, page }: { item: ItemId; page: number }) {
  const t = useT();
  const def = ITEMS[item];
  const owned = useGame((s) => s.inventory.includes(item));

  // Closing the inspector if the item was consumed (e.g. notes combined).
  useEffect(() => {
    if (!owned && gameStore.getState().scene?.kind === 'item') dispatch({ type: 'CLOSE_SCENE' });
  }, [owned]);

  return (
    <SceneFrame id={`item scene--item-${def.category}`} title={t(def.name)} caption={<p>{t(def.description)}</p>}>
      {item === 'photograph' ? (
        <PhotoView page={page} />
      ) : def.doc ? (
        <DocumentView item={item} page={page} />
      ) : (
        <div className="item-showcase">
          <ItemArt item={item} className="item-showcase-art" />
        </div>
      )}
    </SceneFrame>
  );
}
