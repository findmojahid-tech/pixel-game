import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  SAVE_KEY,
  direction,
  freshSave,
  loadSave,
  migrateSave,
  orderTea,
  persist,
  validSave,
  type StorageLike,
} from '../src/state';
import { blocked, DOORS, PEOPLE, SIZE, ZONES, zoneAt } from '../src/district';
class Memory implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
}
describe('currency and persistent exploration', () => {
  it('deducts exact BDT without mutating the old snapshot', () => {
    const s = freshSave(),
      r = orderTea(s, 'milk');
    expect(r.ok).toBe(true);
    expect(r.state).toMatchObject({ wallet: 85, cups: 1, metSeller: true });
    expect(s.wallet).toBe(100);
  });
  it('rejects an unaffordable order', () => {
    const bought = orderTea({ ...freshSave(), wallet: 10 }, 'lemon');
    expect(bought.state.wallet).toBe(0);
    expect(orderTea(bought.state, 'milk')).toEqual({ ok: false, state: bought.state });
  });
  it('round trips a bookshop save including visited places and a keepsake', () => {
    const store = new Memory();
    const s = {
      ...freshSave(),
      wallet: 85,
      cups: 1,
      place: 'books' as const,
      x: 432,
      y: 290,
      visited: ['courtyard', 'bazaar', 'books'] as const,
      bookmark: true,
    };
    expect(persist(store, { ...s, visited: [...s.visited] })).toBe(true);
    expect(loadSave(store)).toMatchObject({ ...s, savedAt: expect.any(Number) });
  });
  it('migrates milestone one saves without losing money, cups or mute preferences', () => {
    const legacy = {
      version: 1,
      wallet: 55,
      cups: 3,
      place: 'stall',
      x: 370,
      y: 230,
      metSeller: true,
      muted: true,
      savedAt: 123,
    };
    const r = migrateSave(legacy);
    expect(r).toMatchObject({
      version: 2,
      wallet: 55,
      cups: 3,
      muted: true,
      place: 'district',
      x: 480,
      y: 390,
    });
    expect(validSave(r)).toBe(true);
  });
  it('recovers a corrupt current save from its last good backup', () => {
    const store = new Memory();
    persist(store, freshSave());
    persist(store, { ...freshSave(), wallet: 85 });
    store.setItem(SAVE_KEY, '{bad');
    expect(loadSave(store)?.wallet).toBe(100);
    expect(store.getItem(BACKUP_KEY)).not.toBeNull();
  });
  it('never copies a corrupt primary over the valid backup', () => {
    const store = new Memory();
    persist(store, freshSave());
    persist(store, { ...freshSave(), wallet: 85 });
    store.setItem(SAVE_KEY, '{}');
    persist(store, { ...freshSave(), wallet: 70 });
    expect(JSON.parse(store.getItem(BACKUP_KEY)!).wallet).toBe(100);
  });
  it('validates version, bounds, currency and zone identities', () => {
    for (const p of [
      { version: 3 },
      { wallet: -1 },
      { wallet: NaN },
      { cups: 0.5 },
      { x: Infinity },
      { y: 5 },
      { place: 'unknown' },
      { muted: 'yes' },
      { visited: ['invented'] },
      { visited: ['bazaar', 'bazaar'] },
      { bookmark: 'yes' },
    ])
      expect(validSave({ ...freshSave(), ...p })).toBe(false);
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
  it('keeps diagonal travel at the same speed as cardinal travel', () => {
    expect(Math.hypot(...Object.values(direction(1, 1)))).toBeCloseTo(1);
    expect(direction(0, 0)).toEqual({ x: 0, y: 0 });
  });
});
describe('district traversability using the actual player collision footprint', () => {
  it('connects all outdoor centres, both entrances and outdoor conversation spots', () => {
    const step = 8,
      cols = Math.ceil(SIZE.w / step),
      rows = Math.ceil(SIZE.h / step),
      seen = new Uint8Array(cols * rows),
      queue: number[] = [];
    const start = Math.round(420 / step) * cols + Math.round(480 / step);
    seen[start] = 1;
    queue.push(start);
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head],
        x = cell % cols,
        y = Math.floor(cell / cols);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const key = ny * cols + nx;
        if (!seen[key] && !blocked('district', nx * step, ny * step)) {
          seen[key] = 1;
          queue.push(key);
        }
      }
    }
    const points = [
      ...ZONES.filter((z) => !['stall', 'books'].includes(z.id)),
      ...Object.values(DOORS),
      ...PEOPLE.filter((p) => !['rahim', 'nila'].includes(p.id)),
    ];
    for (const p of points)
      expect(
        seen[Math.round(p.y / step) * cols + Math.round(p.x / step)],
        `unreachable (${p.x},${p.y})`,
      ).toBe(1);
    expect(queue.length * step * step).toBeGreaterThan(1500000);
  });
  it('blocks buildings and the pond while allowing crossings and side routes', () => {
    expect(blocked('district', 480, 200)).toBe(true);
    expect(blocked('district', 830, 1200)).toBe(true);
    expect(blocked('books', 430, 380)).toBe(true);
    expect(blocked('books', 360, 380)).toBe(false);
    for (const [x, y] of [
      [480, 420],
      [960, 600],
      [1420, 800],
      [480, 950],
      [700, 1110],
    ])
      expect(blocked('district', x, y)).toBe(false);
  });
  it('keeps the main north-south walking corridor clear of parked traffic and furniture', () => {
    for (let y = 400; y <= 1110; y += 5)
      expect(blocked('district', 490, y), `corridor blocked at ${y}`).toBe(false);
  });
  it('classifies six distinct locations, rather than cosmetic location names on one strip', () => {
    expect(
      new Set(
        ZONES.map((z) =>
          zoneAt(z.x, z.y, z.id === 'stall' ? 'stall' : z.id === 'books' ? 'books' : 'district'),
        ),
      ).size,
    ).toBe(6);
  });
});
