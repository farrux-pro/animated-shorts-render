// 3D city test (economy short, 0..9.6 s). Voice: shorts/gta6c/words.json
// "GTA Six is finally here. And America might not show up to work." (0-4.6)
// "One survey says nearly one in five office workers planned to take launch day off." (4.6-9.6)
export const FPS = 30;
export const TOTAL = 288;
export type V3 = [number, number, number];
export type ShotDef = { id: number; a: number; b: number; light: "day" | "golden"; sunAz: number; sunEl: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 138, light: "day", sunAz: 120, sunEl: 40 },   // Vice City street: chase the taxi, crane up to the GTA VI store
  { id: 2, a: 138, b: TOTAL, light: "day", sunAz: 140, sunEl: 45 }, // office tower: workers walk in, one turns back
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const L = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const OFFICE_X = 300;
/** the taxi drives down the street toward -z */
export const taxiZ = (f: number) => 34 - f * 0.32;
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export const camAt = (f: number): Cam => {
  const s = shotAt(f);
  if (s.id === 1) {
    const z = taxiZ(f), k = glide((f - 60) / 70);
    const chasePos: V3 = [-1.6, 2.6, z + 8.5], chaseLook: V3 = [0.6, 1.2, z - 12];
    const cranePos: V3 = [-3.5, 9.5, -14], craneLook: V3 = [12, 6.5, -42];
    return { pos: L(chasePos, cranePos, k), look: L(chaseLook, craneLook, k), fov: 50, roll: 0.03 * Math.sin(f / 30) * (1 - k) };
  }
  const u = (f - s.a) / (s.b - s.a);
  return { pos: [OFFICE_X - 5 + 2 * u, 2.4 + 0.6 * u, 17 - 4 * glide(u)], look: [OFFICE_X + 6, 3.2, -2], fov: 46, roll: 0 };
};
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const s = shotAt(f), c = camAt(f);
  if (s.id === 1) return { cInf: 4, focus: f < 70 ? [0, 1, taxiZ(f)] : c.look };
  return { cInf: 6, focus: [OFFICE_X + 3, 1.5, 4] };
};
