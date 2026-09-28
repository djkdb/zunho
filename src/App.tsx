import { useEffect, useState } from 'react';
import { audio } from './audio/AudioEngine';
import { clearSave, hasResumableSave, loadGame, saveGame } from './game/persistence';
import { useSettings } from './game/settings';
import { dispatch, gameStore, useGame } from './game/store';
import { GlobalDefs } from './ui/art/GlobalDefs';
import { GameScreen } from './ui/screens/GameScreen';
import { MainMenu } from './ui/screens/MainMenu';

type Screen = 'menu' | 'game';

const DEBUG_ENABLED =
  import.meta.env.DEV || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true');

// QA hook: lets automated tests and developers inspect the running game.
if (DEBUG_ENABLED && typeof window !== 'undefined') {
  (window as unknown as { __TLR: unknown }).__TLR = { store: gameStore, audio };
}

/** Audio must be unlocked by a user gesture (browser autoplay policy). */
function useAudioBridge() {
  const sound = useSettings((s) => s.sound);
  const volume = useSettings((s) => s.volume);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    const offEvents = gameStore.onEvent((event) => {
      if (event.type === 'sfx') audio.play(event.id);
    });
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      offEvents();
      audio.dispose();
    };
  }, []);

  useEffect(() => audio.setEnabled(sound), [sound]);
  useEffect(() => audio.setVolume(volume), [volume]);
}

let koreanFontsRequested = false;

/** Korean typefaces are large, so they are only fetched once Korean is selected. */
function loadKoreanFonts(): void {
  if (koreanFontsRequested) return;
  koreanFontsRequested = true;
  void Promise.all([
    import('@fontsource/noto-serif-kr/500.css'),
    import('@fontsource/noto-serif-kr/700.css'),
    import('@fontsource/nanum-pen-script/400.css'),
  ]).catch(() => {
    // System fonts are an acceptable fallback.
  });
}

function useLangAttribute() {
  const lang = useSettings((s) => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'ko') loadKoreanFonts();
  }, [lang]);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [canContinue, setCanContinue] = useState(hasResumableSave);
  const phase = useGame((s) => s.phase);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  useAudioBridge();
  useLangAttribute();

  // Ambience runs everywhere except over the ending (the escape cinematic fades it out itself).
  useEffect(() => {
    if (screen === 'game' && (phase === 'escape' || phase === 'ending')) return;
    audio.startAmbience();
  }, [screen, phase]);

  const startNewGame = () => {
    clearSave();
    dispatch({ type: 'NEW_GAME' });
    setScreen('game');
  };

  const continueGame = () => {
    const saved = loadGame();
    if (!saved) {
      setCanContinue(false);
      return;
    }
    dispatch({ type: 'LOAD', state: saved });
    setScreen('game');
  };

  const exitToTitle = () => {
    saveGame(gameStore.getState());
    setScreen('menu');
    setCanContinue(hasResumableSave());
  };

  return (
    <div className={`app ${reducedMotion ? 'reduce-motion' : ''}`}>
      <GlobalDefs />
      {screen === 'menu' ? (
        <MainMenu canContinue={canContinue} onStart={startNewGame} onContinue={continueGame} />
      ) : (
        <GameScreen
          debugEnabled={DEBUG_ENABLED}
          onExitToTitle={exitToTitle}
          onPlayAgain={startNewGame}
          onNewGame={() => {
            clearSave();
            dispatch({ type: 'NEW_GAME' });
            exitToTitle();
          }}
        />
      )}
    </div>
  );
}
