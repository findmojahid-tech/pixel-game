import { roomBounds, type Place, type ZoneId, ZONES } from './district';
export type { Place } from './district';
export type Tea = 'milk' | 'lemon';
export interface SaveData {
  version: 2;
  wallet: number;
  cups: number;
  place: Place;
  x: number;
  y: number;
  metSeller: boolean;
  muted: boolean;
  savedAt: number;
  visited: ZoneId[];
  bookmark: boolean;
}
// Retain the storage key so the previous milestone migrates in place.
export const SAVE_KEY = 'pothe-pothe.save.v1';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export const TEAS = {
  milk: { name: 'দুধ চা', english: 'Milk tea', price: 15 },
  lemon: { name: 'লেবু চা', english: 'Lemon tea', price: 10 },
} as const;
export function freshSave(): SaveData {
  return {
    version: 2,
    wallet: 100,
    cups: 0,
    place: 'district',
    x: 480,
    y: 390,
    metSeller: false,
    muted: false,
    savedAt: 0,
    visited: ['courtyard'],
    bookmark: false,
  };
}
export function validSave(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const s = value as SaveData;
  const b = roomBounds[s.place];
  return (
    s.version === 2 &&
    !!b &&
    Number.isInteger(s.wallet) &&
    s.wallet >= 0 &&
    s.wallet <= 100000 &&
    Number.isInteger(s.cups) &&
    s.cups >= 0 &&
    s.cups <= 100000 &&
    Number.isFinite(s.x) &&
    Number.isFinite(s.y) &&
    s.x >= b.x &&
    s.x <= b.x + b.w &&
    s.y >= b.y &&
    s.y <= b.y + b.h &&
    typeof s.metSeller === 'boolean' &&
    typeof s.muted === 'boolean' &&
    Number.isFinite(s.savedAt) &&
    typeof s.bookmark === 'boolean' &&
    Array.isArray(s.visited) &&
    new Set(s.visited).size === s.visited.length &&
    s.visited.every((id) => ZONES.some((z) => z.id === id))
  );
}
export function migrateSave(value: unknown): SaveData | null {
  if (validSave(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const s = value as Record<string, unknown>;
  if (
    s.version !== 1 ||
    !['street', 'stall'].includes(String(s.place)) ||
    typeof s.metSeller !== 'boolean' ||
    typeof s.muted !== 'boolean' ||
    !Number.isFinite(s.savedAt) ||
    !Number.isFinite(s.x) ||
    !Number.isFinite(s.y)
  )
    return null;
  const migrated = {
    ...freshSave(),
    wallet: s.wallet,
    cups: s.cups,
    metSeller: s.metSeller,
    muted: s.muted,
    savedAt: s.savedAt,
  };
  return validSave(migrated) ? migrated : null;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function loadSave(storage: StorageLike): SaveData | null {
  for (const key of [SAVE_KEY, BACKUP_KEY])
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const result = migrateSave(JSON.parse(raw));
        if (result) return result;
      }
    } catch {
      /* Try last good snapshot. */
    }
  return null;
}
export function persist(storage: StorageLike, data: SaveData): boolean {
  if (!validSave(data)) return false;
  try {
    const previous = storage.getItem(SAVE_KEY);
    if (previous)
      try {
        if (migrateSave(JSON.parse(previous))) storage.setItem(BACKUP_KEY, previous);
      } catch {
        /* Preserve valid backup. */
      }
    storage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
export function orderTea(state: SaveData, tea: Tea): { ok: boolean; state: SaveData } {
  if (state.wallet < TEAS[tea].price) return { ok: false, state };
  return {
    ok: true,
    state: {
      ...state,
      wallet: state.wallet - TEAS[tea].price,
      cups: state.cups + 1,
      metSeller: true,
    },
  };
}
export function direction(x: number, y: number): { x: number; y: number } {
  const l = Math.hypot(x, y);
  return l > 1 ? { x: x / l, y: y / l } : { x, y };
}
