interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

export class ClientCache<T> {
  private entries = new Map<string, CacheEntry<T>>();

  get(key: string): CacheEntry<T> | undefined {
    return this.entries.get(key);
  }

  set(key: string, data: T): void {
    this.entries.set(key, { data, fetchedAt: Date.now() });
  }

  isFresh(key: string, maxAgeMs: number): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    return Date.now() - entry.fetchedAt < maxAgeMs;
  }

  invalidate(key?: string): void {
    if (key) {
      this.entries.delete(key);
      return;
    }
    this.entries.clear();
  }

  invalidateMatching(predicate: (key: string) => boolean): void {
    for (const key of this.entries.keys()) {
      if (predicate(key)) {
        this.entries.delete(key);
      }
    }
  }
}

export const TASKS_STALE_MS = 60_000;
export const GOOGLE_STATUS_STALE_MS = 2 * 60_000;
export const GOOGLE_EVENTS_STALE_MS = 5 * 60_000;
