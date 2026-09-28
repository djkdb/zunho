import { useEffect, useState } from 'react';
import { ITEMS } from '../../game/data/items';
import { dispatch, gameStore, useGame } from '../../game/store';
import type { ItemId } from '../../game/types';
import { ItemArt } from '../art/ItemArt';
import { IconEye, IconHand } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';

const NEW_ITEM_MS = 1600;

function useFreshItems(): ItemId[] {
  const [fresh, setFresh] = useState<ItemId[]>([]);
  useEffect(() => {
    const timers: number[] = [];
    const off = gameStore.onEvent((event) => {
      if (event.type !== 'itemAcquired') return;
      setFresh((f) => [...f, event.item]);
      timers.push(window.setTimeout(() => setFresh((f) => f.filter((i) => i !== event.item)), NEW_ITEM_MS));
    });
    return () => {
      off();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);
  return fresh;
}

export function Inventory() {
  const t = useT();
  const inventory = useGame((s) => s.inventory);
  const held = useGame((s) => s.heldItem);
  const fresh = useFreshItems();

  const onSlot = (item: ItemId) => {
    if (held && held !== item) dispatch({ type: 'COMBINE', a: held, b: item });
    else dispatch({ type: 'HOLD_ITEM', item });
  };

  return (
    <section className={`inventory ${held ? 'is-holding' : ''}`} aria-label={t(UI.inventory)}>
      {held && (
        <div className="inventory-tray" role="status">
          <span className="inventory-tray-label">
            <IconHand size={16} /> {t(UI.holding)}: <strong>{t(ITEMS[held].name)}</strong>
          </span>
          <span className="inventory-tray-help">{t(UI.holdingHelp)}</span>
          <span className="inventory-tray-actions">
            <button type="button" className="chip" onClick={() => dispatch({ type: 'OPEN_ITEM', item: held })}>
              <IconEye size={16} /> {t(UI.inspect)}
            </button>
            <button type="button" className="chip" onClick={() => dispatch({ type: 'HOLD_ITEM', item: null })}>
              {t(UI.putAway)}
            </button>
          </span>
        </div>
      )}
      <ul className="inventory-slots">
        {inventory.map((item) => (
          <li key={item}>
            <button
              type="button"
              className={`slot ${held === item ? 'is-held' : ''} ${fresh.includes(item) ? 'is-new' : ''} ${
                held && held !== item ? 'is-combinable' : ''
              }`}
              onClick={() => onSlot(item)}
              onDoubleClick={() => dispatch({ type: 'OPEN_ITEM', item })}
              aria-pressed={held === item}
              data-item={item}
              aria-label={t(ITEMS[item].name)}
              title={t(ITEMS[item].name)}
            >
              <ItemArt item={item} className="slot-art" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
