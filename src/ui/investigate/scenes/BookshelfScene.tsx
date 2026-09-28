import { useEffect, useState } from 'react';
import { BOOK_BY_ID, BOOKS, FRIEND_ORDER, romanVolume } from '../../../game/data/books';
import { OBJECTS } from '../../../game/data/objects';
import { dispatch, gameStore, useGame } from '../../../game/store';
import type { BookId } from '../../../game/types';
import { BookSymbol } from '../../art/Symbols';
import { useT } from '../../hooks';
import { PickupButton, SceneFrame } from '../SceneFrame';

const SHELVES = [0, 1, 2] as const;
const RESET_ANIMATION_MS = 650;

export function BookshelfScene() {
  const t = useT();
  const pulls = useGame((s) => s.bookPulls);
  const solved = useGame((s) => s.solvedPuzzles.includes('bookshelf'));
  const journalTaken = useGame((s) => s.takenPickups.includes('shelf_journal'));
  // After a wrong sequence the engine clears the pulls; the books slide back and the shelf shudders.
  const [resetting, setResetting] = useState(false);
  const [focused, setFocused] = useState<BookId | null>(null);

  useEffect(() => {
    let timer = 0;
    const off = gameStore.onEvent((event) => {
      if (event.type === 'puzzleFailed' && event.puzzle === 'bookshelf') {
        setResetting(true);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setResetting(false), RESET_ANIMATION_MS);
      }
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <SceneFrame
      id="bookshelf"
      title={t(OBJECTS.bookshelf.name)}
      caption={
        <p>
          {focused
            ? `${t(BOOK_BY_ID[focused].title)} · ${t({ en: 'Vol.', ko: '제' })} ${romanVolume(BOOK_BY_ID[focused].volume)}${t({ en: '', ko: '권' })}`
            : solved
            ? t({ en: 'Behind the four friends, a hidden compartment stands open.', ko: '네 친구 뒤로 숨겨진 칸이 열려 있다.' })
            : t({
                en: 'Some spines bear a small emblem and a volume number. Tap a book to pull it out — tap again to push it back.',
                ko: '책등에 작은 문양과 권수가 새겨져 있다. 책을 누르면 꺼내고, 다시 누르면 제자리에 넣는다.',
              })}
        </p>
      }
    >
      <div className={`shelf ${solved ? 'is-solved' : ''} ${resetting ? 'is-resetting' : ''}`}>
        {SHELVES.map((shelf) => (
          <div key={shelf} className="shelf-row">
            {BOOKS.filter((b) => b.shelf === shelf).map((book) => {
              const pulled = pulls.includes(book.id);
              return (
                <button
                  key={book.id}
                  type="button"
                  className={`book ${pulled ? 'is-pulled' : ''}`}
                  style={
                    {
                      '--book-color': book.color,
                      '--book-height': `${Math.round(book.height * 100)}%`,
                    } as React.CSSProperties
                  }
                  onClick={() => dispatch({ type: 'PULL_BOOK', book: book.id })}
                  onPointerEnter={() => setFocused(book.id)}
                  onPointerLeave={() => setFocused((f) => (f === book.id ? null : f))}
                  onFocus={() => setFocused(book.id)}
                  onBlur={() => setFocused((f) => (f === book.id ? null : f))}
                  disabled={solved}
                  aria-pressed={pulled}
                  aria-label={`${t(book.title)} — ${romanVolume(book.volume)}`}
                >
                  <span className="book-band" aria-hidden="true" />
                  <span className="book-symbol">
                    <BookSymbol id={book.id} size={26} color="#e3c889" />
                  </span>
                  <span className="book-title">{t(book.spine)}</span>
                  <span className="book-volume">{romanVolume(book.volume)}</span>
                  <span className="book-band book-band--low" aria-hidden="true" />
                </button>
              );
            })}
            {shelf === 1 && (
              <div className={`shelf-compartment ${solved ? 'is-open' : ''}`} aria-hidden={!solved}>
                {solved && !journalTaken && (
                  <PickupButton item="journal" onTake={() => dispatch({ type: 'TAKE', pickup: 'shelf_journal' })} />
                )}
              </div>
            )}
          </div>
        ))}
        {/* Four brass sockets under the shelf record the pulling order, so a slip is easy to spot and undo. */}
        <div className="shelf-sockets" aria-live="polite" aria-label={t({ en: 'Pulled books', ko: '꺼낸 책' })}>
          {Array.from({ length: 4 }, (_, i) => {
            const book = solved ? FRIEND_ORDER[i] : pulls[i];
            return (
              <span key={i} className={`shelf-socket ${book ? 'is-filled' : ''}`}>
                {book ? <BookSymbol id={book} size={18} color="#2a1a09" /> : <i aria-hidden="true">{i + 1}</i>}
              </span>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
}
