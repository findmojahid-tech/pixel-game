export type Place = 'street' | 'stall';
export type Tea = 'milk' | 'lemon';
export interface SaveData {
  version: 1;
  wallet: number;
  cups: number;
  place: Place;
  x: number;
  y: number;
  metSeller: boolean;
  muted: boolean;
  savedAt: number;
}
export const SAVE_KEY = 'pothe-pothe.save.v1';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export const TEAS = {
  milk: { name: 'দুধ চা', english: 'Milk tea', price: 15 },
  lemon: { name: 'লেবু চা', english: 'Lemon tea', price: 10 },
} as const;
export function freshSave(): SaveData {
  return {
    version: 1,
    wallet: 100,
    cups: 0,
    place: 'street',
    x: 650,
    y: 250,
    metSeller: false,
    muted: false,
    savedAt: 0,
  };
}
export function validSave(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const s = value as SaveData;
  return (
    s.version === 1 &&
    Number.isInteger(s.wallet) &&
    s.wallet >= 0 &&
    s.wallet <= 100000 &&
    Number.isInteger(s.cups) &&
    s.cups >= 0 &&
    s.cups <= 100000 &&
    (s.place === 'street' || s.place === 'stall') &&
    Number.isFinite(s.x) &&
    Number.isFinite(s.y) &&
    s.x >= (s.place === 'street' ? 14 : 172) &&
    s.x <= (s.place === 'street' ? 1786 : 467) &&
    s.y >= (s.place === 'street' ? 236 : 194) &&
    s.y <= (s.place === 'street' ? 343 : 309) &&
    typeof s.metSeller === 'boolean' &&
    typeof s.muted === 'boolean' &&
    Number.isFinite(s.savedAt)
  );
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function loadSave(storage: StorageLike): SaveData | null {
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const data: unknown = JSON.parse(raw);
        if (validSave(data)) return data;
      }
    } catch {
      /* Try last good snapshot. */
    }
  }
  return null;
}
export function persist(storage: StorageLike, data: SaveData): boolean {
  if (!validSave(data)) return false;
  try {
    const previous = storage.getItem(SAVE_KEY);
    if (previous) {
      try {
        if (validSave(JSON.parse(previous))) storage.setItem(BACKUP_KEY, previous);
      } catch {
        /* Invalid previous save must not overwrite backup. */
      }
    }
    storage.setItem(SAVE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
export function orderTea(state: SaveData, tea: Tea): { ok: boolean; state: SaveData } {
  const price = TEAS[tea].price;
  if (state.wallet < price) return { ok: false, state };
  return {
    ok: true,
    state: { ...state, wallet: state.wallet - price, cups: state.cups + 1, metSeller: true },
  };
}
export function direction(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}
