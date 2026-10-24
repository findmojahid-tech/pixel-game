/** Original, deterministic pixel artwork. Every solid is drawn on an integer grid. */
import Phaser from 'phaser';
export const COLORS = {
  ink: '#263c45',
  dark: '#193e40',
  leaf: '#306e56',
  mint: '#8fae72',
  cream: '#f8df9c',
  gold: '#edb45e',
  brick: '#ae655d',
};
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
function windowArt(p: Pixel, x: number, y: number, w = 18, h = 26, lit = false) {
  p.r(x - 2, y - 2, w + 4, h + 5, '#e4c392');
  p.r(x, y, w, h, '#294e56');
  p.r(x + 2, y + 2, w - 4, h - 4, lit ? '#e7bf76' : '#6b9192');
  p.r(x + 3, y + 3, 4, h - 6, lit ? '#f7d894' : '#a6b3a0');
  p.r(x + w / 2, y, 2, h, '#315654');
  p.r(x, y + h / 2, w, 2, '#315654');
  p.r(x - 4, y + h, w + 8, 3, '#827c68');
}
function pot(p: Pixel, x: number, y: number, flowers = false) {
  p.r(x - 6, y, 12, 3, '#d3976f');
  p.poly(
    [
      [x - 5, y + 3],
      [x + 5, y + 3],
      [x + 3, y + 12],
      [x - 3, y + 12],
    ],
    '#9c6251',
  );
  for (let i = -1; i <= 1; i++) {
    p.line(x, y, x + i * 5, y - 12 + Math.abs(i) * 3, '#3d7455', 2);
    p.ellipse(x + i * 5, y - 10 + Math.abs(i) * 3, 4, 2, '#719863');
    if (flowers) p.r(x + i * 5 - 1, y - 13 + Math.abs(i) * 3, 3, 3, '#e9b36f');
  }
}
function teaSign(p: Pixel, x: number, y: number) {
  p.r(x - 2, y - 2, 115, 32, '#294e47');
  p.r(x, y, 111, 28, '#e5c17d');
  p.r(x + 2, y + 2, 107, 24, '#265953');
  p.text('রহিম মামার চা', x + 55, y + 3, 15, '#f6d78f', 'center');
}
function roof(p: Pixel, x: number, y: number, w: number, color: string) {
  p.poly(
    [
      [x + 10, y],
      [x + w - 8, y],
      [x + w + 8, y + 22],
      [x - 10, y + 22],
    ],
    '#344f54',
  );
  p.poly(
    [
      [x + 10, y],
      [x + w - 8, y],
      [x + w + 5, y + 18],
      [x - 8, y + 18],
    ],
    color,
  );
  for (let i = 0; i < w + 10; i += 7) p.line(x + 9 + i, y + 1, x - 7 + i, y + 17, '#abb8a1');
  p.r(x - 10, y + 20, w + 20, 4, '#2b4748');
  p.r(x - 9, y + 19, w + 18, 1, '#e7c38a');
}
function shop(
  p: Pixel,
  x: number,
  y: number,
  w: number,
  h: number,
  wall: string,
  name: string,
  awning: string,
) {
  p.r(x + 7, y + 7, w, h, '#6a7668');
  p.r(x, y, w, h, wall);
  p.r(x + 4, y + 4, w - 8, 4, '#eac59a');
  for (let i = 0; i < 60; i++) {
    const rng = random(x * 100 + i);
    p.r(
      x + 5 + Math.floor(rng() * (w - 10)),
      y + 12 + Math.floor(rng() * (h - 20)),
      2 + Math.floor(rng() * 4),
      1,
      '#ffffff14',
    );
  }
  p.r(x - 4, y - 5, w + 8, 6, '#566d66');
  p.r(x - 1, y - 8, w + 2, 3, '#e9d5ad');
  for (let wx = x + 15; wx < x + w - 10; wx += 35) windowArt(p, wx, y + 17, 18, 25);
  p.r(x + 5, y + 58, w - 10, 8, '#6d7664');
  p.r(x + 7, y + 60, w - 14, 2, '#ead4a5');
  p.r(x + 8, y + 80, w - 16, h - 80, '#294546');
  p.r(x + 10, y + 79, w - 20, 23, '#e7bd75');
  p.r(x + 12, y + 81, w - 24, 19, '#355e53');
  p.text(name, x + w / 2, y + 83, 13, '#f5dd9c', 'center');
  p.poly(
    [
      [x + 1, y + 103],
      [x + w - 1, y + 103],
      [x + w + 8, y + 116],
      [x - 8, y + 116],
    ],
    awning,
  );
  for (let ax = x; ax < x + w; ax += 14) {
    p.poly(
      [
        [ax, y + 103],
        [ax + 7, y + 103],
        [ax + 7, y + 116],
        [ax - 4, y + 116],
      ],
      '#f5d7a0',
    );
    p.r(ax - 4, y + 116, 11, 4, awning);
  }
  p.r(x - 8, y + 119, w + 16, 3, '#234646');
  p.r(x + 2, y + 121, 3, h - 121, '#ba8c6a');
  p.r(x + w - 5, y + 121, 3, h - 121, '#ba8c6a');
}
export function streetArt(): Pixel {
  const p = new Pixel(1800, 360),
    rng = random(71);
  const sky = ['#9eb8ae', '#afc2b0', '#c6cdb4', '#dbd2b5', '#ebd7b1', '#f2d6ad'];
  sky.forEach((color, i) => p.r(0, i * 22, 1800, 23, color));
  p.r(0, 132, 1800, 98, '#a9b6a0');
  p.ellipse(1050, 50, 23, 23, '#f6d69a');
  p.ellipse(1050, 50, 17, 17, '#ffe5ac');
  // Wispy clouds, layered old Dhaka rooftops, water tanks and slender minarets.
  for (let x = 0; x < 1800; x += 180) {
    p.r(x + 15, 29 + (x % 43), 64, 2, '#e1d9b9');
    p.r(x + 42, 25 + (x % 43), 55, 3, '#d4d4b6');
  }
  for (let x = 0; x < 1800; x += 31) {
    const h = 22 + Math.floor(rng() * 64);
    p.r(x, 137 - h, 30, h + 80, '#91a699');
    p.r(x + 3, 134 - h, 24, 3, '#b5bda2');
    for (let wy = 143 - h; wy < 145; wy += 10)
      for (let wx = x + 4; wx < x + 27; wx += 9) p.r(wx, wy, 3, 5, '#7f9c92');
    if (x % 3 === 0) {
      p.r(x + 7, 127 - h, 13, 10, '#8ba195');
      p.r(x + 9, 123 - h, 9, 4, '#91a699');
    }
  }
  p.r(1170, 46, 9, 100, '#91a699');
  p.ellipse(1174, 45, 6, 5, '#91a699');
  p.r(1173, 28, 2, 12, '#91a699');
  p.ellipse(1220, 91, 21, 17, '#91a699');
  // Pavement, shadows and asphalt in restrained, warm purple.
  p.r(0, 225, 1800, 43, '#c2b19a');
  p.r(0, 225, 1800, 5, '#929c88');
  p.r(0, 260, 1800, 5, '#e5cba5');
  p.r(0, 266, 1800, 69, '#677278');
  p.r(0, 266, 1800, 3, '#415c61');
  for (let y = 230; y < 262; y += 10) {
    p.r(0, y, 1800, 1, '#a69f8e');
    for (let x = (y % 20) * 3; x < 1800; x += 33) p.r(x, y, 1, 10, '#b0a590');
  }
  for (let x = 8; x < 1800; x += 42) p.r(x, 300, 20, 2, '#d0c4a4');
  for (let i = 0; i < 1800; i++) {
    const x = Math.floor(rng() * 1800),
      y = 270 + Math.floor(rng() * 60);
    p.r(x, y, 1 + Math.floor(rng() * 3), 1, rng() > 0.5 ? '#7b8181' : '#606b73');
  }
  p.r(0, 335, 1800, 25, '#697e65');
  p.r(0, 335, 1800, 3, '#c1b89a');
  for (let x = 0; x < 1800; x += 18) {
    p.r(x, 337, 14, 3, '#e1c69c');
    p.r(x + 14, 337, 4, 3, '#6b7366');
  }
  // Western bookshop and weathered rose apartment.
  shop(p, 35, 75, 115, 156, '#c5937a', 'বইঘর', '#9a6356');
  p.r(45, 202, 96, 25, '#24474a');
  for (let x = 48; x < 137; x += 5) {
    const h = 10 + Math.floor(rng() * 10);
    p.r(x, 225 - h, 3, h, ['#d2aa70', '#719c88', '#b77b66'][x % 3]);
  }
  p.r(43, 226, 99, 3, '#d3b087');
  shop(p, 173, 48, 144, 185, '#c28378', 'মদিনা স্টোর', '#326d67');
  p.r(185, 108, 122, 12, '#5b7970');
  for (let x = 188; x < 308; x += 8) p.r(x, 101, 2, 18, '#ddc39b');
  p.r(182, 100, 130, 2, '#f3d0a4');
  for (let x = 188; x < 303; x += 22) {
    p.r(x, 191, 17, 37, '#75978a');
    for (let y = 194; y < 226; y += 4) p.r(x + 1, y, 15, 1, '#476d65');
  }
  p.r(272, 36, 23, 12, '#557572');
  p.r(270, 33, 27, 4, '#365d5b');
  p.r(277, 47, 2, 7, '#39595b');
  // Balcony laundry.
  p.line(182, 124, 300, 126, '#3a5755');
  ['#e6b864', '#c66354', '#ece0b2', '#537f8f'].forEach((c, i) => {
    p.r(190 + i * 25, 125, 15, 16, c);
    p.r(188 + i * 25, 126, 19, 5, c);
  });
  // Fruit seller, piled mangoes, bananas and woven baskets.
  shop(p, 348, 94, 130, 139, '#d3b174', 'ফল ভান্ডার', '#bc6551');
  p.r(358, 212, 109, 18, '#90694c');
  p.r(356, 208, 113, 5, '#d3a26b');
  for (let i = 0; i < 40; i++) {
    const x = 362 + (i % 13) * 8,
      y = 206 - Math.floor(i / 13) * 5;
    p.ellipse(x, y, 4, 3, i < 20 ? '#e8bc59' : '#8eae62');
    p.r(x, y - 3, 1, 2, '#44664b');
  }
  p.r(362, 232, 3, 10, '#5e5f49');
  p.r(458, 232, 3, 10, '#5e5f49');
  // Rahim Mama's hero tea stall: terracotta brick, deep turquoise timber and tin roof.
  const tx = 563,
    ty = 115;
  p.r(tx + 4, ty + 3, 193, 122, '#42554a');
  p.r(tx, ty, 190, 118, '#ac7960');
  for (let y = ty + 3; y < ty + 118; y += 7)
    for (let x = tx + (y % 2) * 9; x < tx + 188; x += 19) {
      p.r(x, y, 16, 5, (x + y) % 3 ? '#b98567' : '#c4926c');
      p.r(x, y + 5, 18, 1, '#866c56');
    }
  p.r(tx + 10, ty + 33, 170, 82, '#244b48');
  p.r(tx + 14, ty + 37, 165, 74, '#1f3e3d');
  // Open doorway and shadow, green shutters, a warm glimpse of the room.
  p.r(635, 161, 41, 74, '#193936');
  p.r(639, 165, 34, 68, '#bc9060');
  p.r(641, 166, 30, 67, '#705b43');
  p.r(642, 166, 6, 67, '#c49d69');
  p.r(649, 168, 21, 23, '#304c3e');
  p.r(648, 192, 23, 4, '#d7ad73');
  p.r(649, 196, 20, 36, '#73664b');
  p.r(638, 234, 39, 4, '#ead1a0');
  p.r(634, 238, 46, 3, '#927d5b');
  p.r(574, 166, 54, 52, '#578e77');
  for (let x = 578; x < 626; x += 6) p.r(x, 168, 2, 48, '#356957');
  p.r(683, 165, 60, 52, '#477e68');
  for (let x = 686; x < 742; x += 6) p.r(x, 168, 2, 47, '#2b594e');
  p.r(572, 217, 59, 6, '#d6b780');
  p.r(681, 216, 64, 6, '#d6b780');
  // Counter with kettle, glass cups, biscuits.
  p.r(578, 197, 46, 4, '#d8b67e');
  p.r(579, 184, 10, 13, '#d5ae70');
  p.r(580, 182, 8, 2, '#efd9a2');
  p.r(581, 187, 6, 5, '#a7744d');
  for (let x = 594; x < 623; x += 7) {
    p.r(x, 190, 5, 7, '#e9c991');
    p.r(x + 1, 191, 3, 3, '#9e6642');
  }
  p.ellipse(704, 200, 8, 6, '#a8b7a0');
  p.r(698, 191, 12, 10, '#c4cab1');
  p.r(699, 189, 10, 3, '#e5dcc0');
  p.line(710, 195, 717, 191, '#b1bfac', 2);
  p.r(696, 193, 2, 7, '#596e66');
  roof(p, tx - 6, ty - 18, 204, '#608b85');
  teaSign(p, 602, 136);
  // Scalloped fabric awning over entry.
  p.poly(
    [
      [555, 160],
      [761, 160],
      [774, 175],
      [544, 175],
    ],
    '#b9664c',
  );
  for (let x = 552; x < 768; x += 19) {
    p.poly(
      [
        [x, 160],
        [x + 9, 160],
        [x + 11, 175],
        [x - 4, 175],
      ],
      '#e4c38b',
    );
    p.r(x - 4, 175, 15, 4, '#d8b17b');
    p.r(x + 11, 175, 5, 3, '#a95343');
  }
  p.r(550, 178, 3, 57, '#4a6655');
  p.r(766, 178, 3, 58, '#4a6655');
  p.r(580, 232, 39, 4, '#705540');
  p.r(583, 236, 3, 9, '#4b5140');
  p.r(612, 236, 3, 9, '#4b5140');
  pot(p, 748, 227, true);
  // Faded posters and Bengali wall painting.
  p.r(784, 143, 104, 89, '#b5a58a');
  p.r(788, 147, 96, 80, '#c5b394');
  p.text('ধীরে চলুন', 837, 157, 14, '#9b6451', 'center');
  p.text('ঢাকা', 837, 180, 24, '#516e63', 'center');
  p.r(795, 213, 82, 2, '#997c60');
  p.r(785, 197, 16, 25, '#e0c28d');
  p.r(788, 201, 10, 3, '#ac6851');
  p.r(788, 207, 10, 1, '#85755b');
  shop(p, 923, 61, 166, 172, '#8ca494', 'সোনার বাংলা হোটেল', '#b98755');
  for (let i = 0; i < 4; i++) {
    pot(p, 939 + i * 42, 114);
    p.r(926 + i * 42, 127, 34, 1, '#486e60');
  }
  p.r(929, 128, 151, 3, '#e1c39c');
  shop(p, 1123, 85, 128, 148, '#c0a788', 'সাইকেল মেরামত', '#6b8c77');
  p.r(1138, 205, 94, 25, '#304c45');
  for (let x = 1150; x < 1230; x += 40) {
    p.ellipse(x, 227, 11, 11, '#263f41');
    p.ellipse(x, 227, 8, 8, '#a9b29b');
    p.ellipse(x, 227, 6, 6, '#45695b');
    p.line(x, 227, x + 18, 211, '#d6ad6d', 2);
    p.line(x + 18, 211, x + 28, 227, '#c69864', 2);
  }
  shop(p, 1310, 56, 142, 177, '#bb8b73', 'নূর ফার্মেসি', '#658b7b');
  p.r(1371, 145, 17, 5, '#eee0b0');
  p.r(1377, 139, 5, 17, '#eee0b0');
  shop(p, 1510, 92, 154, 141, '#d5b984', 'মিষ্টি মুখ', '#a36054');
  // Utility poles, sagging cables, paper bunting and hand-painted details.
  for (const x of [320, 898, 1480]) {
    p.r(x, 54, 5, 199, '#5e6a60');
    p.r(x + 1, 54, 1, 194, '#a5a081');
    p.r(x - 11, 70, 28, 3, '#6c7463');
    p.r(x - 8, 65, 4, 8, '#c4bea0');
    p.r(x + 10, 65, 4, 8, '#c4bea0');
    p.r(x - 3, 129, 12, 18, '#7c8571');
    p.r(x - 1, 132, 8, 7, '#b5ac88');
  }
  for (let offset = 0; offset < 3; offset++)
    for (let x = 0; x < 1800; x++) {
      const local = (x - 320) % 578;
      const sag = 17 * Math.sin((local / 578) * Math.PI);
      p.r(x, 69 + offset * 5 + Math.floor(sag), 1, 1, '#405c59');
    }
  for (let x = 350; x < 875; x++) {
    const y = 94 + Math.floor(15 * Math.sin(((x - 350) / 525) * Math.PI));
    p.r(x, y, 1, 1, '#667b64');
    if (x % 32 === 0)
      p.poly(
        [
          [x, y + 1],
          [x + 9, y + 2],
          [x + 5, y + 13],
        ],
        ['#d9b25e', '#cd7f63', '#7c9d78'][Math.floor(x / 32) % 3],
      );
  }
  // Bangladesh flag, gently notched silhouette.
  p.r(1019, 23, 2, 39, '#596e5e');
  p.poly(
    [
      [1021, 24],
      [1055, 28],
      [1053, 46],
      [1021, 42],
    ],
    '#23765b',
  );
  p.ellipse(1038, 35, 6, 6, '#c55b4e');
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(rng() * 1800);
    if (rng() > 0.7) {
      p.r(x, 258, 3, 1, '#846e52');
      p.r(x + 2, 257, 2, 1, '#a2855d');
    }
  }
  return p;
}
export function treeArt(seed: number, palm = false): Pixel {
  const p = new Pixel(106, 150),
    rng = random(seed);
  if (palm) {
    p.poly(
      [
        [49, 145],
        [57, 145],
        [63, 54],
        [57, 47],
      ],
      '#7c8261',
    );
    for (let y = 65; y < 143; y += 7)
      p.line(52 + (140 - y) / 15, y, 59 + (140 - y) / 15, y - 2, '#b0a477');
    const fronds = [
      [6, 58],
      [13, 29],
      [33, 16],
      [67, 13],
      [96, 32],
      [105, 61],
      [83, 74],
      [35, 70],
    ];
    for (const [x, y] of fronds) {
      p.line(60, 47, x, y, '#346d55', 3);
      for (let j = 0; j < 14; j++) {
        const t = j / 14;
        const fx = 60 + (x - 60) * t,
          fy = 47 + (y - 47) * t;
        p.line(fx, fy, fx - 5 + Math.sign(x - 60) * 8, fy + 12, '#45815d', 2);
        p.line(fx, fy, fx + Math.sign(x - 60) * 4, fy + 6, '#71965f');
      }
    }
    p.ellipse(59, 50, 4, 5, '#8d9163');
    p.ellipse(64, 52, 3, 4, '#827e50');
  } else {
    p.poly(
      [
        [41, 148],
        [57, 148],
        [54, 76],
        [49, 58],
        [44, 80],
      ],
      '#5e644c',
    );
    p.r(46, 85, 3, 59, '#9c8a59');
    p.line(47, 100, 24, 69, '#5c644b', 5);
    p.line(50, 90, 76, 58, '#5c644b', 5);
    for (let i = 0; i < 38; i++) {
      const x = 15 + rng() * 76,
        y = 20 + rng() * 63;
      p.ellipse(
        x,
        y,
        12 + rng() * 10,
        10 + rng() * 9,
        ['#355f4e', '#407455', '#57855b', '#6c965f'][Math.floor(rng() * 4)],
      );
    }
    for (let i = 0; i < 140; i++) {
      const x = 10 + rng() * 86,
        y = 15 + rng() * 72;
      if (p.c.getImageData(x, y, 1, 1).data[3])
        p.r(x, y, 2 + Math.floor(rng() * 3), 1, rng() > 0.4 ? '#82a369' : '#2e654e');
    }
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
export function personArt(dir: number, frame: number, seller = false): Pixel {
  const p = new Pixel(24, 34);
  const moving = frame > 0;
  const step = moving ? (frame === 1 ? -2 : frame === 3 ? 2 : 0) : 0;
  const bob = moving && frame % 2 ? 1 : 0;
  const skin = '#b77e54',
    light = '#d49b6b',
    shirt = seller ? '#e6d7ae' : '#d5a34f',
    shade = seller ? '#b8b38c' : '#b67d3d',
    trousers = seller ? '#608e7e' : '#375e65';
  p.ellipse(12, 31, 7, 2, '#243f453b');
  if (seller) {
    p.r(7, 22 + bob, 11, 8, trousers);
    for (let y = 23; y < 30; y += 3) p.r(7, y, 11, 1, '#a2b69a');
  } else {
    p.r(7, 22 + bob, 5, 7 + step, trousers);
    p.r(13, 22 + bob, 5, 7 - step, trousers);
  }
  p.r(6, 28 + step, 6, 3, '#334440');
  p.r(13, 28 - step, 6, 3, '#334440');
  p.r(7, 28 + step, 4, 1, '#ab9065');
  p.r(14, 28 - step, 4, 1, '#ab9065');
  p.r(7, 12 + bob, 11, 12, shirt);
  p.r(7, 13 + bob, 2, 10, shade);
  p.r(17, 14 + bob, 2, 10, shade);
  p.r(11, 13 + bob, 1, 9, seller ? '#b5b08e' : '#f0cb75');
  if (dir === 0 || dir === 3) {
    p.r(5, 14 + bob + step / 2, 3, 9, skin);
    p.r(5, 14 + bob + step / 2, 3, 4, shirt);
    p.r(18, 14 + bob - step / 2, 3, 9, skin);
    p.r(18, 14 + bob - step / 2, 3, 4, shirt);
  } else {
    p.r(9, 14 + bob, 4, 10, shade);
    p.r(9, 19 + bob, 3, 5, skin);
  }
  p.r(9, 10 + bob, 7, 4, skin);
  p.r(7, 3 + bob, 11, 8, skin);
  p.r(8, 5 + bob, 9, 7, light);
  p.r(dir === 1 ? 17 : 6, 7 + bob, 3, 3, skin);
  p.r(7, 2 + bob, 11, 4, '#263c37');
  p.r(6, 4 + bob, 3, 5, '#263c37');
  p.r(17, 4 + bob, 2, 4, '#263c37');
  p.r(9, 1 + bob, 7, 2, '#263c37');
  if (dir === 3) {
    p.r(7, 3 + bob, 11, 7, '#263c37');
    p.r(8, 9 + bob, 9, 2, '#354d41');
  } else {
    p.r(dir === 1 ? 16 : dir === 2 ? 8 : 9, 7 + bob, 1, 2, '#273e38');
    if (dir === 0) p.r(15, 7 + bob, 1, 2, '#273e38');
    p.r(dir === 1 ? 17 : dir === 2 ? 6 : 12, 9 + bob, 2, 1, '#8d593d');
  }
  if (seller) {
    p.r(7, 1 + bob, 11, 3, '#f3e6c4');
    p.r(8, bob, 9, 2, '#e0d4af');
    p.r(8, 10 + bob, 8, 2, '#d3c7aa');
  } else {
    p.line(16, 12 + bob, 10, 23 + bob, '#4c6655', 2);
    p.r(14, 21 + bob, 7, 6, '#647d57');
    p.r(15, 21 + bob, 5, 1, '#9ea46b');
  }
  return p;
}
export function interiorArt(): Pixel {
  const p = new Pixel(640, 360),
    rng = random(123);
  p.r(0, 0, 640, 360, '#163b3b');
  // Open cutaway room, warm plaster and timber joinery.
  p.r(144, 36, 352, 277, '#243f3c');
  p.r(152, 42, 336, 269, '#cba77a');
  p.r(160, 48, 320, 138, '#d1b282');
  p.r(160, 174, 320, 13, '#9f805b');
  for (let y = 49; y < 175; y += 7)
    for (let x = 161 + (y % 2) * 7; x < 479; x += 22) {
      p.r(x, y, 19, 5, '#c9a77b');
      p.r(x + 2, y + 1, 4, 1, '#d9bc8e');
    }
  p.poly(
    [
      [152, 187],
      [488, 187],
      [488, 318],
      [152, 318],
    ],
    '#ac936e',
  );
  for (let y = 190; y < 313; y += 18) {
    p.r(154, y, 332, 1, '#8e7e60');
    for (let x = 154 + (y % 36 ? 16 : 0); x < 488; x += 33) {
      p.line(x, y, x - 6, y + 17, '#8e7e60');
      p.r(x + 6, y + 4, 2, 1, '#c0a17a');
    }
  }
  p.r(151, 39, 7, 270, '#66806a');
  p.r(482, 39, 7, 270, '#66806a');
  p.r(151, 36, 338, 9, '#597561');
  p.r(157, 45, 325, 3, '#e2c493');
  // Shuttered window with an actual view outside.
  p.r(175, 69, 67, 74, '#736c4e');
  p.r(179, 73, 59, 66, '#749b86');
  p.r(183, 77, 51, 58, '#e0cda1');
  p.r(183, 113, 51, 22, '#5d8266');
  p.r(183, 102, 51, 12, '#93af80');
  p.r(206, 75, 3, 63, '#4c7160');
  p.r(181, 102, 55, 3, '#4c7160');
  p.r(170, 72, 11, 68, '#3d7763');
  p.r(237, 72, 11, 68, '#3d7763');
  for (let y = 76; y < 138; y += 5) {
    p.r(171, y, 8, 1, '#7c9c78');
    p.r(239, y, 8, 1, '#7c9c78');
  }
  p.r(172, 141, 73, 5, '#b18c60');
  pot(p, 186, 134, true);
  // Menu board, family portrait, calendar, radio.
  p.r(273, 62, 89, 63, '#6a6148');
  p.r(276, 65, 83, 57, '#2f5145');
  p.text('আজকের চা', 317, 70, 11, '#ead7a1', 'center');
  p.text('দুধ চা   ১৫ টাকা', 282, 88, 9, '#e6d3a0');
  p.text('লেবু চা  ১০ টাকা', 282, 103, 9, '#d5c694');
  p.r(394, 61, 29, 35, '#735b43');
  p.r(397, 64, 23, 29, '#e0bf88');
  p.r(401, 68, 15, 20, '#7e946e');
  p.ellipse(408, 74, 4, 4, '#a57951');
  p.r(402, 79, 13, 10, '#d4c18b');
  p.r(440, 73, 24, 33, '#e9d7ad');
  p.r(440, 73, 24, 8, '#a56047');
  p.text('২৪', 452, 85, 12, '#685a44', 'center');
  p.r(270, 137, 196, 5, '#694f3d');
  p.r(275, 142, 3, 9, '#725b42');
  p.r(455, 142, 3, 9, '#725b42');
  for (let x = 279; x < 390; x += 19) {
    p.r(x, 115, 13, 21, '#b9b997');
    p.r(x, 113, 13, 3, '#c38d55');
    p.r(x + 2, 122, 9, 11, x % 2 ? '#ac7d4e' : '#ddbd77');
    p.r(x + 2, 117, 3, 5, '#e1d9b4');
  }
  p.r(407, 121, 44, 15, '#775b42');
  p.r(409, 123, 20, 11, '#b9aa7d');
  for (let x = 411; x < 428; x += 3) p.r(x, 125, 1, 7, '#685d48');
  p.ellipse(442, 129, 3, 3, '#d5c695');
  p.line(445, 121, 453, 109, '#8c9679');
  // Long counter, glass display, stove, kettle and tiled backsplash.
  p.r(264, 181, 209, 39, '#70573d');
  p.r(267, 186, 203, 31, '#9f744b');
  for (let x = 272; x < 470; x += 16) {
    p.r(x, 187, 1, 28, '#b98e5d');
    p.r(x + 3, 190, 1, 22, '#876344');
  }
  p.r(259, 177, 218, 8, '#dfc18c');
  p.r(261, 184, 214, 3, '#584d39');
  p.r(273, 148, 54, 28, '#698b78');
  p.r(275, 151, 50, 23, '#90a58a');
  p.r(277, 153, 46, 18, '#beaf7f');
  for (let y = 158; y < 171; y += 8)
    for (let x = 279; x < 323; x += 9) {
      p.ellipse(x + 3, y, 3, 2, '#dfbd73');
      p.r(x + 1, y, 1, 1, '#ad8855');
    }
  p.r(299, 150, 2, 24, '#dde1ba');
  p.r(273, 148, 54, 3, '#e2d4a6');
  p.r(414, 168, 42, 8, '#405b4c');
  p.ellipse(435, 166, 13, 3, '#ce8d4b');
  p.r(425, 150, 20, 15, '#a2b0a0');
  p.ellipse(435, 150, 10, 3, '#d3d4b7');
  p.ellipse(435, 165, 10, 3, '#768c7b');
  p.r(430, 146, 10, 3, '#7c9580');
  p.line(445, 155, 453, 149, '#bac6ac', 3);
  p.line(424, 151, 418, 154, '#546e5b', 2);
  p.line(418, 154, 419, 162, '#546e5b', 2);
  for (let x = 343; x < 401; x += 10) {
    p.r(x, 166, 7, 10, '#ebd9a9');
    p.r(x + 1, 167, 5, 5, '#a97847');
    p.r(x + 7, 168, 2, 5, '#d7ca9e');
  }
  // Small ceiling fan, bamboo shade, warm hanging bulb.
  p.r(317, 46, 2, 13, '#53674f');
  p.ellipse(318, 60, 5, 3, '#8b906b');
  p.poly(
    [
      [315, 60],
      [283, 55],
      [283, 59],
      [316, 63],
    ],
    '#738565',
  );
  p.poly(
    [
      [319, 60],
      [349, 61],
      [350, 65],
      [319, 63],
    ],
    '#738565',
  );
  p.r(386, 45, 1, 32, '#5a684d');
  p.poly(
    [
      [386, 72],
      [372, 84],
      [400, 84],
    ],
    '#a8814b',
  );
  p.r(373, 84, 26, 3, '#dec58c');
  p.ellipse(386, 89, 3, 4, '#f9dfa0');
  // Tea tables, stools, newspaper, cups, woven floor mat.
  p.ellipse(221, 260, 29, 11, '#73634b');
  p.r(218, 262, 4, 26, '#6c5940');
  p.ellipse(221, 254, 30, 12, '#bf9863');
  p.ellipse(221, 252, 27, 10, '#d1ac73');
  p.r(210, 248, 15, 7, '#e1d0a1');
  for (let y = 249; y < 255; y += 2) p.r(212, y, 10, 1, '#9f9c7e');
  p.r(230, 247, 5, 6, '#ece0b8');
  p.r(231, 248, 3, 3, '#9f7044');
  for (const [x, y] of [
    [194, 278],
    [245, 279],
    [219, 231],
    [419, 261],
    [449, 275],
  ]) {
    p.r(x - 5, y, 2, 11, '#5f5d43');
    p.r(x + 4, y, 2, 11, '#5f5d43');
    p.ellipse(x, y, 9, 4, '#b18e5b');
    p.r(x - 5, y - 2, 10, 1, '#d0ad73');
  }
  p.r(290, 291, 62, 19, '#948660');
  for (let x = 292; x < 351; x += 4) p.r(x, 292, 1, 16, '#c9ac77');
  p.r(290, 292, 62, 2, '#467360');
  p.r(290, 306, 62, 2, '#467360');
  p.r(298, 313, 44, 7, '#d8bd88');
  p.r(300, 320, 40, 4, '#a68e66');
  for (let i = 0; i < 100; i++) {
    const x = 160 + Math.floor(rng() * 319),
      y = 190 + Math.floor(rng() * 120);
    p.r(x, y, 1, 1, '#dbc08b19');
  }
  pot(p, 462, 232);
  return p;
}
export function installArt(scene: Phaser.Scene) {
  const add = (key: string, p: Pixel) => scene.textures.addCanvas(key, p.canvas);
  add('street', streetArt());
  const room = interiorArt();
  add('interior', room);
  const front = new Pixel(218, 44);
  front.c.drawImage(room.canvas, 259, 177, 218, 44, 0, 0, 218, 44);
  add('counter-front', front);
  add('rickshaw', vehicleArt(false));
  add('cng', vehicleArt(true));
  add('tree', treeArt(42));
  add('palm', treeArt(51, true));
  for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) add(`player-${d}-${f}`, personArt(d, f));
  add('seller', personArt(0, 0, true));
  const leaf = new Pixel(5, 4);
  leaf.r(1, 1, 3, 1, '#b9ae6a');
  leaf.r(0, 2, 3, 1, '#9d9c5b');
  add('leaf', leaf);
}
