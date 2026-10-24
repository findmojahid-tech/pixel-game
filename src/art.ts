/** Original, deterministic pixel artwork. Every solid is drawn on an integer grid. */
import Phaser from 'phaser';
import { BUILDINGS, SIZE, type Building } from './district';
export class Pixel {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  constructor(
    public w: number,
    public h: number,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.c = this.canvas.getContext('2d')!;
    this.c.imageSmoothingEnabled = false;
  }
  r(x: number, y: number, w: number, h: number, color: string) {
    this.c.fillStyle = color;
    this.c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string, width = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1,
      dy = -Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      this.r(x0, y0, width, width, color);
      if (x0 === x1 && y0 === y1) break;
      const e = 2 * error;
      if (e >= dy) {
        error += dy;
        x0 += sx;
      }
      if (e <= dx) {
        error += dx;
        y0 += sy;
      }
    }
  }
  ellipse(x: number, y: number, rx: number, ry: number, color: string) {
    for (let i = -Math.floor(ry); i <= ry; i++) {
      const span = Math.floor(rx * Math.sqrt(1 - (i * i) / (ry * ry)));
      this.r(x - span, y + i, span * 2 + 1, 1, color);
    }
  }
  poly(points: number[][], color: string) {
    const ys = points.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const crossings: number[] = [];
      points.forEach((a, i) => {
        const b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          crossings.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      });
      crossings.sort((a, b) => a - b);
      for (let i = 0; i < crossings.length; i += 2)
        this.r(
          Math.ceil(crossings[i]),
          y,
          Math.floor(crossings[i + 1]) - Math.ceil(crossings[i]) + 1,
          1,
          color,
        );
    }
  }
  text(
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign = 'left',
  ) {
    this.c.font = `600 ${size}px Bengali, monospace`;
    this.c.textAlign = align;
    this.c.textBaseline = 'top';
    this.c.fillStyle = color;
    this.c.fillText(text, x, y);
  }
}
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const ink = '#273354',
  shadow = '#242e5038',
  cream = '#fff1b8';
function pot(p: Pixel, x: number, y: number, pink = false) {
  p.ellipse(x, y + 14, 11, 3, shadow);
  p.r(x - 9, y, 18, 4, '#f0a062');
  p.poly(
    [
      [x - 7, y + 4],
      [x + 7, y + 4],
      [x + 5, y + 15],
      [x - 5, y + 15],
    ],
    '#bd5a53',
  );
  p.r(x - 4, y + 5, 3, 8, '#e97f5b');
  for (let i = -1; i < 2; i++) {
    p.line(x, y, x + i * 9, y - 17 + Math.abs(i) * 6, '#255e50', 2);
    p.ellipse(x + i * 8, y - 12 + Math.abs(i) * 5, 7, 4, '#349764');
    p.line(
      x + i * 8 - 3,
      y - 13 + Math.abs(i) * 5,
      x + i * 8 + 3,
      y - 13 + Math.abs(i) * 5,
      '#7cc768',
    );
    if (pink) {
      p.ellipse(x + i * 8, y - 16 + Math.abs(i) * 5, 4, 3, '#e95e91');
      p.r(x + i * 8, y - 17 + Math.abs(i) * 5, 2, 2, '#ffdc71');
    }
  }
}
function windowArt(p: Pixel, x: number, y: number, w = 27, h = 35) {
  p.r(x - 3, y - 3, w + 6, h + 7, '#b17b68');
  p.r(x - 1, y - 1, w + 2, h + 3, cream);
  p.r(x, y, w, h, ink);
  p.r(x + 3, y + 3, w - 6, h - 6, '#3d7991');
  p.poly(
    [
      [x + 3, y + 3],
      [x + w - 4, y + 3],
      [x + 3, y + h - 3],
    ],
    '#79c4c1',
  );
  p.r(x + w / 2 - 1, y, 3, h, cream);
  p.r(x, y + h / 2, w, 2, cream);
  p.r(x - 5, y + h + 2, w + 10, 4, '#815b65');
  p.r(x - 6, y + h, w + 12, 2, '#ffe0a0');
}
function kettle(p: Pixel, x: number, y: number) {
  p.ellipse(x, y + 9, 13, 4, '#567f8b');
  p.r(x - 11, y - 7, 22, 15, '#a8d0c3');
  p.ellipse(x, y - 7, 11, 4, '#e0f0cf');
  p.r(x - 4, y - 12, 8, 4, ink);
  p.r(x - 7, y - 5, 3, 11, '#eef6ce');
  p.line(x + 11, y, x + 20, y - 9, '#d6e7c6', 4);
  p.line(x - 12, y - 7, x - 17, y - 3, ink, 3);
  p.line(x - 17, y - 3, x - 14, y + 5, ink, 3);
}
function crate(p: Pixel, x: number, y: number, w: number, type: string) {
  p.r(x, y, w, 27, '#82534b');
  p.r(x + 2, y + 2, w - 4, 4, '#de9e5b');
  p.r(x + 2, y + 21, w - 4, 3, '#de9e5b');
  for (let i = 0; i < w; i += 12) {
    p.r(x + i, y + 5, 3, 16, '#bb7c4d');
  }
  const rng = random(x + y);
  for (let i = 0; i < w / 5; i++) {
    const fx = x + 5 + rng() * (w - 10),
      fy = y - 1 + rng() * 7;
    p.ellipse(
      fx,
      fy,
      5,
      4,
      type === 'fish'
        ? '#94d8da'
        : type === 'spice'
          ? ['#d86b48', '#f6ba47', '#9e5971'][i % 3]
          : ['#f8c44d', '#f29e45', '#71b35a'][i % 3],
    );
    p.r(fx - 1, fy - 3, 2, 1, type === 'fish' ? '#eef2cd' : '#419561');
  }
}
export function groundArt(): Pixel {
  const p = new Pixel(SIZE.w, SIZE.h),
    rng = random(824);
  p.r(0, 0, SIZE.w, SIZE.h, '#77b76a');
  p.r(12, 24, 938, 620, '#e7c68c');
  p.r(960, 24, 948, 620, '#edb28c');
  p.r(340, 580, 320, 820, '#e5c18c');
  p.r(910, 0, 150, 1400, '#e5c18c');
  p.r(1300, 620, 250, 780, '#eed2a0');
  p.r(0, 1040, 1920, 115, '#e9c88c');
  p.r(18, 850, 1884, 210, '#34445e');
  p.r(18, 850, 1884, 9, '#6b7887');
  p.r(18, 857, 1884, 3, '#f8dea6');
  p.r(18, 1047, 1884, 9, '#728a90');
  p.r(18, 1045, 1884, 3, '#f5d69f');
  for (let y = 36; y < SIZE.h; y += 16)
    for (let x = 18 + (y % 32 ? 13 : 0); x < SIZE.w; x += 29) {
      const road = y > 861 && y < 1045;
      if (road) {
        if (rng() > 0.7) p.r(x, y, 3, 1, '#4e5d76');
        continue;
      }
      const path =
        y < 645 ||
        (x > 340 && x < 660) ||
        (x > 910 && x < 1060) ||
        (x > 1300 && x < 1550) ||
        (y > 1040 && y < 1155);
      if (path) {
        p.line(x, y, x + 22, y, '#ca9e762f');
        p.line(x, y, x - 3, y + 12, '#a4756526');
        if (rng() > 0.7) p.r(x + 8, y + 5, 4, 2, '#fff1bd66');
      } else if (rng() > 0.35) {
        p.r(x, y, 3, 2, '#5c9e62');
        p.r(x + 3, y - 2, 2, 3, '#a2cd6e');
        if (rng() > 0.91) p.r(x + 2, y - 3, 2, 2, '#fff0af');
      }
    }
  for (let x = 20; x < 1900; x += 58) {
    p.r(x, 950, 30, 3, '#f3ce8d');
    p.r(x, 956, 30, 1, '#50647a');
  }
  for (let y = 875; y < 1040; y += 22) {
    p.r(415, y, 100, 12, '#e5e4bf');
    p.r(1360, y, 110, 12, '#e5e4bf');
  }
  // Corner plazas, decorative brick circles, a lotus pond and stepping stones.
  for (const [x, y] of [
    [480, 420],
    [1430, 1095],
  ]) {
    p.ellipse(x, y, 105, 51, '#bc8970');
    p.ellipse(x, y - 2, 100, 47, '#f7db9a');
    p.ellipse(x, y - 2, 87, 40, '#d7ad79');
    p.ellipse(x, y - 3, 82, 37, '#eed49d');
    for (let a = 0; a < 16; a++) {
      const t = (a * Math.PI) / 8;
      p.r(x + Math.cos(t) * 95, y + Math.sin(t) * 43 - 1, 4, 2, '#fff0b8');
    }
  }
  p.ellipse(835, 1220, 113, 82, '#385e75');
  p.ellipse(835, 1217, 107, 76, '#9dd8b5');
  p.ellipse(835, 1214, 99, 69, '#2d9fac');
  p.ellipse(835, 1209, 95, 62, '#38b9bd');
  for (let i = 0; i < 22; i++) {
    p.r(750 + rng() * 165, 1170 + rng() * 100, 8 + rng() * 16, 2, '#a3e6cf');
  }
  for (const [x, y] of [
    [800, 1184],
    [878, 1240],
    [840, 1210],
  ]) {
    p.ellipse(x, y, 14, 6, '#48a869');
    p.ellipse(x, y - 2, 5, 4, '#f18aa3');
    p.r(x - 1, y - 3, 2, 2, '#fff0b5');
  }
  // Garden beds, sidewalk drains, wall posters and scattered petals.
  for (const [x, y] of [
    [90, 600],
    [700, 660],
    [1150, 1080],
    [1660, 1050],
  ]) {
    p.ellipse(x + 75, y, 75, 19, '#387f61');
    for (let i = 0; i < 42; i++) {
      const fx = x + rng() * 150,
        fy = y - 12 + rng() * 19;
      p.r(fx, fy, 3, 3, ['#fff1a4', '#fa9b6c', '#ed6d94', '#a4d478'][i % 4]);
    }
  }
  for (let x = 90; x < 1900; x += 240) {
    p.r(x, 835, 32, 8, '#637878');
    for (let n = 0; n < 30; n += 5) p.r(x + n, 837, 2, 4, '#283f53');
  }
  for (let i = 0; i < 120; i++) {
    const x = rng() * 1900,
      y = rng() * 1400;
    if (y < 830 || y > 1060) p.r(x, y, 2, 1, i % 2 ? '#e78a79' : '#fff0ae');
  }
  // Benches: leaves and feet can pass behind their back, collision uses the seat only.
  for (const [x, y, w] of [
    [360, 465, 105],
    [515, 500, 88],
    [1455, 1070, 86],
  ]) {
    p.r(x, y + 14, w, 5, shadow);
    p.r(x + 7, y + 10, 4, 16, ink);
    p.r(x + w - 12, y + 10, 4, 16, ink);
    p.r(x, y - 13, w, 7, '#a05e4f');
    p.r(x, y - 11, w, 2, '#f0bb76');
    p.r(x, y - 4, w, 6, '#b57555');
    p.r(x, y + 6, w, 8, '#d2975d');
    p.r(x, y + 6, w, 2, '#ffd58e');
  }
  // A parked bicycle with a basket.
  for (const x of [562, 599]) {
    p.ellipse(x, 802, 12, 12, ink);
    p.ellipse(x, 802, 9, 9, '#c4c3a3');
    p.line(x - 8, 802, x + 8, 802, '#557679');
    p.line(x, 794, x, 810, '#557679');
  }
  p.line(562, 802, 577, 780, '#ed9675', 3);
  p.line(577, 780, 599, 802, '#ed9675', 3);
  p.line(562, 802, 590, 801, '#ed9675', 3);
  p.line(590, 801, 586, 778, '#ed9675', 3);
  p.r(580, 775, 14, 3, ink);
  p.r(557, 782, 14, 8, '#cfa374');
  return p;
}
export function buildingArt(b: Building): Pixel {
  const p = new Pixel(b.w + 48, b.h + 55),
    rng = random(b.x),
    x = 24,
    y = 24,
    w = b.w,
    h = b.h,
    rh = Math.min(82, Math.max(28, h - 120)),
    fy = y + rh;
  p.poly(
    [
      [x + 8, y + 65],
      [x + w + 20, y + 86],
      [x + w + 26, y + h + 13],
      [x + 22, y + h + 22],
      [x - 4, y + h + 7],
    ],
    '#37345632',
  );
  p.r(x - 2, fy - 3, w + 4, h - rh + 3, ink);
  p.r(x, fy, w, h - rh, b.color);
  p.r(x + w - 16, fy + 4, 16, h - rh - 3, '#72596e55');
  p.r(x + 4, fy + 5, 5, h - rh - 8, '#ffe8aa80');
  for (let i = 0; i < 60; i++) {
    p.r(x + 8 + rng() * (w - 24), fy + 8 + rng() * (h - rh - 18), 4 + rng() * 7, 1, '#fff0c32f');
  }
  p.r(x - 4, y + h - 4, w + 8, 9, '#704957');
  p.r(x - 7, y + h + 5, w + 14, 5, '#f4d794');
  p.r(x - 9, y + h + 10, w + 18, 3, '#ae7b69');
  // Roof has a deep projected overhang, individually ribbed sheets and bright ridge.
  p.poly(
    [
      [x - 13, y + rh + 3],
      [x + 14, y + 13],
      [x + w - 17, y + 13],
      [x + w + 13, y + rh + 3],
    ],
    ink,
  );
  p.poly(
    [
      [x - 9, y + rh - 3],
      [x + 17, y + 17],
      [x + w - 20, y + 17],
      [x + w + 9, y + rh - 3],
    ],
    b.roof,
  );
  for (let i = 0; i < w - 24; i += 10) {
    p.line(x + 18 + i, y + 19, x - 6 + (i * (w + 12)) / (w - 24), y + rh - 5, '#ecf8cb70', 2);
    p.line(x + 20 + i, y + 23, x - 3 + (i * (w + 12)) / (w - 24), y + rh - 5, '#162c5140');
  }
  p.r(x + 14, y + 13, w - 31, 4, '#fff0ac');
  p.r(x - 13, y + rh, w + 26, 7, ink);
  p.r(x - 11, y + rh - 1, w + 22, 2, '#ecce8a');
  if (b.style === 'house') {
    for (let wx = x + 25; wx < x + w - 20; wx += 50) windowArt(p, wx, fy + 16, 26, 33);
    p.r(x + 17, fy + 62, w - 34, 10, '#456a7e');
    p.r(x + 13, fy + 60, w - 26, 3, '#ffe5ab');
    for (let n = 22; n < w - 17; n += 10) p.r(x + n, fy + 43, 2, 18, ink);
    p.r(x + 16, fy + 43, w - 32, 2, '#fcdfaa');
    const dx = x + w / 2 - 17;
    p.r(dx - 4, y + h - 68, 42, 64, '#f4dca4');
    p.r(dx, y + h - 65, 34, 61, '#345572');
    p.r(dx + 3, y + h - 62, 28, 54, '#4f8c95');
    p.r(dx + 21, y + h - 34, 3, 3, '#ffd58a');
    p.line(x + 14, fy + 75, x + w - 14, fy + 80, ink);
    ['#f0777c', '#f4da93', '#6daadd', '#b6e1ae'].forEach((c, i) => {
      p.r(x + 20 + i * 37, fy + rh - 5, 22, 25, c);
      p.r(x + 16 + i * 37, fy + rh - 5, 30, 8, c);
      p.r(x + 23 + i * 37, fy + 80, 2, 19, '#fff2c540');
    });
    pot(p, x + 20, y + h - 4, true);
    pot(p, x + w - 27, y + h - 4, true);
  } else {
    const door = b.style === 'tea' || b.style === 'books';
    const middle = x + w / 2;
    p.r(x + 16, fy + 12, w - 32, 37, ink);
    p.r(x + 19, fy + 15, w - 38, 31, b.style === 'tea' ? '#17665f' : '#49345e');
    p.r(x + 21, fy + 17, w - 42, 2, '#ffe6a7');
    p.r(x + 12, fy + 55, w - 24, h - 140, '#243b53');
    p.r(x + 14, fy + 53, w - 28, 17, b.style === 'tea' ? '#3c8b79' : '#736b8c');
    for (let n = 25; n < w - 20; n += 18) {
      p.poly(
        [
          [x + n, fy + 58],
          [x + n + 4, fy + 62],
          [x + n, fy + 66],
          [x + n - 4, fy + 62],
        ],
        '#f4d18b',
      );
    }
    if (door) {
      p.r(middle - 25, y + h - 63, 50, 60, '#ffe2a0');
      p.r(middle - 20, y + h - 61, 40, 58, '#182f46');
      p.r(middle - 18, y + h - 60, 5, 56, '#407b6d');
      p.r(middle - 11, y + h - 57, 25, 17, '#cf965d');
      p.r(middle - 10, y + h - 54, 22, 11, '#476b6e');
      for (let wx = x + 19; wx < x + w - 24; wx += w - 66) {
        p.r(wx, y + h - 57, 39, 45, '#2d826f');
        for (let yy = y + h - 52; yy < y + h - 15; yy += 6) p.r(wx + 3, yy, 33, 2, '#66bd91');
      }
      if (b.style === 'tea') {
        kettle(p, x + w - 44, y + h - 23);
        for (let i = 0; i < 4; i++) {
          p.r(x + 22 + i * 8, y + h - 23, 6, 9, '#fff0b6');
          p.r(x + 23 + i * 8, y + h - 22, 4, 3, '#b46c43');
        }
      } else {
        for (let i = 0; i < 9; i++)
          p.r(
            x + 15 + i * 7,
            y + h - 38 - (i % 3) * 3,
            5,
            25 + (i % 3) * 3,
            ['#f08480', '#edc573', '#72c3b0', '#8e8acb'][i % 4],
          );
      }
    } else {
      crate(p, x + 14, y + h - 25, w - 28, b.style);
      p.r(x + 18, y + h - 2, 3, 14, ink);
      p.r(x + w - 22, y + h - 2, 3, 14, ink);
    }
    const ay = y + h - 65;
    p.poly(
      [
        [x - 9, ay - 8],
        [x + w + 9, ay - 8],
        [x + w + 16, ay + 13],
        [x - 16, ay + 13],
      ],
      ink,
    );
    p.poly(
      [
        [x - 6, ay - 6],
        [x + w + 6, ay - 6],
        [x + w + 12, ay + 10],
        [x - 12, ay + 10],
      ],
      b.style === 'tea' ? '#df655d' : b.roof,
    );
    for (let n = 0; n < w + 12; n += 23)
      p.poly(
        [
          [x - 5 + n, ay - 6],
          [x + 6 + n, ay - 6],
          [x + 4 + n, ay + 10],
          [x - 10 + n, ay + 10],
        ],
        '#ffe8af',
      );
    for (let n = 0; n < w + 14; n += 12) {
      p.r(x - 12 + n, ay + 10, 11, 5, n % 24 ? '#f4c88f' : '#b55364');
      p.r(x - 11 + n, ay + 15, 9, 2, ink);
    }
    p.r(x - 7, ay + 17, 3, h - (ay - y) - 15, '#445a69');
    p.r(x + w + 3, ay + 17, 3, h - (ay - y) - 15, '#445a69');
    pot(p, x + w + 4, y + h - 7, true);
    if (b.style === 'flowers') {
      for (let i = 0; i < 5; i++) pot(p, x + 12 + i * 22, y + h - 10 - (i % 2) * 7, true);
    }
  }
  // Decorative posters, tiles and roof water tanks.
  if (w > 190) {
    p.r(x + w - 48, y + 1, 30, 17, '#394b70');
    p.r(x + w - 51, y - 2, 36, 5, '#728bb2');
    p.r(x + w - 46, y + 2, 4, 13, '#a8bdc4');
    p.r(x + w - 44, y + 17, 3, 9, ink);
  }
  for (let i = 0; i < 3; i++) {
    p.r(x + 3, fy + 25 + i * 9, 7, 5, i % 2 ? '#ea675f' : '#fff0bd');
  }
  return p;
}
export function treeArt(seed: number): Pixel {
  const p = new Pixel(160, 198),
    rng = random(seed);
  p.ellipse(88, 188, 62, 10, '#284c6435');
  p.ellipse(86, 179, 49, 8, '#2a505a28');
  p.poly(
    [
      [70, 190],
      [89, 190],
      [86, 106],
      [81, 70],
      [74, 111],
    ],
    ink,
  );
  p.poly(
    [
      [73, 186],
      [84, 186],
      [81, 108],
      [76, 122],
    ],
    '#95624e',
  );
  p.r(75, 126, 3, 57, '#d29a61');
  p.line(78, 131, 46, 86, '#73594e', 8);
  p.line(82, 115, 117, 71, '#73594e', 7);
  const crown = [
    [65, 2],
    [99, 6],
    [105, 14],
    [126, 14],
    [136, 27],
    [144, 38],
    [139, 51],
    [154, 65],
    [155, 94],
    [143, 109],
    [147, 123],
    [126, 135],
    [103, 143],
    [75, 138],
    [59, 144],
    [35, 137],
    [29, 126],
    [14, 125],
    [6, 109],
    [12, 95],
    [1, 87],
    [4, 65],
    [17, 55],
    [12, 44],
    [24, 28],
    [40, 22],
    [49, 9],
  ];
  p.poly(crown, '#203f4b');
  p.poly(
    crown.map(([x, y]) => [x * 0.95 + 4, y * 0.95 + 2]),
    '#27734f',
  );
  function cluster(x: number, y: number, rx: number, ry: number, color: string) {
    const points = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2,
        r = i % 3 === 0 ? 0.87 : 1;
      points.push([
        Math.round((x + Math.cos(a) * rx * r) / 2) * 2,
        Math.round((y + Math.sin(a) * ry * r) / 2) * 2,
      ]);
    }
    p.poly(points, color);
  }
  for (const [x, y, rx, ry] of [
    [47, 43, 35, 27],
    [81, 27, 29, 21],
    [115, 55, 28, 24],
    [33, 84, 24, 29],
    [76, 69, 36, 28],
    [119, 101, 27, 24],
    [72, 111, 34, 23],
  ]) {
    cluster(x, y + 5, rx + 2, ry + 1, '#215f4c');
    cluster(x, y, rx, ry, '#3a9659');
    cluster(x - 4, y - 7, rx - 3, ry - 6, '#67ba61');
    cluster(x - 7, y - 12, rx - 11, ry - 12, '#8ad36c');
  }
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(12 + rng() * 132),
      y = Math.floor(12 + rng() * 120),
      d = p.c.getImageData(x, y, 1, 1).data;
    if (d[3] && d[1] > 100) {
      const c = ['#a6d97b', '#4eaa5c', '#2d8756'][i % 3];
      p.poly(
        [
          [x, y],
          [x + 4, y - 2],
          [x + 7, y],
          [x + 3, y + 2],
        ],
        c,
      );
    }
  }
  return p;
}
export function palmArt(): Pixel {
  const p = new Pixel(164, 222);
  p.ellipse(85, 213, 46, 7, shadow);
  p.poly(
    [
      [73, 216],
      [85, 216],
      [104, 87],
      [97, 67],
      [90, 93],
    ],
    ink,
  );
  p.poly(
    [
      [76, 213],
      [83, 213],
      [99, 88],
      [97, 79],
      [94, 99],
    ],
    '#af8965',
  );
  for (let y = 94; y < 210; y += 10)
    p.line(93 - (y - 94) * 0.13, y, 99 - (y - 94) * 0.13, y - 2, '#e4bb78', 2);
  for (const [x, y] of [
    [7, 59],
    [25, 25],
    [66, 10],
    [114, 17],
    [154, 42],
    [160, 92],
    [127, 116],
    [46, 110],
  ]) {
    p.line(96, 72, x, y, '#226853', 4);
    for (let i = 1; i < 17; i++) {
      const t = i / 17,
        fx = 96 + (x - 96) * t,
        fy = 72 + (y - 72) * t;
      p.line(fx, fy, fx + (x < 96 ? -10 : 10), fy + 22 * (1 - t) + 6, '#319c61', 3);
      p.line(fx, fy, fx + (x < 96 ? -7 : 7), fy + 13 * (1 - t), '#7ac969', 2);
    }
  }
  p.ellipse(96, 77, 6, 7, '#a1a458');
  p.ellipse(105, 81, 5, 6, '#78934f');
  return p;
}
export function umbrellaArt(): Pixel {
  const p = new Pixel(112, 123);
  p.ellipse(57, 116, 45, 6, shadow);
  p.r(53, 40, 4, 77, ink);
  p.r(55, 41, 1, 73, '#efc18a');
  p.poly(
    [
      [7, 49],
      [16, 28],
      [48, 10],
      [75, 11],
      [99, 32],
      [108, 51],
    ],
    ink,
  );
  p.poly(
    [
      [10, 46],
      [19, 29],
      [49, 14],
      [74, 14],
      [96, 33],
      [104, 47],
    ],
    '#eb726b',
  );
  p.poly(
    [
      [19, 29],
      [49, 14],
      [43, 47],
      [10, 46],
    ],
    '#ffdba0',
  );
  p.poly(
    [
      [74, 14],
      [96, 33],
      [104, 47],
      [77, 47],
    ],
    '#ffdba0',
  );
  p.poly(
    [
      [49, 14],
      [74, 14],
      [77, 47],
      [43, 47],
    ],
    '#c84f66',
  );
  p.r(8, 47, 99, 5, '#243a55');
  for (let x = 10; x < 107; x += 14) p.r(x, 51, 12, 5, '#ffdca2');
  p.r(18, 90, 77, 23, '#996052');
  p.r(15, 87, 83, 6, '#f1bb76');
  crate(p, 21, 82, 68, 'fruit');
  return p;
}
export function heroArt(dir: number, frame: number, variant = 0): Pixel {
  const p = new Pixel(36, 54);
  const walk = frame < 6,
    step = walk ? [-2, 0, 2, 2, 0, -2][frame] : 0,
    bob = walk ? (frame % 3 === 0 ? 1 : 0) : frame === 7 ? 1 : 0;
  const shirt = ['#35b9c0', '#ec8b51', '#9b7cc5', '#e9ca7c', '#f6e4bb'][variant],
    shade = ['#238191', '#be604e', '#69568f', '#b88a54', '#b4b39d'][variant],
    skin = '#cd8c60',
    light = '#f0b27b';
  p.ellipse(18, 51, 12, 3, '#2537513b');
  p.r(10, 34 + bob, 7, 13 + step, ink);
  p.r(20, 34 + bob, 7, 13 - step, ink);
  p.r(11, 35 + bob, 5, 10 + step, variant === 0 ? '#f7e3ba' : '#506b81');
  p.r(21, 35 + bob, 5, 10 - step, variant === 0 ? '#eac99e' : '#506b81');
  p.r(8, 46 + step, 9, 4, ink);
  p.r(20, 46 - step, 10, 4, ink);
  p.r(10, 46 + step, 6, 1, '#cc9f76');
  p.r(22, 46 - step, 6, 1, '#cc9f76');
  p.r(9, 20 + bob, 19, 17, ink);
  p.r(10, 20 + bob, 17, 16, shirt);
  p.r(11, 21 + bob, 3, 14, '#ffffff40');
  p.r(24, 22 + bob, 3, 14, shade);
  p.r(17, 22 + bob, 2, 13, variant === 0 ? '#b6f1cf' : '#f5dfba');
  p.r(17, 25 + bob, 1, 1, ink);
  p.r(17, 29 + bob, 1, 1, ink);
  p.r(6, 22 + bob + step / 2, 5, 16, ink);
  p.r(7, 23 + bob + step / 2, 4, 10, shirt);
  p.r(7, 32 + bob + step / 2, 4, 5, skin);
  p.r(27, 23 + bob - step / 2, 5, 15, ink);
  p.r(27, 23 + bob - step / 2, 4, 9, shade);
  p.r(27, 32 + bob - step / 2, 4, 5, skin);
  p.r(13, 15 + bob, 11, 7, skin);
  p.r(11, 6 + bob, 15, 13, ink);
  p.r(12, 7 + bob, 13, 12, skin);
  p.r(13, 8 + bob, 11, 10, light);
  p.r(11, 5 + bob, 14, 4, ink);
  p.r(9, 7 + bob, 4, 7, ink);
  p.r(23, 6 + bob, 4, 7, ink);
  p.r(12, 3 + bob, 11, 3, ink);
  p.r(14, 3 + bob, 9, 1, '#455470');
  if (dir === 3) {
    p.r(11, 6 + bob, 15, 10, ink);
    p.r(13, 14 + bob, 11, 3, '#364361');
  } else {
    const blink = frame === 7;
    const eye = dir === 1 ? 23 : dir === 2 ? 13 : 14;
    p.r(eye, 12 + bob, 2, blink ? 1 : 2, ink);
    if (dir === 0) p.r(21, 12 + bob, 2, blink ? 1 : 2, ink);
    p.r(dir === 1 ? 25 : dir === 2 ? 10 : 18, 15 + bob, 3, 2, '#ae684e');
    p.r(17, 18 + bob, 4, 1, '#704557');
    p.r(dir === 1 ? 24 : 12, 15 + bob, 2, 2, '#e29a6d');
  }
  if (variant === 0) {
    p.r(11, 19 + bob, 17, 3, '#e8675b');
    p.r(23, 21 + bob, 4, 9, '#e8675b');
    p.r(24, 22 + bob, 2, 2, '#ffdc9d');
    p.line(25, 22 + bob, 14, 35 + bob, '#574c57', 3);
    p.r(23, 32 + bob, 10, 9, ink);
    p.r(24, 32 + bob, 8, 7, '#d18a50');
    p.r(25, 33 + bob, 6, 2, '#f7c779');
  }
  if (variant === 2) {
    p.r(9, 3 + bob, 18, 7, '#60486f');
    p.r(9, 7 + bob, 4, 14, '#795a9c');
    p.r(25, 7 + bob, 4, 16, '#795a9c');
    p.r(11, 4 + bob, 14, 2, '#b28eca');
  }
  if (variant === 4) {
    p.r(10, 2 + bob, 17, 5, '#fff2cd');
    p.r(12, bob, 13, 3, '#faf1d9');
    p.r(12, 17 + bob, 12, 3, '#d3c3a5');
  }
  return p;
}
export function vehicleArt(cng: boolean): Pixel {
  const p = new Pixel(74, 53);
  // Grounding shadow, spoked wheels, hand-painted body and driver.
  p.ellipse(36, 48, 31, 3, '#334e514d');
  for (const x of cng ? [17, 57] : [14, 57]) {
    p.ellipse(x, 43, 9, 9, '#243c43');
    p.ellipse(x, 43, 6, 6, '#abb6a3');
    p.ellipse(x, 43, 4, 4, '#41605d');
    p.line(x - 5, 43, x + 5, 43, '#d0c9a6');
    p.line(x, 38, x, 48, '#d0c9a6');
    p.r(x - 1, 42, 3, 3, '#c5ad7c');
  }
  if (cng) {
    p.poly(
      [
        [7, 12],
        [48, 12],
        [65, 25],
        [66, 40],
        [5, 40],
      ],
      '#2a775c',
    );
    p.r(8, 11, 38, 4, '#3c8b67');
    p.poly(
      [
        [46, 15],
        [52, 17],
        [61, 27],
        [46, 27],
      ],
      '#a6c4ad',
    );
    p.r(47, 18, 3, 8, '#dae0bc');
    p.r(11, 17, 29, 18, '#1f524c');
    p.r(13, 18, 25, 13, '#598978');
    p.r(14, 19, 4, 10, '#a2bd99');
    p.r(26, 16, 2, 23, '#b6c2a1');
    p.r(8, 34, 35, 9, '#449566');
    p.r(7, 40, 58, 3, '#d1b66e');
    p.r(57, 29, 8, 5, '#edd590');
    p.r(60, 35, 8, 3, '#b9bb92');
    p.r(3, 34, 3, 7, '#cd6e51');
    p.r(4, 8, 46, 4, '#294d49');
    p.r(7, 6, 39, 3, '#3d5f53');
    p.r(9, 5, 35, 1, '#819579');
    p.r(14, 37, 13, 2, '#e5c97f');
    p.r(34, 20, 6, 7, '#a5724e');
    p.r(34, 18, 6, 3, '#30473b');
    p.r(32, 27, 9, 7, '#c4c399');
  } else {
    p.line(15, 41, 36, 26, '#d2b161', 2);
    p.line(36, 26, 57, 42, '#d2b161', 2);
    p.line(15, 41, 46, 41, '#d2b161', 2);
    p.line(46, 41, 42, 25, '#af734b', 2);
    p.line(42, 25, 54, 24, '#394f48', 2);
    p.r(6, 15, 29, 22, '#9d584e');
    p.r(8, 17, 25, 18, '#d7ac68');
    p.r(10, 20, 20, 11, '#285c58');
    p.r(11, 22, 18, 3, '#cc6e55');
    p.ellipse(21, 28, 5, 4, '#e4b75e');
    p.r(20, 24, 2, 8, '#54876b');
    p.poly(
      [
        [3, 15],
        [8, 4],
        [30, 4],
        [37, 15],
      ],
      '#b8554b',
    );
    p.poly(
      [
        [7, 13],
        [11, 6],
        [27, 6],
        [33, 13],
      ],
      '#e5a55a',
    );
    p.r(4, 14, 33, 3, '#315f55');
    for (let x = 10; x < 34; x += 6) p.r(x, 14, 2, 3, '#e4ce8a');
    p.r(38, 14, 7, 8, '#a9714e');
    p.r(38, 12, 7, 3, '#263d3a');
    p.r(36, 22, 9, 10, '#e2cf91');
    p.line(41, 30, 49, 39, '#43585d', 3);
    p.line(40, 32, 35, 40, '#43585d', 3);
    p.line(43, 24, 51, 25, '#a9714e', 2);
    p.r(34, 31, 10, 2, '#334d45');
  }
  return p;
}
export function roomArt(books = false): Pixel {
  const p = new Pixel(720, 520);
  p.r(0, 0, 720, 520, '#293e55');
  p.r(61, 30, 603, 463, '#1b2d49');
  p.r(72, 35, 576, 455, '#f6d19b');
  p.r(84, 45, 552, 146, books ? '#7baab1' : '#eeb770');
  for (let y = 47; y < 190; y += 14)
    for (let x = 85 + (y % 28 ? 13 : 0); x < 636; x += 28) {
      p.r(x, y, 25, 11, books ? '#8bbbbb' : '#f3c886');
      p.r(x, y, 22, 1, '#fff2bf40');
    }
  p.r(84, 191, 552, 291, books ? '#bb876e' : '#d9a776');
  for (let y = 198; y < 480; y += 22) {
    p.r(84, y, 552, 2, books ? '#976763' : '#b88769');
    for (let x = 84 + (y % 44 ? 38 : 0); x < 636; x += 80) p.r(x, y, 1, 22, '#996e6950');
  }
  p.r(74, 38, 10, 442, '#466e7b');
  p.r(636, 38, 10, 442, '#466e7b');
  p.r(74, 35, 572, 10, '#31576a');
  p.r(74, 45, 572, 3, '#fff0b5');
  p.r(73, 480, 574, 8, ink);
  p.r(322, 480, 76, 10, '#f6ce86');
  p.r(326, 490, 68, 5, '#a37363');
  if (books) {
    for (const [x, y, w, h] of [
      [95, 95, 90, 140],
      [510, 95, 90, 140],
      [225, 70, 250, 85],
    ]) {
      p.r(x - 4, y - 4, w + 8, h + 8, ink);
      p.r(x, y, w, h, '#a35e57');
      for (let sy = y + 8; sy < y + h; sy += 32) {
        for (let i = 0; i < w - 10; i += 8) {
          const ht = 15 + (i % 4) * 3;
          p.r(
            x + 6 + i,
            sy + 22 - ht,
            6,
            ht,
            ['#f2b662', '#70bbb2', '#bc8ab8', '#ed817a', '#ecdaa0'][i % 5],
          );
          p.r(x + 7 + i, sy + 25 - ht, 2, 1, '#fff0bb');
        }
        p.r(x + 3, sy + 24, w - 6, 4, '#ebbc7d');
        p.r(x + 3, sy + 28, w - 6, 2, '#694951');
      }
    }
    p.r(258, 157, 180, 59, '#805659');
    p.r(260, 163, 176, 47, '#a7675a');
    for (let x = 268; x < 430; x += 15) p.r(x, 168, 2, 37, '#bd8666');
    p.r(252, 155, 193, 10, '#f2c888');
    p.r(260, 164, 177, 3, '#64485b');
    p.r(285, 145, 31, 9, '#5b839c');
    p.r(281, 139, 32, 7, '#ec9c6b');
    p.r(325, 144, 32, 10, '#c47c9d');
    p.r(375, 141, 17, 14, '#e5d2a0');
    p.ellipse(271, 333, 45, 22, '#5c6d82');
    p.ellipse(270, 326, 43, 20, '#f0b47b');
    p.r(266, 338, 7, 35, ink);
    p.r(245, 315, 25, 14, '#fff0c2');
    p.r(248, 318, 20, 1, '#aca082');
    p.r(277, 318, 17, 12, '#dd7c7c');
    p.r(425, 336, 139, 65, '#476482');
    p.r(425, 332, 139, 16, '#6589a2');
    p.r(427, 353, 135, 10, '#a5c9b5');
    p.r(426, 398, 8, 12, ink);
    p.r(553, 398, 8, 12, ink);
    p.r(435, 345, 26, 23, '#e6a38a');
    p.r(526, 345, 26, 23, '#eac57e');
  } else {
    windowArt(p, 107, 75, 44, 65);
    windowArt(p, 552, 75, 44, 65);
    pot(p, 123, 159, true);
    p.r(213, 65, 112, 66, ink);
    p.r(218, 70, 102, 56, '#315b61');
    p.r(225, 80, 88, 2, '#c3dda2');
    p.r(225, 101, 66, 2, '#f0c789');
    p.r(225, 116, 66, 2, '#f0c789');
    p.r(348, 118, 177, 6, '#986652');
    for (let x = 351; x < 520; x += 24) {
      p.r(x, 91, 17, 26, '#d8dfa5');
      p.r(x, 88, 17, 4, '#e98962');
      p.r(x + 3, 96, 12, 18, '#bb8052');
      p.r(x + 3, 92, 3, 12, '#f6ecbd');
    }
    p.r(170, 150, 355, 45, '#8b5653');
    p.r(173, 155, 349, 36, '#bd7d58');
    for (let x = 181; x < 518; x += 22) {
      p.r(x, 157, 2, 32, '#e1a367');
      p.r(x + 5, 158, 1, 29, '#9d6250');
    }
    p.r(164, 143, 367, 12, '#ffdda0');
    p.r(170, 155, 355, 3, '#76505b');
    kettle(p, 478, 131);
    p.r(459, 141, 40, 4, '#3e5864');
    for (let x = 340; x < 443; x += 17) {
      p.r(x, 128, 11, 15, '#fff4cb');
      p.r(x + 2, 130, 7, 5, '#aa6040');
      p.r(x + 11, 131, 4, 7, '#ffe7ab');
    }
    crate(p, 190, 132, 76, 'spice');
    for (const [x, y] of [
      [166, 315],
      [526, 305],
    ]) {
      p.r(x - 4, y, 8, 42, ink);
      p.ellipse(x, y - 1, 47, 18, '#905952');
      p.ellipse(x, y - 5, 46, 17, '#efb774');
      p.r(x - 20, y - 12, 26, 13, '#fff0bf');
      for (let yy = y - 9; yy < y; yy += 3) p.r(x - 18, yy, 20, 1, '#c3ac89');
      p.r(x + 18, y - 13, 9, 13, '#fff0bd');
      p.r(x + 20, y - 12, 5, 5, '#a36843');
    }
    for (const [x, y] of [
      [116, 356],
      [211, 357],
      [481, 346],
      [571, 346],
    ]) {
      p.r(x - 7, y, 3, 18, ink);
      p.r(x + 5, y, 3, 18, ink);
      p.ellipse(x, y, 14, 6, '#a46c56');
      p.ellipse(x, y - 2, 14, 5, '#e1a66a');
    }
  }
  // Woven rugs and plants soften the room without narrowing the exit.
  p.r(304, 428, 112, 42, books ? '#456f82' : '#d48265');
  for (let x = 307; x < 414; x += 7) p.r(x, 430, 2, 37, books ? '#72a8a9' : '#ffd995');
  p.r(307, 432, 106, 4, '#f6d996');
  p.r(307, 462, 106, 4, '#f6d996');
  pot(p, 612, 450, true);
  pot(p, 105, 449, true);
  return p;
}
export function installArt(scene: Phaser.Scene) {
  const add = (key: string, p: Pixel) => scene.textures.addCanvas(key, p.canvas);
  add('ground', groundArt());
  BUILDINGS.forEach((b) => add(b.id, buildingArt(b)));
  add('tree', treeArt(45));
  add('tree2', treeArt(71));
  add('palm', palmArt());
  add('umbrella', umbrellaArt());
  add('stall-room', roomArt());
  add('books-room', roomArt(true));
  for (const room of ['stall', 'books']) {
    const source = roomArt(room === 'books');
    const overlay = new Pixel(room === 'stall' ? 367 : 193, room === 'stall' ? 52 : 61);
    overlay.c.drawImage(
      source.canvas,
      room === 'stall' ? 164 : 252,
      room === 'stall' ? 143 : 155,
      overlay.w,
      overlay.h,
      0,
      0,
      overlay.w,
      overlay.h,
    );
    add(`${room}-counter`, overlay);
  }
  for (let v = 0; v < 5; v++)
    for (let d = 0; d < 4; d++)
      for (let f = 0; f < 8; f++) add(`person-${v}-${d}-${f}`, heroArt(d, f, v));
  for (const kind of ['rickshaw', 'cng']) {
    const p = vehicleArt(kind === 'cng');
    const pixels = p.c.getImageData(0, 0, p.w, p.h);
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (!pixels.data[i + 3]) continue;
      const r = pixels.data[i],
        g = pixels.data[i + 1],
        b = pixels.data[i + 2];
      if (g > r * 1.15) {
        pixels.data[i] = Math.max(20, r - 10);
        pixels.data[i + 1] = Math.min(235, g * 1.3);
        pixels.data[i + 2] = Math.min(200, b * 1.1);
      } else if (r > g * 1.25) {
        pixels.data[i] = Math.min(255, r * 1.25);
        pixels.data[i + 1] = Math.min(210, g * 1.1);
      }
    }
    p.c.putImageData(pixels, 0, 0);
    add(kind, p);
  }
  const bus = new Pixel(132, 77);
  bus.ellipse(66, 70, 59, 5, shadow);
  bus.r(5, 12, 119, 49, ink);
  bus.r(8, 14, 113, 43, '#e1a844');
  bus.r(8, 14, 113, 9, '#f9d17d');
  bus.r(9, 39, 111, 9, '#d9585b');
  for (let x = 15; x < 117; x += 20) {
    bus.r(x, 25, 16, 17, '#244b6b');
    bus.poly(
      [
        [x + 2, 26],
        [x + 14, 26],
        [x + 2, 39],
      ],
      '#7ac4c3',
    );
  }
  bus.r(8, 52, 113, 4, '#ffe2a0');
  for (const x of [27, 101]) {
    bus.ellipse(x, 62, 11, 11, ink);
    bus.ellipse(x, 62, 6, 6, '#afc9c1');
    bus.ellipse(x, 62, 2, 2, '#4b6c7e');
  }
  bus.r(119, 48, 7, 6, '#fff0bb');
  add('bus', bus);
  const leaf = new Pixel(7, 6);
  leaf.poly(
    [
      [0, 3],
      [4, 0],
      [6, 2],
      [2, 5],
    ],
    '#eac66e',
  );
  leaf.r(2, 2, 2, 1, '#fff1ad');
  add('leaf', leaf);
  const cat = new Pixel(28, 24);
  cat.r(6, 9, 16, 10, ink);
  cat.r(7, 8, 14, 10, '#e79e63');
  cat.r(8, 5, 11, 9, '#f3b97c');
  cat.r(7, 2, 4, 6, '#e79e63');
  cat.r(16, 2, 4, 6, '#e79e63');
  cat.r(9, 9, 2, 2, ink);
  cat.r(16, 9, 2, 2, ink);
  cat.r(8, 18, 4, 4, ink);
  cat.r(17, 18, 4, 4, ink);
  cat.line(21, 15, 25, 6, '#e79e63', 3);
  add('cat', cat);
  const cup = new Pixel(13, 16);
  cup.r(2, 4, 9, 10, ink);
  cup.r(3, 5, 7, 8, cream);
  cup.r(4, 5, 5, 3, '#a05e41');
  cup.r(11, 6, 2, 5, cream);
  cup.r(4, 0, 1, 3, '#ffefc799');
  add('cup', cup);
}
