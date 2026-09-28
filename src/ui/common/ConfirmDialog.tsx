import { useEffect, useRef } from 'react';
import { useT } from '../hooks';
import { UI } from '../strings';

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-game confirmation, never the browser's native confirm(). */
export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useT();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  return (
    <div className="confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-body">{body}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} type="button" className="text-button" onClick={onCancel}>
            {t(UI.cancel)}
          </button>
          <button type="button" className={`text-button ${danger ? 'text-button--danger' : 'text-button--amber'}`} onClick={onConfirm}>
            {confirmLabel ?? t(UI.confirm)}
          </button>
        </div>
      </div>
    </div>
  );
}
