import {
  freshSave,
  loadSave,
  orderTea,
  persist,
  type SaveData,
  type StorageLike,
  type Tea,
} from '../state';
export const SIDE_KEY = 'pothe-pothe.sideview.v1';
export const SIDE_BACKUP = SIDE_KEY + '.backup';
export const STREET_WIDTH = 1920;
export type SidePlace = 'street' | 'tea';
export interface SidePosition {
  version: 1;
  place: SidePlace;
  x: number;
  visited: string[];
  savedAt: number;
}
export function freshPosition(): SidePosition {
  return { version: 1, place: 'street', x: 420, visited: ['lalbagh'], savedAt: 0 };
}
export function validPosition(v: unknown): v is SidePosition {
  if (!v || typeof v !== 'object') return false;
  const s = v as SidePosition;
  return (
    s.version === 1 &&
    (s.place === 'street' || s.place === 'tea') &&
    Number.isFinite(s.x) &&
    s.x >= 24 &&
    s.x <= (s.place === 'street' ? STREET_WIDTH - 24 : 616) &&
    Array.isArray(s.visited) &&
    new Set(s.visited).size === s.visited.length &&
    s.visited.every((x) => ['lalbagh', 'river', 'tea'].includes(x)) &&
    Number.isFinite(s.savedAt)
  );
}
export class SideSession {
  economy: SaveData;
  position: SidePosition;
  constructor(private storage: StorageLike | null) {
    this.economy = storage ? (loadSave(storage) ?? freshSave()) : freshSave();
    this.position = this.load();
  }
  private load() {
    if (this.storage)
      for (const key of [SIDE_KEY, SIDE_BACKUP])
        try {
          const raw = this.storage.getItem(key);
          if (raw) {
            const s: unknown = JSON.parse(raw);
            if (validPosition(s)) return s;
          }
        } catch {
          /* Try previous position. */
        }
    return freshPosition();
  }
  save() {
    if (!this.storage || !validPosition(this.position)) return false;
    const common = persist(this.storage, this.economy);
    try {
      const old = this.storage.getItem(SIDE_KEY);
      if (old)
        try {
          if (validPosition(JSON.parse(old))) this.storage.setItem(SIDE_BACKUP, old);
        } catch {
          /* Preserve last good side save. */
        }
      this.storage.setItem(SIDE_KEY, JSON.stringify({ ...this.position, savedAt: Date.now() }));
      return common;
    } catch {
      return false;
    }
  }
  order(tea: Tea) {
    const result = orderTea(this.economy, tea);
    if (result.ok) this.economy = result.state;
    return result.ok;
  }
  discover(id: string) {
    if (!this.position.visited.includes(id)) {
      this.position.visited.push(id);
      return true;
    }
    return false;
  }
}
