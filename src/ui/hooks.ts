import { useCallback, useEffect, useRef, useState } from 'react';
import { tr } from '../game/i18n';
import { useSettings } from '../game/settings';
import type { LocalizedText } from '../game/types';

/** Returns a translator bound to the current language. */
export function useT(): (text: LocalizedText) => string {
  const lang = useSettings((s) => s.lang);
  return useCallback((text: LocalizedText) => tr(text, lang), [lang]);
}

export function useReducedMotion(): boolean {
  return useSettings((s) => s.reducedMotion);
}

/** setTimeout that is cleared automatically on unmount. */
export function useTimeouts(): (fn: () => void, ms: number) => void {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      for (const id of list) window.clearTimeout(id);
      list.length = 0;
    };
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);
}

export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSize({ width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);
  return size;
}

/** Calls `onRepeat` immediately and then repeatedly while the pointer is held down. */
export function useHoldRepeat(onRepeat: () => void) {
  const timer = useRef<number | null>(null);
  const callback = useRef(onRepeat);
  useEffect(() => {
    callback.current = onRepeat;
  }, [onRepeat]);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    callback.current();
    let delay = 380;
    const loop = () => {
      callback.current();
      delay = Math.max(60, delay * 0.7);
      timer.current = window.setTimeout(loop, delay);
    };
    timer.current = window.setTimeout(loop, delay);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback.current();
      }
    },
  };
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
