import { currentHintStage } from '../../game/engine/reducer';
import { dispatch, useGame } from '../../game/store';
import { IconHint } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';
import { SidePanel } from './SidePanel';

export function HintPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const stage = useGame(currentHintStage);
  const tier = useGame((s) => (stage ? (s.hintTiers[stage.id] ?? 0) : 0));
  const hintCount = useGame((s) => s.hintCount);

  return (
    <SidePanel title={t(UI.hint)} icon={<IconHint />} onClose={onClose}>
      {!stage ? (
        <p className="hint-done">{t(UI.allDone)}</p>
      ) : (
        <>
          <p className="hint-objective">
            <span>{t(UI.objective)}</span>
            {t(stage.objective)}
          </p>
          <ol className="hint-list">
            {stage.tiers.map((text, i) => (
              <li key={i} className={i < tier ? 'is-revealed' : 'is-hidden'}>
                <span className="hint-tier" aria-hidden="true">
                  {['I', 'II', 'III'][i]}
                </span>
                <span className="hint-text">{i < tier ? t(text) : '· · ·'}</span>
              </li>
            ))}
          </ol>
          {tier < stage.tiers.length ? (
            <button type="button" className="text-button text-button--amber" onClick={() => dispatch({ type: 'REQUEST_HINT' })}>
              {tier === 0 ? t(UI.revealHint) : t(UI.revealNextHint)} ({tier + 1}/3)
            </button>
          ) : (
            <p className="hint-note">{t(UI.noMoreHints)}</p>
          )}
        </>
      )}
      <p className="hint-note">
        {t({ en: `${hintCount} hint${hintCount === 1 ? '' : 's'} used`, ko: `힌트 ${hintCount}회 사용` })} · {t(UI.hintCostNote)}
      </p>
    </SidePanel>
  );
}
