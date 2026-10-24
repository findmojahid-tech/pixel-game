import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  SAVE_KEY,
  direction,
  freshSave,
  loadSave,
  orderTea,
  persist,
  validSave,
  type StorageLike,
} from '../src/state';
class Memory implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
describe('tea purchases', () => {
  it('deducts exact BDT and increments progress without mutating the prior snapshot', () => {
    const s = freshSave();
    const result = orderTea(s, 'milk');
    expect(result.ok).toBe(true);
    expect(result.state.wallet).toBe(85);
    expect(result.state.cups).toBe(1);
    expect(s.wallet).toBe(100);
    expect(result.state.metSeller).toBe(true);
  });
  it('supports lemon tea and refuses an unaffordable order without losing money', () => {
    const s = { ...freshSave(), wallet: 10 };
    const bought = orderTea(s, 'lemon');
    expect(bought.state.wallet).toBe(0);
    expect(bought.state.cups).toBe(1);
    const refused = orderTea(bought.state, 'milk');
    expect(refused.ok).toBe(false);
    expect(refused.state).toEqual(bought.state);
  });
});
describe('save integrity', () => {
  it('round trips progress and interior position across a fresh load', () => {
    const store = new Memory();
    const state = {
      ...orderTea(freshSave(), 'milk').state,
      place: 'stall' as const,
      x: 370,
      y: 230,
    };
    expect(persist(store, state)).toBe(true);
    const loaded = loadSave(store);
    expect(loaded).toMatchObject({ wallet: 85, cups: 1, place: 'stall', x: 370, y: 230 });
    expect(loaded!.savedAt).toBeGreaterThan(0);
  });
  it('recovers the previous valid snapshot from corrupted current JSON', () => {
    const store = new Memory();
    persist(store, freshSave());
    persist(store, { ...freshSave(), wallet: 85, cups: 1 });
    store.setItem(SAVE_KEY, '{bad');
    expect(loadSave(store)?.wallet).toBe(100);
    expect(store.getItem(BACKUP_KEY)).not.toBeNull();
  });
  it('rejects future versions, invalid currency, and out-of-bounds coordinates', () => {
    for (const patch of [
      { version: 2 },
      { wallet: -1 },
      { wallet: NaN },
      { cups: 0.5 },
      { x: Infinity },
      { y: 5 },
      { place: 'unknown' },
      { muted: 'yes' },
    ])
      expect(validSave({ ...freshSave(), ...patch })).toBe(false);
  });
  it('handles unavailable storage honestly', () => {
    const bad = {
      getItem() {
        throw Error('denied');
      },
      setItem() {
        throw Error('quota');
      },
    };
    expect(persist(bad, freshSave())).toBe(false);
    expect(loadSave(bad)).toBeNull();
  });
  it('never replaces a good backup with a corrupt prior save', () => {
    const store = new Memory();
    persist(store, freshSave());
    persist(store, { ...freshSave(), wallet: 85 });
    store.setItem(SAVE_KEY, '{}');
    persist(store, { ...freshSave(), wallet: 70 });
    expect(JSON.parse(store.getItem(BACKUP_KEY)!).wallet).toBe(100);
  });
});
describe('input normalization', () => {
  it('prevents diagonal speed advantage', () => {
    expect(Math.hypot(...Object.values(direction(1, 1)))).toBeCloseTo(1);
    expect(direction(0, 0)).toEqual({ x: 0, y: 0 });
    expect(direction(-1, 0)).toEqual({ x: -1, y: 0 });
  });
});
