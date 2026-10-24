/** District geometry is shared by rendering, collision, saves and route tests. */
export type Place = 'district' | 'stall' | 'books';
export type ZoneId = 'courtyard' | 'bazaar' | 'crossing' | 'residential' | 'stall' | 'books';
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Building extends Rect {
  id: string;
  name: string;
  bn: string;
  style: 'tea' | 'books' | 'house' | 'fruit' | 'fish' | 'spice' | 'flowers' | 'depot';
  color: string;
  roof: string;
  door?: Place;
}
export const SIZE = { w: 1920, h: 1400 };
export const ZONES: { id: ZoneId; name: string; bn: string; tag: string; x: number; y: number }[] =
  [
    {
      id: 'courtyard',
      name: 'Cha-er Adda',
      bn: 'চায়ের আড্ডা',
      tag: 'THE TEA COURTYARD',
      x: 480,
      y: 420,
    },
    {
      id: 'bazaar',
      name: 'Shapla Bazaar',
      bn: 'শাপলা বাজার',
      tag: 'COLOURS, CALLS & EVERYDAY STORIES',
      x: 1450,
      y: 420,
    },
    {
      id: 'crossing',
      name: 'Rickshaw Crossing',
      bn: 'রিকশার মোড়',
      tag: 'THE LONG WAY HOME',
      x: 480,
      y: 950,
    },
    {
      id: 'residential',
      name: 'Bakul Lane',
      bn: 'বকুল গলি',
      tag: 'A QUIETER CORNER OF DHAKA',
      x: 1430,
      y: 1080,
    },
    {
      id: 'stall',
      name: 'Rahim Mama’s',
      bn: 'রহিম মামার চা',
      tag: 'ONE CUP, A THOUSAND STORIES',
      x: 360,
      y: 350,
    },
    {
      id: 'books',
      name: 'The Reading Room',
      bn: 'পাতার পর পাতা',
      tag: 'A STORY TO TAKE WITH YOU',
      x: 360,
      y: 350,
    },
  ];
export const BUILDINGS: Building[] = [
  {
    id: 'west-house',
    x: 40,
    y: 70,
    w: 198,
    h: 230,
    name: 'Bakul House',
    bn: 'বকুল নিবাস',
    style: 'house',
    color: '#efb26a',
    roof: '#d25472',
  },
  {
    id: 'tea',
    x: 344,
    y: 93,
    w: 272,
    h: 232,
    name: 'RAHIM MAMA’S',
    bn: 'রহিম মামার চা',
    style: 'tea',
    color: '#f3b764',
    roof: '#1c9c9b',
    door: 'stall',
  },
  {
    id: 'pink-house',
    x: 690,
    y: 40,
    w: 218,
    h: 236,
    name: 'A little way home',
    bn: 'আমাদের পাড়া',
    style: 'house',
    color: '#ec8796',
    roof: '#6157a3',
  },
  {
    id: 'books',
    x: 1150,
    y: 75,
    w: 248,
    h: 246,
    name: 'THE READING ROOM',
    bn: 'পাতার পর পাতা',
    style: 'books',
    color: '#8fcba2',
    roof: '#ce635d',
    door: 'books',
  },
  {
    id: 'fruit',
    x: 1520,
    y: 140,
    w: 160,
    h: 178,
    name: 'MANGO & MORE',
    bn: 'মধুমাস ফলঘর',
    style: 'fruit',
    color: '#ffd479',
    roof: '#df7153',
  },
  {
    id: 'fish',
    x: 1690,
    y: 385,
    w: 174,
    h: 170,
    name: 'FRESH FROM THE RIVER',
    bn: 'নদীর মাছ',
    style: 'fish',
    color: '#91caca',
    roof: '#548ad6',
  },
  {
    id: 'spice',
    x: 1090,
    y: 470,
    w: 150,
    h: 148,
    name: 'A LITTLE SPICE',
    bn: 'মসলার হাট',
    style: 'spice',
    color: '#eda66a',
    roof: '#a75b9d',
  },
  {
    id: 'flowers',
    x: 740,
    y: 450,
    w: 125,
    h: 138,
    name: 'BLOOMS OF BENGAL',
    bn: 'ফুলের হাসি',
    style: 'flowers',
    color: '#edb8a2',
    roof: '#e86b80',
  },
  {
    id: 'depot',
    x: 90,
    y: 694,
    w: 218,
    h: 143,
    name: 'RICKSHAW REPAIRS',
    bn: 'রিকশা মেরামত',
    style: 'depot',
    color: '#f3b65c',
    roof: '#5377b6',
  },
  {
    id: 'south-house',
    x: 75,
    y: 1138,
    w: 220,
    h: 210,
    name: 'The corner shop',
    bn: 'মোড়ের দোকান',
    style: 'house',
    color: '#92cfa4',
    roof: '#cb6671',
  },
  {
    id: 'residence-a',
    x: 1110,
    y: 665,
    w: 214,
    h: 189,
    name: 'Bakul Lane',
    bn: 'বকুল গলি',
    style: 'house',
    color: '#b6a4dc',
    roof: '#367e9f',
  },
  {
    id: 'residence-b',
    x: 1560,
    y: 653,
    w: 240,
    h: 210,
    name: 'Home, sweet home',
    bn: 'শান্তি নীড়',
    style: 'house',
    color: '#f0b36f',
    roof: '#ba576b',
  },
  {
    id: 'residence-c',
    x: 1090,
    y: 1170,
    w: 225,
    h: 192,
    name: 'Afternoon stories',
    bn: 'দুপুরের গল্প',
    style: 'house',
    color: '#e68b8b',
    roof: '#467e9d',
  },
  {
    id: 'residence-d',
    x: 1650,
    y: 1150,
    w: 215,
    h: 208,
    name: 'Our neighbourhood',
    bn: 'আমাদের বাড়ি',
    style: 'house',
    color: '#8cc9b7',
    roof: '#7e64a8',
  },
];
export const TREES = [
  { x: 265, y: 430 },
  { x: 675, y: 375 },
  { x: 75, y: 540 },
  { x: 930, y: 135 },
  { x: 990, y: 620 },
  { x: 1428, y: 165 },
  { x: 1810, y: 110 },
  { x: 1530, y: 640 },
  { x: 1445, y: 1210 },
  { x: 360, y: 1275 },
  { x: 645, y: 1180 },
  { x: 1820, y: 1080 },
  { x: 1000, y: 1320 },
];
export const PROPS: Rect[] = [
  { x: 360, y: 465, w: 105, h: 16 },
  { x: 515, y: 500, w: 88, h: 16 },
  { x: 1490, y: 471, w: 72, h: 30 },
  { x: 1455, y: 1070, w: 86, h: 20 },
  { x: 735, y: 1140, w: 203, h: 163 },
  { x: 1472, y: 533, w: 78, h: 26 },
  { x: 1046, y: 613, w: 78, h: 26 },
  { x: 818, y: 710, w: 64, h: 18 },
  { x: 340, y: 782, w: 70, h: 10 },
  { x: 592, y: 802, w: 70, h: 10 },
  { x: 692, y: 770, w: 70, h: 10 },
];
export const obstacles: Record<Place, Rect[]> = {
  district: [
    ...BUILDINGS.map((b) => ({ x: b.x + 5, y: b.y + 29, w: b.w - 10, h: b.h - 29 })),
    ...TREES.map((t) => ({ x: t.x - 7, y: t.y - 8, w: 14, h: 11 })),
    ...PROPS,
  ],
  stall: [
    { x: 170, y: 145, w: 355, h: 50 },
    { x: 124, y: 300, w: 84, h: 38 },
    { x: 485, y: 290, w: 80, h: 38 },
  ],
  books: [
    { x: 425, y: 336, w: 139, h: 65 },
    { x: 95, y: 95, w: 90, h: 140 },
    { x: 510, y: 95, w: 90, h: 140 },
    { x: 258, y: 157, w: 180, h: 59 },
    { x: 235, y: 310, w: 70, h: 50 },
  ],
};
export const roomBounds: Record<Place, Rect> = {
  district: { x: 22, y: 40, w: 1876, h: 1338 },
  stall: { x: 91, y: 197, w: 538, h: 270 },
  books: { x: 91, y: 235, w: 538, h: 232 },
};
export function blocked(place: Place, x: number, y: number): boolean {
  const b = roomBounds[place];
  if (x < b.x || y < b.y || x > b.x + b.w || y > b.y + b.h) return true;
  return obstacles[place].some(
    (o) => x + 8 > o.x && x - 8 < o.x + o.w && y > o.y && y - 6 < o.y + o.h,
  );
}
export function zoneAt(x: number, y: number, place: Place): ZoneId {
  return place !== 'district'
    ? place
    : y < 650
      ? x < 960
        ? 'courtyard'
        : 'bazaar'
      : x < 960
        ? 'crossing'
        : 'residential';
}
export const DOORS = { stall: { x: 480, y: 342 }, books: { x: 1274, y: 338 } };
export interface Person {
  id: string;
  name: string;
  bn: string;
  x: number;
  y: number;
  variant: number;
  route?: { x: number; y: number }[];
  line: string;
  translation: string;
}
export const PEOPLE: Person[] = [
  {
    id: 'flower',
    name: 'Rupa · flower seller',
    bn: 'রূপা',
    x: 806,
    y: 620,
    variant: 2,
    line: 'তাজা বেলি ফুল! বকুল গলির দিকে গেলে আরও সুন্দর বাগান পাবেন।',
    translation: 'Fresh jasmine! Walk down Bakul Lane and you’ll find a lovely garden.',
  },
  {
    id: 'fruit',
    name: 'Jamal · fruit seller',
    bn: 'জামাল',
    x: 1570,
    y: 351,
    variant: 1,
    line: 'মিষ্টি আম দেখেন! আর পশ্চিমের বইঘরে গেলে নীলা আপার সঙ্গে দেখা হবে।',
    translation: 'Look at these sweet mangoes! Nila runs the reading room just to the west.',
  },
  {
    id: 'driver',
    name: 'Salam · rickshaw driver',
    bn: 'সালাম',
    x: 455,
    y: 797,
    variant: 3,
    line: 'এই মোড় থেকে পুরো পাড়াটা ঘুরতে পারবেন। উত্তরে চায়ের দোকান, পুবে বকুল গলি।',
    translation:
      'You can roam the whole neighbourhood from here. Tea to the north, Bakul Lane to the east.',
  },
  {
    id: 'grandma',
    name: 'Hasina · neighbour',
    bn: 'হাসিনা খালা',
    x: 1460,
    y: 1110,
    variant: 2,
    line: 'বিকেলের হাওয়ায় একটু বসো বাবা। এই বকুলগাছটা আমার ছোটবেলার সঙ্গী।',
    translation:
      'Sit a while in the afternoon breeze. This bakul tree has been here since I was a girl.',
  },
  {
    id: 'rahim',
    name: 'Rahim Mama',
    bn: 'রহিম মামা',
    x: 414,
    y: 183,
    variant: 4,
    line: 'আসেন ভাই! একটু বসেন। গরম চা দিই?',
    translation: 'Come in! Take a seat. Shall I make you a hot cup of tea?',
  },
  {
    id: 'nila',
    name: 'Nila · bookseller',
    bn: 'নীলা আপা',
    x: 432,
    y: 260,
    variant: 2,
    line: 'একটা গল্প সঙ্গে নিয়ে যান। এই বুকমার্কটা রাখুন, আবার আসবেন কিন্তু!',
    translation: 'Take a little story with you. Here’s a bookmark — come back again!',
  },
  ...Array.from({ length: 12 }, (_, i) => {
    const paths = [
      [
        { x: 350, y: 535 },
        { x: 630, y: 535 },
      ],
      [
        { x: 1320, y: 405 },
        { x: 1500, y: 405 },
      ],
      [
        { x: 400, y: 1090 },
        { x: 650, y: 1090 },
      ],
      [
        { x: 1390, y: 965 },
        { x: 1390, y: 1290 },
      ],
      [
        { x: 930, y: 450 },
        { x: 930, y: 760 },
      ],
      [
        { x: 1740, y: 600 },
        { x: 1500, y: 600 },
      ],
    ];
    const path = paths[i % paths.length];
    return {
      id: `walker-${i}`,
      name: ['A neighbour', 'A student', 'On the way home'][i % 3],
      bn: 'পাড়ার মানুষ',
      x: i >= 6 ? (path[0].x + path[1].x) / 2 : path[i % 2].x,
      y: i >= 6 ? (path[0].y + path[1].y) / 2 : path[i % 2].y,
      variant: 1 + (i % 3),
      route: path,
      line: [
        'ভালো আছেন? এই পাড়ায় সবাই সবাইকে চেনে।',
        'বাজারটা ঘুরে দেখেন, কত রঙ!',
        'চা খাওয়া হয়েছে? রহিম মামার চা কিন্তু দারুণ!',
      ][i % 3],
      translation: [
        'Doing well? Everyone knows each other around here.',
        'Have a look around the bazaar. So many colours!',
        'Had your tea yet? Rahim Mama makes a lovely cup.',
      ][i % 3],
    };
  }),
];

export const DIRECTION_SIGNS = [
  { id: 'market-turn', x: 912, y: 332, w: 140, bn: 'বাজার →', name: 'BAZAAR >' },
  { id: 'lane-turn', x: 1400, y: 615, w: 140, bn: 'বকুল গলি ↓', name: 'BAKUL LANE' },
  { id: 'tea-turn', x: 510, y: 698, w: 140, bn: 'চায়ের আড্ডা ↑', name: 'TEA COURTYARD' },
];
