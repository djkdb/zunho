import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';

interface SidePanelProps {
  title: string;
  icon?: ReactNode;
  variant?: 'paper' | 'dark';
  onClose: () => void;
  children: ReactNode;
}

/** A sheet that slides in from the side of the screen — part of the room's darkness, not a web modal. */
export function SidePanel({ title, icon, variant = 'dark', onClose, children }: SidePanelProps) {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return (
    <aside ref={ref} className={`side-panel side-panel--${variant}`} role="dialog" aria-modal="false" aria-label={title} tabIndex={-1}>
      <header className="side-panel-head">
        {icon}
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t(UI.close)}>
          <IconClose />
        </button>
      </header>
      <div className="side-panel-body">{children}</div>
    </aside>
  );
}
