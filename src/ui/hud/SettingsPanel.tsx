import { useState } from 'react';
import { clearAchievements } from '../../game/achievements';
import { clearSave } from '../../game/persistence';
import { settingsStore, useSettings } from '../../game/settings';
import { safeStorage } from '../../game/storage';
import { dispatch } from '../../game/store';
import type { Lang } from '../../game/types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { IconGear } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';
import { SidePanel } from './SidePanel';

type Pending = 'newGame' | 'eraseAll' | null;

export function SettingsPanel({ onClose, onExitToTitle }: { onClose: () => void; onExitToTitle: () => void }) {
  const t = useT();
  const settings = useSettings((s) => s);
  const [pending, setPending] = useState<Pending>(null);

  return (
    <SidePanel title={t(UI.settings)} icon={<IconGear />} onClose={onClose}>
      <div className="settings">
        <label className="setting-row">
          <span>{t(UI.sound)}</span>
          <button
            type="button"
            className={`toggle ${settings.sound ? 'is-on' : ''}`}
            role="switch"
            aria-checked={settings.sound}
            onClick={() => settingsStore.update({ sound: !settings.sound })}
          >
            <span>{settings.sound ? t(UI.on) : t(UI.off)}</span>
          </button>
        </label>
        <label className="setting-row">
          <span>{t(UI.volume)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => settingsStore.update({ volume: Number(e.target.value) })}
            aria-label={t(UI.volume)}
          />
        </label>
        <div className="setting-row">
          <span>{t(UI.language)}</span>
          <div className="segmented" role="radiogroup" aria-label={t(UI.language)}>
            {(['en', 'ko'] as Lang[]).map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={settings.lang === lang}
                className={settings.lang === lang ? 'is-on' : ''}
                onClick={() => settingsStore.update({ lang })}
              >
                {lang === 'en' ? 'English' : '한국어'}
              </button>
            ))}
          </div>
        </div>
        <label className="setting-row">
          <span>{t(UI.reduceMotion)}</span>
          <button
            type="button"
            className={`toggle ${settings.reducedMotion ? 'is-on' : ''}`}
            role="switch"
            aria-checked={settings.reducedMotion}
            onClick={() => settingsStore.update({ reducedMotion: !settings.reducedMotion })}
          >
            <span>{settings.reducedMotion ? t(UI.on) : t(UI.off)}</span>
          </button>
        </label>

        {!safeStorage.available && <p className="settings-warning">{t(UI.storageWarning)}</p>}

        <div className="settings-actions">
          <button type="button" className="text-button" onClick={onExitToTitle}>
            {t(UI.backToTitle)}
          </button>
          <button type="button" className="text-button text-button--amber" onClick={() => setPending('newGame')}>
            {t(UI.newGame)}
          </button>
          <button type="button" className="text-button text-button--danger" onClick={() => setPending('eraseAll')}>
            {t(UI.eraseAll)}
          </button>
        </div>
      </div>

      {pending === 'newGame' && (
        <ConfirmDialog
          title={t(UI.startOverTitle)}
          body={t(UI.startOverBody)}
          confirmLabel={t(UI.newGame)}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null);
            clearSave();
            dispatch({ type: 'NEW_GAME' });
            onClose();
          }}
        />
      )}
      {pending === 'eraseAll' && (
        <ConfirmDialog
          title={t(UI.eraseTitle)}
          body={t(UI.eraseBody)}
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => {
            setPending(null);
            clearSave();
            clearAchievements();
            dispatch({ type: 'NEW_GAME' });
            onExitToTitle();
          }}
        />
      )}
    </SidePanel>
  );
}
