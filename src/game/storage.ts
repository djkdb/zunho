/**
 * localStorage wrapper that never throws.
 * Falls back to an in-memory map when storage is unavailable
 * (private mode, disabled cookies, quota exceeded, sandboxed iframes…).
 */
const memory = new Map<string, string>();
let storageUsable: boolean | null = null;

function isUsable(): boolean {
  if (storageUsable !== null) return storageUsable;
  try {
    const probe = '__tlr_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    storageUsable = true;
  } catch {
    storageUsable = false;
  }
  return storageUsable;
}

export const safeStorage = {
  get available(): boolean {
    return isUsable();
  },
  get(key: string): string | null {
    if (isUsable()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        /* fall through to memory */
      }
    }
    return memory.get(key) ?? null;
  },
  set(key: string, value: string): void {
    memory.set(key, value);
    if (!isUsable()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota or permission problem: memory copy keeps the session alive */
    }
  },
  remove(key: string): void {
    memory.delete(key);
    if (!isUsable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  readJson<T>(key: string): T | null {
    const raw = this.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  writeJson(key: string, value: unknown): void {
    try {
      this.set(key, JSON.stringify(value));
    } catch {
      /* unserialisable value — ignore */
    }
  },
};
