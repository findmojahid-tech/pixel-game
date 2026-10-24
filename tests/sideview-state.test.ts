import { describe, it, expect } from 'vitest';
import { SideSession, SIDE_KEY, freshPosition, validPosition } from '../src/sideview/state';
import { SAVE_KEY, persist, freshSave, type StorageLike } from '../src/state';
class Memory implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
describe('side-view sessions preserve revision 0.2 data', () => {
  it('reuses the existing economy without moving the district save', () => {
    const store = new Memory();
    const previous = {
      ...freshSave(),
      place: 'books' as const,
      x: 360,
      y: 290,
      visited: ['courtyard', 'bazaar', 'books'] as const,
      bookmark: true,
      wallet: 70,
      cups: 2,
    };
    persist(store, { ...previous, visited: [...previous.visited] });
    const s = new SideSession(store);
    expect(s.economy.wallet).toBe(70);
    s.position = { ...freshPosition(), place: 'tea', x: 440 };
    expect(s.order('milk')).toBe(true);
    expect(s.save()).toBe(true);
    const common = JSON.parse(store.getItem(SAVE_KEY)!);
    expect(common).toMatchObject({
      place: 'books',
      x: 360,
      y: 290,
      wallet: 55,
      cups: 3,
      bookmark: true,
      visited: ['courtyard', 'bazaar', 'books'],
    });
    const reload = new SideSession(store);
    expect(reload.position).toMatchObject({ place: 'tea', x: 440 });
  });
  it('starts with BDT 100 only when there is no usable previous economy', () => {
    expect(new SideSession(new Memory()).economy.wallet).toBe(100);
  });
  it('refuses unaffordable tea and does not modify original state', () => {
    const store = new Memory();
    persist(store, { ...freshSave(), wallet: 5 });
    const s = new SideSession(store);
    expect(s.order('milk')).toBe(false);
    expect(s.economy.wallet).toBe(5);
    expect(s.economy.cups).toBe(0);
  });
  it('retains common mute/bookmark/discovery flags across the presentation boundary', () => {
    const store = new Memory();
    persist(store, {
      ...freshSave(),
      muted: true,
      bookmark: true,
      visited: ['courtyard', 'bazaar', 'books', 'stall', 'crossing', 'residential'],
    });
    const s = new SideSession(store);
    s.discover('river');
    s.save();
    const common = JSON.parse(store.getItem(SAVE_KEY)!);
    expect(common.muted).toBe(true);
    expect(common.bookmark).toBe(true);
    expect(common.visited).toHaveLength(6);
    expect(s.position.visited).toEqual(['lalbagh', 'river']);
  });
  it('rejects corrupted or out-of-range side positions', () => {
    for (const patch of [
      { version: 2 },
      { x: Infinity },
      { x: -1 },
      { x: 2000 },
      { place: 'future' },
      { place: 'tea', x: 900 },
      { visited: ['future'] },
      { visited: ['river', 'river'] },
    ])
      expect(validPosition({ ...freshPosition(), ...patch })).toBe(false);
  });
  it('recovers the previous side-position snapshot without erasing the district save', () => {
    const store = new Memory(),
      s = new SideSession(store);
    s.save();
    s.position.x = 1200;
    s.save();
    store.setItem(SIDE_KEY, '{bad');
    const recovered = new SideSession(store);
    expect(recovered.position.x).toBe(420);
    expect(recovered.economy.wallet).toBe(100);
  });
  it('handles unavailable browser storage without claiming success', () => {
    const s = new SideSession(null);
    expect(s.save()).toBe(false);
    expect(s.economy.wallet).toBe(100);
  });
});
