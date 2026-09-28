import { dispatch, useGame } from '../../game/store';
import type { TargetId } from '../../game/types';

/** Tapping a sub-target inside a scene: use the held item if any, otherwise describe it. */
export function useTargetTap(target: TargetId, describe: () => void): () => void {
  const held = useGame((s) => s.heldItem);
  return () => {
    if (held) dispatch({ type: 'USE_ITEM', item: held, target });
    else describe();
  };
}
