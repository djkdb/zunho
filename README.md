# THE LAST ROOM

*A ROOM WITH NO WAY OUT.*

A cinematic, single-player escape-room mystery that runs in the browser. You wake up in a locked study. Every object is a sentence someone left for you. Read them in order, solve the chain of six puzzles and open the door. If you pay close attention, there is a second ending.

- **Play time:** 10–20 minutes · **Difficulty:** Normal · **Languages:** English / 한국어
- Desktop, tablet and phone (portrait works, including 9:16 screen recording)
- All art is hand-authored SVG/CSS and all sound is synthesised live with the Web Audio API, so there are no external image or audio files and no licensing questions.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (debug tools enabled) |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint (typescript-eslint + react-hooks) |
| `npm run typecheck` | TypeScript strict type-check |
| `npm test` | Unit tests for the game engine (Vitest) |
| `npm run e2e` | End-to-end playthroughs in headless Chromium (run `npm run build` first); screenshots go to `qa-artifacts/` |
| `npm run playtest` | First-time player simulation (Korean, phone, touch): pans to find things, makes common mistakes, uses a hint, and screenshots every step to `qa-artifacts/playtest/` |

`dist/` is fully static (relative `base`), so any static host works.

## How to play

- **Look around.** Objects worth examining brighten when you hover them, and unexamined ones glint now and then. On narrow screens, drag or use the ‹ › edges to look around.
- **Tap an object** to see it up close. Some things can be picked up.
- **Use items:** tap an inventory item to hold it, then tap an object. While holding one item, tap another item to **combine** them.
- **Notebook:** every clue you have found is written down automatically.
- **Hints:** three tiers per step (direction → what to observe → nearly the answer). Hints you use are counted on the results screen.
- **Forgiving by design:** tap a pulled book again to push it back (brass sockets under the shelf show your order); an item that doesn't fit is put away automatically; an inspected torn note offers to fit its other half; documents pulse their next-page arrow until every page is read.
- **Keyboard shortcuts in close-ups:** type digits on the safe and on the door dial, Enter to confirm.
- **Keyboard:** Tab / Enter to interact, Esc to go back, ←/→ to look around, digits and Enter on the safe keypad.
- Progress **saves automatically**. `CONTINUE` resumes it and `NEW GAME` erases it.

## Puzzle chain

Every puzzle depends on an earlier result. The difficulty rises from observing, to combining clues, to reasoning across all of them.

| # | Type | Puzzle | Depends on | Reward |
|---|------|--------|-----------|--------|
| 1 | Observation | **When Both Clocks Agree.** The painting's plaque and the tiny tower clock hidden in the painting | Painting | Brass key (clock case) |
| 2 | Combination | **Two Halves.** Memo on the desk + note in the drawer | Brass key → drawer | Mended note (the rule) |
| 3 | Sequence | **Four Friends.** Pull the four emblem books in the photograph's order | Mended note + photograph | Hidden compartment → journal |
| 4 | Discovery | **Lemon Ink.** The blank last page, held to the lit lamp | Journal + lamp | Safe instruction |
| 5 | Numeric | **What the Books Kept.** The volume numbers of the four friends, in order | Puzzles 3 + 4 | Iron key + letter |
| 6 | Final | **The Hour I Left.** Iron key, then the time the wall clock had stopped at | Letter + clock + safe | The door |

Wrong answers never break the game. You get a shake, an error sound and a short hint-like line (for example *"The right friends — in the wrong order."* or *"That is the hour he came home."*), and you can retry right away.

<details>
<summary><strong>Full solution (spoilers)</strong></summary>

1. Turn on the lamp (optional at first, needed later). Take the memo from the desk.
2. Examine the painting and tap the tower: it reads **9:45**. Set the wall clock to **9:45** and take the brass key from the pendulum case.
3. Hold the brass key and tap the drawer. Take the photograph and the torn right half.
4. Combine the two note halves: *pull the four friends in the order the photograph remembers.*
5. The photograph shows, left to right, **feather → hourglass → candle → moon**. Pull those books in that order and take the journal.
6. Hold the journal and tap the **lit** lamp. The lemon ink reads: *SAFE: the four friends, in order, by volume.*
7. Volumes: feather VII, hourglass III, candle IX, moon II → safe code **7392**. Take the iron key and the letter.
8. Hold the iron key and tap the door. The letter asks for *the hour I left, not the hour I came home*. The wall clock had stopped at **11:52**. Enter **11:52**.

**Secret ending: "YOU REMEMBERED."** Before opening the door: read the letter to its last page (the P.S.), hold the photograph to the lit lamp, then *give the house back its hour* by setting the wall clock back to **11:52**. The order matters. Setting the clock first does nothing.

</details>

### Achievements

FIRST ESCAPE · NO HINT · FAST ESCAPE (under 10 minutes) · PERFECT OBSERVER (examine all 10 points of interest) · TRUE ENDING (secret). Achievements are stored separately from saves.

## Architecture

```
src/
  game/                 ← pure TypeScript, no React
    types.ts            ← ids, state, actions, events
    data/               ← content: objects, items, puzzles, clues, hints, docs, books, endings, layout
    engine/
      reducer.ts        ← (state, action) → { state, events }  — the whole rulebook
      conditions.ts     ← tiny condition DSL (has / flag / solved / any / all …)
      initialState.ts
      reducer.test.ts   ← full playthroughs, wrong inputs, secret ending, corrupted saves
    store.ts            ← external store + event bus (useSyncExternalStore, selector subscriptions)
    persistence.ts      ← versioned save, validation/repair of corrupted data
    storage.ts          ← localStorage wrapper with in-memory fallback
    achievements.ts, settings.ts, i18n.ts
  audio/AudioEngine.ts  ← Web Audio synthesis: 20+ SFX, ambience, ending pad
  ui/
    room/               ← camera (pan/zoom), hotspots
    art/                ← SVG art: room, items, photograph, emblems
    investigate/        ← close-up scenes (clock, painting, bookshelf, drawer, safe, door, …) + item inspector
    hud/                ← timer, inventory, hints, notebook, settings, narration
    cinematics/         ← intro (Scene A) and door escape (Scenes E/F)
    screens/            ← title, game, ending
    fx/                 ← flash, camera shake, canvas particles
    debug/              ← debug panel (lazy-loaded)
  styles/               ← design tokens + per-area CSS
```

**Design principles**

- **Data-driven rules.** Objects, pickups, item-on-object interactions, combinations, puzzles, documents, hint stages and endings are declared as data with `requires` conditions and `effects`. The reducer interprets them generically. To add a puzzle: add a `PuzzleDef` (an evaluator plus `onSolve` effects), an interaction or pickup if needed, and a `HintStage`. No UI rules need to change.
- **UI never decides game outcomes.** Components dispatch actions. The reducer returns new state plus events (`sfx`, `fx`, `narrate`, `puzzleSolved` …) that the audio engine, FX layer and narration consume. Cinematics such as the safe opening are timed in the UI after the engine reports the result.
- **Performance.** Selector subscriptions mean the one-second timer tick re-renders only the timer. The room SVG is memoised and changes only when its visual inputs do. The camera moves by CSS transforms, and particles run on a canvas with `requestAnimationFrame`, outside React. Every timer, listener and audio node is cleaned up.
- **Resilience.** Saves are versioned and sanitised field by field, so corrupted or old data is repaired or ignored, never crashes. If storage is unavailable the game falls back to memory and shows a notice. If audio is unavailable the game is silent but fully playable. A failing action is logged and skipped instead of taking the game down.

## Debug mode

Available in `npm run dev`, or in any build with **`?debug=true`**. Toggle the panel with **Shift + D**.

Includes: skip intro, solve all (up to the door), solve individual puzzles, give all items, prepare the secret ending, force either ending, set play time, a sound test for every effect, showing interaction zones, a live game-state view, and resetting state and achievements. It also exposes `window.__TLR` (`store`, `audio`) for inspection.

## Accessibility

Every interactive object is a real, focusable button with a label. Focus moves into close-ups. Esc goes back. Narration is announced through a polite live region. Status is conveyed by an icon as well as colour. Sound is optional, since every sound has a visual counterpart. There is a reduced-motion setting, which also follows the OS preference. Story and body text are 16px or larger; the smaller letter-spaced labels only repeat information shown elsewhere.

## Recording tips (Reels / Shorts, 9:16)

The portrait layout keeps the HUD on the edges and centres every close-up. The strongest moments to capture are the title reveal, the lemon-ink reveal on the journal, the safe keypad and unlock, the door dial, and the door opening into light. `?debug=true` lets you jump straight to any of them.

## Known limitations

- The whole game is one room by design. There is no cloud save; progress lives in this browser's localStorage.
- iOS Safari only starts audio after the first tap, as the platform requires.
