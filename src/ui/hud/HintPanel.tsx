import { currentHintStage } from '../../game/engine/reducer';
import { dispatch, useGame } from '../../game/store';
import { IconHint } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';
import { SidePanel } from './SidePanel';

/** Seconds of play before the next, more direct tier unlocks — a moment to use the previous one. */
const NEXT_TIER_DELAY_MS = 20_000;
const revealedAt: Record<string, number> = {};

export function HintPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const stage = useGame(currentHintStage);
  const tier = useGame((s) => (stage ? (s.hintTiers[stage.id] ?? 0) : 0));
  const hintCount = useGame((s) => s.hintCount);
  const playTime = useGame((s) => s.playTimeMs);
  const since = stage && revealedAt[stage.id] !== undefined ? playTime - revealedAt[stage.id]! : Infinity;
  const waitSeconds = tier > 0 ? Math.max(0, Math.ceil((NEXT_TIER_DELAY_MS - since) / 1000)) : 0;

  const reveal = () => {
    if (!stage || waitSeconds > 0) return;
    revealedAt[stage.id] = playTime;
    dispatch({ type: 'REQUEST_HINT' });
  };

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
            <button type="button" className="text-button text-button--amber" onClick={reveal} disabled={waitSeconds > 0}>
              {waitSeconds > 0
                ? t({ en: `Think it over… next hint in ${waitSeconds}s`, ko: `조금 더 생각해 보자… ${waitSeconds}초 후 다음 힌트` })
                : `${tier === 0 ? t(UI.revealHint) : t(UI.revealNextHint)} (${tier + 1}/3)`}
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
