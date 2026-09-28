import { OBJECTS } from '../../../game/data/objects';
import { dispatch, playSfx, say, useGame } from '../../../game/store';
import { useT } from '../../hooks';
import { UI } from '../../strings';
import { PickupButton, SceneFrame, UseItemChip } from '../SceneFrame';
import { useTargetTap } from '../useTargetTap';

export function DrawerScene() {
  const t = useT();
  const open = useGame((s) => s.flags.drawerOpen);
  const photoTaken = useGame((s) => s.takenPickups.includes('drawer_photo'));
  const noteTaken = useGame((s) => s.takenPickups.includes('drawer_note'));
  const holding = useGame((s) => s.heldItem);

  const tapKeyhole = useTargetTap('drawer_keyhole', () => {
    playSfx('locked');
    say(UI.drawerLocked, 'error');
  });

  return (
    <SceneFrame
      id="drawer"
      title={t(OBJECTS.drawer.name)}
      caption={
        <p>
          {open
            ? photoTaken && noteTaken
              ? t(UI.empty)
              : t({ en: 'Inside: a photograph and a torn scrap of paper.', ko: '안에는 사진 한 장과 찢어진 종이 조각이 있다.' })
            : t(UI.drawerLocked)}
        </p>
      }
      actions={<UseItemChip item="brass_key" target="drawer_keyhole" visible={!open && !holding} />}
    >
      <div className={`drawer ${open ? 'is-open' : ''}`}>
        <div className="drawer-inside" aria-hidden={!open}>
          {open && !photoTaken && (
            <PickupButton
              item="photograph"
              className="drawer-item drawer-item--photo"
              onTake={() => dispatch({ type: 'TAKE', pickup: 'drawer_photo' })}
            />
          )}
          {open && !noteTaken && (
            <PickupButton
              item="note_right"
              className="drawer-item drawer-item--note"
              onTake={() => dispatch({ type: 'TAKE', pickup: 'drawer_note' })}
            />
          )}
        </div>
        <div className="drawer-front">
          <span className="drawer-grain" aria-hidden="true" />
          {!open && (
            <button
              type="button"
              className={`keyhole keyhole--brass ${holding ? 'is-target' : ''}`}
              onClick={tapKeyhole}
              aria-label={t(UI.keyhole)}
            >
              <span aria-hidden="true" />
            </button>
          )}
          {open && <span className="drawer-knob" aria-hidden="true" />}
        </div>
      </div>
    </SceneFrame>
  );
}
