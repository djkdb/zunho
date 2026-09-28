import { CLUES } from '../../game/data/clues';
import { useGame } from '../../game/store';
import { IconNotebook } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';
import { SidePanel } from './SidePanel';

/** Everything the player has learned, in the order they learned it. */
export function Notebook({ onClose }: { onClose: () => void }) {
  const t = useT();
  const clues = useGame((s) => s.clues);
  return (
    <SidePanel title={t(UI.notebook)} icon={<IconNotebook />} variant="paper" onClose={onClose}>
      {clues.length === 0 ? (
        <p className="notebook-empty">{t(UI.notebookEmpty)}</p>
      ) : (
        <ul className="notebook-list">
          {clues.map((id, i) => (
            <li key={id} className={CLUES[id].flavour ? 'is-flavour' : ''}>
              <span className="notebook-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {t(CLUES[id].text)}
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}
