// Character drawer v2: storybook cartoon people to match the Flow backgrounds (thick plum ink, two-tone cel shade).
// Design space: origin at the feet centre, y up is negative, an adult is ~900 units tall. Hands reach target points
// with two-bone IK, so props are really held.
type P = [number, number];
type G = CanvasRenderingContext2D;

export const INK = "#2a1a2e";
const SKINS = ["#ffd9bf", "#f2c29b", "#d9a07a", "#a8714f"];
export type Hair = "short" | "spiky" | "long" | "ponytail" | "bald" | "bob";
export type Hat = null | "cap" | "hardhat" | "army" | "pilot" | "beanie";
export type Look = {
  skin?: number; hair: Hair; hairCol: string; hat?: Hat; hatCol?: string;
  shirt: string; pants: string; shoes: string; jacket?: string; tie?: string; dress?: string;
  fem?: boolean; moustache?: string; kid?: boolean; stout?: boolean;
};
export type Expr = "neutral" | "smile" | "grin" | "laugh" | "shock" | "sad" | "angry" | "nervous" | "smug" | "sick";
export type Pose = {
  expr?: Expr; blink?: boolean; talk?: boolean; look?: number; tilt?: number; lean?: number;
  lh?: P; rh?: P;               // hand targets (design units); default: hanging at the sides
  sit?: boolean; walk?: number; // walk phase 0..1
  bob?: number;                 // breathing / bounce offset
  hold?: (g: G) => void;        // prop drawn between the body and the hands
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
/** fill a path with base colour, a cel shadow on the side away from the light (light from top-left), ink outline */
const part = (g: G, path: Path2D, col: string, lw = 7, sh = 0.8, cx = 0, cy = 0, r = 200) => {
  g.fillStyle = col; g.fill(path);
  g.save(); g.clip(path); g.fillStyle = shade(col, sh); g.beginPath(); g.ellipse(cx + r * 0.95, cy + r * 0.55, r * 1.05, r * 1.25, -0.5, 0, 7); g.fill(); g.restore();
  g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(path);
};
const ell = (x: number, y: number, rx: number, ry: number, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
const rr = (x: number, y: number, w: number, h: number, r: number) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
/** thick limb from a to b (round caps) drawn as an outlined tube */
const limb = (g: G, pts: P[], w: number, col: string) => {
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = INK; g.lineWidth = w + 12; g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q); g.stroke();
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q); g.stroke();
  g.strokeStyle = shade(col, 0.82); g.lineWidth = w * 0.35; g.beginPath(); g.moveTo(pts[0][0] + w * 0.25, pts[0][1]); for (const q of pts.slice(1)) g.lineTo(q[0] + w * 0.25, q[1]); g.stroke();
};
/** two-bone IK: elbow for shoulder s, hand target t, bone lengths a, b; bend away from the body (side = -1 left, 1 right) */
const ik = (s: P, t: P, a: number, b: number, side: number): [P, P] => {
  let dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy);
  const max = a + b - 1; if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const h: P = [s[0] + dx, s[1] + dy];
  const ca = (a * a + d * d - b * b) / (2 * a * d), ang = Math.atan2(dy, dx), off = Math.acos(Math.max(-1, Math.min(1, ca)));
  const e = ang + off * (side > 0 ? -1 : 1);
  return [[s[0] + Math.cos(e) * a, s[1] + Math.sin(e) * a], h];
};
const hand = (g: G, p: P, r: number, skin: string) => {
  part(g, ell(p[0], p[1], r, r * 0.92), skin, 6, 0.85, p[0], p[1], r);
};

export const drawPerson = (g: G, L: Look, o: Pose = {}) => {
  const k = L.kid ? 0.72 : 1, skin = SKINS[L.skin ?? 0];
  const bob = o.bob ?? 0, sit = !!o.sit;
  const hipY = (sit ? -215 : -330) * k + bob * 0.4, shY = (sit ? -470 : -590) * k + bob, headY = shY - 140 * k * (L.kid ? 1.05 : 1);
  const HR = (L.kid ? 112 : 118) * (L.kid ? 1 : 1), bw = (L.stout ? 118 : L.fem ? 82 : 95) * k;
  g.save(); g.lineJoin = "round";
  const lean = o.lean ?? 0; g.rotate(lean);
  // ---- hair behind (long / ponytail) ----
  const hx = 0, hy = headY;
  if (L.hair === "long" && L.hat !== "hardhat") {
    const p = new Path2D();
    p.moveTo(hx - HR * 1.08, hy - 10); p.bezierCurveTo(hx - HR * 1.4, hy + HR * 0.9, hx - HR * 1.35, hy + HR * 2.0, hx - HR * 0.75, hy + HR * 2.1);
    p.lineTo(hx + HR * 0.75, hy + HR * 2.1); p.bezierCurveTo(hx + HR * 1.35, hy + HR * 2.0, hx + HR * 1.4, hy + HR * 0.9, hx + HR * 1.08, hy - 10);
    p.arc(hx, hy - 10, HR * 1.08, 0, Math.PI, true); p.closePath();
    part(g, p, L.hairCol, 7, 0.78, hx, hy, HR * 1.5);
  }
  if (L.hair === "ponytail") { const p = ell(hx + HR * 0.95, hy - HR * 0.1, HR * 0.35, HR * 0.75, 0.5); part(g, p, L.hairCol, 7, 0.78, hx + HR, hy, HR * 0.6); }
  // ---- legs + shoes ----
  const w = o.walk ?? -1, swing = w >= 0 ? Math.sin(w * Math.PI * 2) : 0;
  for (const s of [-1, 1]) {
    const hip: P = [s * 38 * k * (L.stout ? 1.2 : 1), hipY];
    const lift = w >= 0 ? Math.max(0, -swing * s) * 40 * k : 0;
    const foot: P = sit ? [s * 62 * k, -10] : [s * 46 * k + (w >= 0 ? swing * s * 26 * k : 0), -12 - lift];
    const knee: P = sit ? [s * 58 * k, hipY + 30] : [(hip[0] + foot[0]) / 2 + s * 4, (hip[1] + foot[1]) / 2];
    if (!(L.dress && !sit)) limb(g, [hip, knee, foot], 50 * k, L.pants);
    else limb(g, [[hip[0], hipY + 90 * k], knee, foot], 30 * k, skin);
    const sh = ell(foot[0] + s * 10 * k, foot[1] + 4, 42 * k, 22 * k, 0);
    part(g, sh, L.shoes, 6, 0.8, foot[0], foot[1], 40);
  }
  // ---- torso ----
  const t = new Path2D();
  const top = shY - 10 * k, bot = hipY + 30 * k, wb = bw * (L.stout ? 1.12 : 0.92);
  t.moveTo(-bw + 20, top); t.quadraticCurveTo(-bw - 8, top + 10, -bw - 4, top + 60 * k); t.lineTo(-wb, bot - 20); t.quadraticCurveTo(-wb, bot, -wb + 25, bot);
  t.lineTo(wb - 25, bot); t.quadraticCurveTo(wb, bot, wb, bot - 20); t.lineTo(bw + 4, top + 60 * k); t.quadraticCurveTo(bw + 8, top + 10, bw - 20, top); t.closePath();
  if (L.dress) {
    const d = new Path2D(); d.moveTo(-bw + 10, top); d.lineTo(bw - 10, top); d.lineTo(bw * 1.45, (sit ? hipY + 40 : hipY + 120) * 1); d.quadraticCurveTo(0, (sit ? hipY + 60 : hipY + 140), -bw * 1.45, sit ? hipY + 40 : hipY + 120); d.closePath();
    part(g, d, L.dress, 7, 0.8, 0, shY + 150, 200);
  } else part(g, t, L.shirt, 7, 0.8, 0, shY + 150, 200);
  if (L.jacket) {
    for (const s of [-1, 1]) {
      const j = new Path2D(); j.moveTo(s * 18, top); j.lineTo(s * (bw - 18), top); j.quadraticCurveTo(s * (bw + 8), top + 10, s * (bw + 4), top + 60 * k);
      j.lineTo(s * wb, bot - 10); j.lineTo(s * 30, bot - 10); j.lineTo(s * 26, top + 90 * k); j.closePath();
      part(g, j, L.jacket, 7, 0.78, s * 60, shY + 150, 160);
    }
  }
  if (L.tie) { const ti = new Path2D(); ti.moveTo(-12, top + 6); ti.lineTo(12, top + 6); ti.lineTo(18, top + 150 * k); ti.lineTo(0, top + 175 * k); ti.lineTo(-18, top + 150 * k); ti.closePath(); part(g, ti, L.tie, 5, 0.8, 0, top + 80, 60); }
  // neck
  part(g, rr(-26 * k, shY - 34 * k, 52 * k, 40 * k, 12), skin, 6, 0.85, 0, shY, 30);
  // ---- prop (between body and hands) ----
  if (o.hold) { g.save(); o.hold(g); g.restore(); }
  // ---- arms (IK to the hand targets) ----
  const sl = 120 * k, fl = 118 * k;
  for (const s of [-1, 1]) {
    const S: P = [s * (bw - 6), shY + 22 * k];
    const T: P = (s < 0 ? o.lh : o.rh) ?? [s * (bw + 30 * k), hipY + 10 * k + (w >= 0 ? swing * -s * 14 : 0)];
    const [E, Hn] = ik(S, T, sl, fl, s);
    limb(g, [S, E, Hn], 40 * k, L.jacket ?? L.shirt);
    hand(g, Hn, 27 * k, skin);
  }
  // ---- head ----
  g.save(); g.translate(hx, hy + 40); g.rotate(o.tilt ?? 0); g.translate(-hx, -(hy + 40));
  for (const s of [-1, 1]) part(g, ell(hx + s * HR * 0.98, hy + 8, 24, 30), skin, 6, 0.85, hx + s * HR, hy, 30);
  part(g, ell(hx, hy, HR, HR * 0.95), skin, 8, 0.86, hx, hy, HR);
  face(g, hx, hy, HR, L, o);
  hairTop(g, hx, hy, HR, L);
  g.restore();
  g.restore();
};

const face = (g: G, x: number, y: number, R: number, L: Look, o: Pose) => {
  const e = o.expr ?? "smile", lk = (o.look ?? 0) * 7, ey = y + 4;
  // blush
  g.fillStyle = L.fem ? "rgba(255,120,150,.45)" : "rgba(255,130,120,.25)";
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * R * 0.58, y + R * 0.32, R * 0.16, R * 0.09, 0, 0, 7); g.fill(); }
  // eyes
  const happy = e === "laugh" || (e === "grin" && !L.fem && false);
  for (const s of [-1, 1]) {
    const cx = x + s * R * 0.36;
    g.lineWidth = 6; g.strokeStyle = INK; g.lineCap = "round";
    if (o.blink || happy || e === "sick") {
      g.beginPath(); if (happy) g.arc(cx, ey + 6, R * 0.13, Math.PI * 1.1, Math.PI * 1.9); else g.arc(cx, ey - 4, R * 0.13, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    } else {
      const rx = R * (e === "shock" ? 0.19 : 0.16), ry = R * (e === "shock" ? 0.23 : 0.2);
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx, ey, rx, ry, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(cx + lk, ey + 3, rx * (e === "shock" ? 0.45 : 0.62), 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(cx + lk - rx * 0.22, ey - ry * 0.25, rx * 0.2, 0, 7); g.fill();
      if (L.fem) { g.lineWidth = 5; for (const a of [0, 1]) { g.beginPath(); g.moveTo(cx + s * rx * (0.55 + a * 0.3), ey - ry * (0.8 - a * 0.2)); g.lineTo(cx + s * rx * (0.95 + a * 0.35), ey - ry * (1.25 - a * 0.25)); g.stroke(); } }
    }
    // brows
    const by = ey - R * 0.36, tilt = e === "angry" ? 0.35 : e === "sad" || e === "nervous" || e === "sick" ? -0.3 : e === "shock" ? 0 : e === "smug" ? (s > 0 ? 0.2 : -0.1) : 0;
    const lift = e === "shock" ? -14 : e === "laugh" || e === "grin" ? -6 : 0;
    g.lineWidth = L.fem ? 7 : 10; g.strokeStyle = L.hair === "bald" ? INK : shade(L.hairCol, 0.6);
    g.beginPath(); g.moveTo(cx - R * 0.15, by + lift + s * tilt * -14); g.quadraticCurveTo(cx, by + lift - 8, cx + R * 0.15, by + lift + s * tilt * 14); g.stroke();
  }
  // nose
  g.lineWidth = 5; g.strokeStyle = shade("#c08a6a", 0.9); g.beginPath(); g.arc(x + 3, y + R * 0.2, R * 0.08, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
  if (L.moustache) { g.fillStyle = L.moustache; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * R * 0.16, y + R * 0.38, R * 0.2, R * 0.08, s * 0.25, 0, 7); g.fill(); } }
  // mouth
  const my = y + R * 0.52, open = o.talk;
  g.lineWidth = 6; g.strokeStyle = INK;
  const opened = (w: number, h: number) => {
    g.fillStyle = "#6a1a2a"; g.beginPath(); g.ellipse(x, my, w, h, 0, 0, Math.PI); g.lineTo(x - w, my); g.closePath(); g.fill(); g.stroke();
    g.save(); g.clip(); g.fillStyle = "#ff7a8a"; g.beginPath(); g.ellipse(x, my + h, w * 0.6, h * 0.5, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.fillRect(x - w, my - 2, w * 2, h * 0.28); g.restore();
  };
  if (e === "laugh") opened(R * 0.32, R * 0.3);
  else if (e === "grin") opened(R * 0.28, R * 0.2);
  else if (e === "shock") { g.fillStyle = "#6a1a2a"; g.beginPath(); g.ellipse(x, my + 6, R * 0.12, R * 0.17, 0, 0, 7); g.fill(); g.stroke(); }
  else if (open) opened(R * 0.18, R * 0.14);
  else if (e === "sad" || e === "sick") { g.beginPath(); g.arc(x, my + 18, R * 0.16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (e === "nervous") { g.beginPath(); for (let i = 0; i <= 8; i++) g.lineTo(x - R * 0.2 + i * R * 0.05, my + (i % 2 ? 5 : -5)); g.stroke(); }
  else if (e === "angry") { g.beginPath(); g.moveTo(x - R * 0.16, my + 6); g.lineTo(x + R * 0.16, my + 2); g.stroke(); }
  else if (e === "smug") { g.beginPath(); g.moveTo(x - R * 0.14, my + 2); g.quadraticCurveTo(x + R * 0.05, my + 10, x + R * 0.2, my - 8); g.stroke(); }
  else { g.beginPath(); g.arc(x, my - 10, R * (e === "neutral" ? 0.1 : 0.2), Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  if (L.fem && !open && (e === "smile" || e === "neutral" || e === "smug")) { g.strokeStyle = "#d24a6a"; g.lineWidth = 4; g.beginPath(); g.arc(x, my - 10, R * 0.12, Math.PI * 0.25, Math.PI * 0.75); g.stroke(); }
  if (e === "sick") { g.fillStyle = "rgba(120,200,120,.25)"; g.beginPath(); g.ellipse(x, y + R * 0.1, R * 0.8, R * 0.5, 0, 0, 7); g.fill(); }
  if (e === "nervous") { g.fillStyle = "#9fd4ff"; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(x + R * 0.75, y - R * 0.45, 10, 16, 0, 0, 7); g.fill(); g.stroke(); }
};

const hairTop = (g: G, x: number, y: number, R: number, L: Look) => {
  const c = L.hairCol;
  const cap = (yCut: number, bumps: number, amp: number) => {
    const p = new Path2D(); const a0 = Math.PI * 1.03, a1 = Math.PI * 1.97;
    p.moveTo(x + Math.cos(a0) * R * 1.04, y + Math.sin(a0) * R * 1.04 + yCut);
    p.arc(x, y, R * 1.06, a0, a1);
    const xr = x + Math.cos(a1) * R * 1.04, xl = x + Math.cos(a0) * R * 1.04, yb = y - R * 0.38;
    p.lineTo(xr, yb + yCut);
    for (let i = 1; i <= bumps; i++) { const f = i / bumps, px = xr + (xl - xr) * f; p.quadraticCurveTo(px + (xl - xr) / bumps * -0.5, yb + amp, px, yb + (i === bumps ? yCut : 0)); }
    p.closePath(); return p;
  };
  if (L.hat === "hardhat" || L.hat === "cap" || L.hat === "army" || L.hat === "pilot" || L.hat === "beanie") {
    const hc = L.hatCol ?? "#e0303a";
    if (L.hair !== "bald") { const side = cap(10, 3, 18); part(g, side, c, 7, 0.78, x, y - R, R); }
    if (L.hat === "hardhat") {
      const d = new Path2D(); d.arc(x, y - R * 0.3, R * 1.0, Math.PI, 0); d.closePath(); part(g, d, hc, 8, 0.82, x, y - R, R);
      part(g, rr(x - R * 1.2, y - R * 0.36, R * 2.4, R * 0.18, 10), hc, 7, 0.8, x, y - R * 0.3, R);
      part(g, rr(x - R * 0.12, y - R * 1.28, R * 0.24, R * 0.92, 8), shade(hc, 1.1), 5, 0.85, x, y - R, 40);
    } else if (L.hat === "cap" || L.hat === "army") {
      const d = new Path2D(); d.arc(x, y - R * 0.32, R * 1.02, Math.PI, 0); d.closePath(); part(g, d, hc, 8, 0.8, x, y - R, R);
      if (L.hat === "cap") part(g, ell(x + R * 0.25, y - R * 0.32, R * 0.85, R * 0.16, 0.05), shade(hc, 0.9), 7, 0.8, x, y - R * 0.3, R);
      else part(g, rr(x - R * 1.04, y - R * 0.4, R * 2.08, R * 0.16, 8), shade(hc, 0.85), 6, 0.8, x, y - R * 0.3, R);
    } else if (L.hat === "pilot") {
      const d = new Path2D(); d.moveTo(x - R * 1.0, y - R * 0.4); d.lineTo(x - R * 1.15, y - R * 1.05); d.quadraticCurveTo(x, y - R * 1.35, x + R * 1.15, y - R * 1.05); d.lineTo(x + R * 1.0, y - R * 0.4); d.closePath();
      part(g, d, hc, 8, 0.8, x, y - R, R);
      part(g, ell(x, y - R * 0.38, R * 1.05, R * 0.15), "#1a1a1a", 7, 0.8, x, y - R * 0.38, R);
      part(g, ell(x, y - R * 0.78, R * 0.18, R * 0.12), "#e8c45a", 5, 0.85, x, y - R * 0.78, 20);
    } else { // beanie
      const d = new Path2D(); d.arc(x, y - R * 0.3, R * 1.04, Math.PI, 0); d.closePath(); part(g, d, hc, 8, 0.8, x, y - R, R);
      part(g, rr(x - R * 1.08, y - R * 0.48, R * 2.16, R * 0.26, 14), shade(hc, 0.85), 7, 0.8, x, y - R * 0.4, R);
    }
    return;
  }
  if (L.hair === "bald") {
    for (const s of [-1, 1]) part(g, ell(x + s * R * 0.92, y - R * 0.15, R * 0.2, R * 0.35, s * 0.3), c, 6, 0.8, x + s * R, y, 40);
    return;
  }
  if (L.hair === "spiky") {
    const p = new Path2D(); p.moveTo(x - R * 1.05, y - R * 0.25);
    for (let i = 0; i <= 7; i++) { const a = Math.PI + (i / 7) * Math.PI, r2 = i % 2 ? R * 1.38 : R * 1.04; p.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2 - R * 0.05); }
    p.lineTo(x + R * 1.05, y - R * 0.25); p.quadraticCurveTo(x, y - R * 0.55, x - R * 1.05, y - R * 0.25); p.closePath();
    part(g, p, c, 7, 0.78, x, y - R, R); return;
  }
  if (L.hair === "long" || L.hair === "bob" || L.hair === "ponytail") {
    // smooth top with a side part and a soft swoop over the forehead
    const p = new Path2D(); p.moveTo(x - R * 1.08, y + R * 0.05); p.arc(x, y - R * 0.02, R * 1.08, Math.PI * 1.02, Math.PI * 1.98);
    p.lineTo(x + R * 1.06, y + R * 0.1); p.quadraticCurveTo(x + R * 0.9, y - R * 0.45, x + R * 0.2, y - R * 0.55);
    p.quadraticCurveTo(x - R * 0.5, y - R * 0.6, x - R * 0.9, y - R * 0.2); p.closePath();
    part(g, p, c, 7, 0.78, x, y - R, R);
    g.strokeStyle = shade(c, 0.6); g.lineWidth = 4; g.beginPath(); g.moveTo(x + R * 0.1, y - R * 1.0); g.quadraticCurveTo(x + R * 0.4, y - R * 0.8, x + R * 0.55, y - R * 0.5); g.stroke();
    if (L.hair === "bob") for (const s of [-1, 1]) part(g, ell(x + s * R * 0.98, y + R * 0.25, R * 0.25, R * 0.55, s * -0.15), c, 7, 0.78, x + s * R, y, R * 0.5);
    return;
  }
  part(g, cap(0, 4, 22), c, 7, 0.78, x, y - R, R); // short
};

/** draw a character with feet at (x, y), scaled so the 1000-unit design box is h px tall; mirror flips horizontally */
export const person2 = (g: G, L: Look, o: Pose, x: number, y: number, h: number, opts: { mirror?: boolean; shadow?: number; tint?: string; tintA?: number } = {}) => {
  const s = h / 1000;
  g.save(); g.globalAlpha = opts.shadow ?? 0.35; g.fillStyle = "#2a1a3a";
  g.beginPath(); g.ellipse(x, y, 130 * s, 28 * s, 0, 0, 7); g.fill(); g.restore();
  g.save(); g.translate(x, y); g.scale(opts.mirror ? -s : s, s);
  drawPerson(g, L, o);
  g.restore();
};
