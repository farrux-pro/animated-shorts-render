// "GTA Six took 13 years" - first 10 s test. Timed to shorts/gta6/words.json (edge-tts, Andrew).
// Words: Six 0.64 | school 3.71 | September 2013 4.51 | Grand 6.76 | comes 7.86 | out 8.15 | Phones 8.88 | buttons 9.64
export const FPS = 30;
export const TOTAL = 312;
export type V3 = [number, number, number];
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz: number; sunEl: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 133, light: "golden", sunAz: 35, sunEl: 14 },  // street, queue at the game store
  { id: 2, a: 133, b: 262, light: "day", sunAz: 150, sunEl: 55 },  // 2013 bedroom: calendar -> kid with the box
  { id: 3, a: 262, b: TOTAL, light: "day", sunAz: 150, sunEl: 55 }, // phone with a home button
];
export const FLASH_AT = 133;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
/** springy pop 0 -> 1 with overshoot */
export const pop = (u: number) => { const x = clamp01(u); return 1 - Math.cos(x * 7) * Math.exp(-x * 5.5); };
const L = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// places
export const ROOM_X = 100; // the bedroom sits 100 m east of the street

export type Cam = { pos: V3; look: V3; fov: number; roll: number; near: number };
export const camAt = (f: number): Cam => {
  const s = shotAt(f);
  if (s.id === 1) {
    // crane down from the neon sign to the queue, slow push, a small roll on "school"
    const k = glide((f - 8) / 70), p = (f - s.a) / (s.b - s.a);
    const pos = L([0.6, 6.2, 9.5], [-0.4, 1.7, 6.2 - 0.9 * p], k);
    const look = L([0, 5.2, -5.5], [-0.6, 1.25, -4.2], k);
    const roll = -0.05 * glide((f - 100) / 26);
    return { pos, look, fov: 40, roll, near: 0.2 };
  }
  if (s.id === 2) {
    // insert on the calendar, then pull back and swing to the kid as "Grand Theft Auto Five" starts
    const k = glide((f - 190) / 30);
    const cal: V3 = [ROOM_X - 1.6, 1.75, -2.97];
    const p0: V3 = [ROOM_X - 1.45, 1.7, -1.75], l0: V3 = cal;
    const p1: V3 = [ROOM_X + 0.7, 1.35, 3.2], l1: V3 = [ROOM_X + 0.15, 1.05, -1.2];
    const creep = (f - s.a) * 0.0025;
    const pos = L([p0[0], p0[1], p0[2] + 0.1 - creep], [p1[0], p1[1], p1[2] - (f - 220) * 0.004], k);
    const look = L(l0, l1, k);
    // a kick on "out" (frame 244)
    const kf = f - 243, kick = kf >= 0 && kf < 7 ? (kf % 2 ? -1 : 1) * 0.012 * (1 - kf / 7) : 0;
    return { pos, look, fov: 40, roll: kick, near: 0.05 };
  }
  // phone insert: slow push toward the home button
  const u = (f - s.a) / (s.b - s.a);
  const ph = PHONE;
  return { pos: [ph[0] + 0.05 - 0.04 * u, ph[1] + 0.12 - 0.02 * u, ph[2] + 0.42 - 0.12 * glide(u)], look: [ph[0], ph[1] + 0.02, ph[2]], fov: 38, roll: 0.04 - 0.03 * u, near: 0.02 };
};
/** phone on the desk (centre of the screen) */
export const PHONE: V3 = [ROOM_X + 1.55, 0.895, -1.95];

/** depth of field: blur radius at infinity in px (1080 scale) and the focus point */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const s = shotAt(f), c = camAt(f);
  if (s.id === 1) return { cInf: 6 + 4 * glide((f - 8) / 70), focus: c.look };
  if (s.id === 2) return { cInf: 12, focus: f < 205 ? [ROOM_X - 1.6, 1.75, -2.97] : [ROOM_X + 0.15, 1.25, -1.2] };
  return { cInf: 16, focus: PHONE };
};
