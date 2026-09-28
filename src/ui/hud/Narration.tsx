import { useEffect, useState } from 'react';
import { gameStore } from '../../game/store';
import type { LocalizedText, NarrationTone } from '../../game/types';
import { IconCheck, IconSpark, IconWarn } from '../common/icons';
import { useT } from '../hooks';

interface Line {
  id: number;
  text: LocalizedText;
  tone: NarrationTone;
}

const MAX_LINES = 2;
const BASE_MS = 2600;
const PER_CHAR_MS = 38;

let nextId = 1;

/**
 * Subtitle-style narration. Tone is carried by an icon as well as colour,
 * so it never depends on colour perception alone.
 */
export function Narration() {
  const t = useT();
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const timers = new Map<number, number>();
    const off = gameStore.onEvent((event) => {
      if (event.type !== 'narrate') return;
      const line: Line = { id: nextId++, text: event.text, tone: event.tone };
      setLines((current) => {
        let kept = current.filter((l) => {
          // Collapse exact repeats (e.g. hammering a locked drawer).
          if (l.text.en === line.text.en) return false;
          // Progress makes earlier complaints obsolete.
          if ((line.tone === 'success' || line.tone === 'discovery') && l.tone === 'error') return false;
          // A new complaint replaces the old one rather than piling up.
          if (line.tone === 'error' && l.tone === 'error') return false;
          return true;
        });
        // Close-ups have little room: show only the newest line there.
        const phase = gameStore.getState().phase;
        const max = phase === 'investigation' || phase === 'puzzle' ? 1 : MAX_LINES;
        kept = [...kept, line].slice(-max);
        return kept;
      });
      const duration = BASE_MS + event.text.en.length * PER_CHAR_MS;
      timers.set(
        line.id,
        window.setTimeout(() => {
          timers.delete(line.id);
          setLines((current) => current.filter((l) => l.id !== line.id));
        }, duration),
      );
    });
    return () => {
      off();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div className="narration" role="status" aria-live="polite">
      {lines.map((line) => (
        <p key={line.id} className={`narration-line narration-line--${line.tone}`}>
          {line.tone === 'error' && <IconWarn size={16} />}
          {line.tone === 'success' && <IconCheck size={16} />}
          {line.tone === 'discovery' && <IconSpark size={16} />}
          <span>{t(line.text)}</span>
        </p>
      ))}
    </div>
  );
}
