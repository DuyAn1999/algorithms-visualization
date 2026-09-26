// Keep this session usable when browser storage is denied or full.
const sessionValues = new Map<string, string>();
let storageAvailable = true;
export const storageStatusEvent = "algolab-storage-status";

function reportAvailability(available: boolean) {
  if (storageAvailable === available) return;
  storageAvailable = available;
  window.dispatchEvent(new Event(storageStatusEvent));
}

export function canSaveProgress() { return storageAvailable; }

export function readLocalValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  // A failed write remains authoritative for the lifetime of this session.
  if (sessionValues.has(key)) return sessionValues.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    reportAvailability(false);
    return null;
  }
}

export function writeLocalValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
    sessionValues.delete(key);
  } catch {
    sessionValues.set(key, value);
    reportAvailability(false);
  }
}

export function parseCompletedLessons<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is T => typeof id === "string" && allowed.includes(id as T)))];
  } catch {
    return [];
  }
}
