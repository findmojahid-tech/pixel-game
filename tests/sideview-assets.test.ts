import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import manifest from '../public/assets/sideview/manifest.json';
describe('side-view production PNG assets', () => {
  it('ships the exact normalized files declared in the art manifest', () => {
    for (const a of manifest.asset_records) {
      const p = readFileSync(new URL('../public/assets/sideview/' + a.file, import.meta.url));
      expect(p.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(p.readUInt32BE(16)).toBe(a.width);
      expect(p.readUInt32BE(20)).toBe(a.height);
      expect(createHash('sha256').update(p).digest('hex')).toBe(a.sha256);
    }
  });
  it('provides genuine multi-frame PNG sheets and distinct architecture/foreground families', () => {
    const assets = manifest.asset_records;
    for (const key of ['hero-walk', 'hero-idle', 'rahim', 'pedestrian', 'rickshaw', 'cng']) {
      const a = assets.find((a) => a.id === key)!;
      expect(a.frames).toBeGreaterThanOrEqual(3);
      expect(a.width).toBe(a.frameWidth! * a.frames!);
      expect(a.height).toBe(a.frameHeight);
    }
    for (const key of ['facades', 'river', 'interior', 'sky', 'palm', 'banyan', 'produce', 'bench'])
      expect(assets.some((a) => a.id === key)).toBe(true);
    expect(assets.find((a) => a.id === 'facades')!.sha256).not.toBe(
      assets.find((a) => a.id === 'river')!.sha256,
    );
  });
});
