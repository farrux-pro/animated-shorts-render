// 2D hybrid: painted Flow backgrounds (public/gta2d/s1..s3.png) + code-drawn cut-out bean characters (bridge toon.ts)
// + word-by-word captions. Pure Canvas2D (no WebGL), so it renders fast on a laptop.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Pen, bodyFront, townsfolk, Outfit, Expr, FrontOpts } from "../bridge/toon";

export const GTA2D_FRAMES = 2166;
const W = 1080, H = 1920, FPS = 30;
type Word = { w: string; s: number; e: number };

export const SAM: Outfit = { jacket: "#2fa7a0", pants: "#3b3f66", boots: "#f4f1ea", hat: "hair", hair: "#4a2f22" };
export const KIDSAM: Outfit = { ...SAM, hat: "cap", cap: "#e2453c", build: "kid", jacket: "#f08a2c" };

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const back = (u: number) => { const x = clamp01(u), c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------------- characters ----------------
const cache = new Map<string, HTMLCanvasElement>();
const charCanvas = (o: Outfit, opts: FrontOpts, k: number) => {
  const key = JSON.stringify([o, opts, k]);
  let c = cache.get(key);
  if (!c) {
    c = document.createElement("canvas"); c.width = Math.round(600 * k); c.height = Math.round(1000 * k);
    const g = c.getContext("2d")!; g.setTransform(k, 0, 0, k, 0, 0);
    bodyFront(new Pen(g), o, opts);
    if (cache.size > 200) cache.clear();
    cache.set(key, c);
  }
  return c;
};
/** draw a character with its soles at (x, y); h = on-screen height of the 1000-unit design box in px */
export const drawChar = (g: CanvasRenderingContext2D, o: Outfit, opts: FrontOpts, x: number, y: number, h: number,
  fx: { tilt?: number; sx?: number; sy?: number; tint?: string; tintA?: number; shadow?: number } = {}) => {
  if (h < 4) return;
  const k = Math.max(0.1, Math.min(2, h / 1000 * 1.25));
  const c = charCanvas(o, { mode: "stand", ...opts }, Math.round(k * 20) / 20);
  const s = h / 1000;
  // contact shadow
  g.save(); g.globalAlpha = fx.shadow ?? 0.35; g.fillStyle = "#2a1a3a";
  g.beginPath(); g.ellipse(x, y - 4 * s, 150 * s * (fx.sx ?? 1), 34 * s, 0, 0, Math.PI * 2); g.fill(); g.restore();
  g.save();
  g.translate(x, y); g.rotate(fx.tilt ?? 0); g.scale(fx.sx ?? 1, fx.sy ?? 1);
  if (fx.tint) {
    // tint the cut-out toward the scene light so it sits in the painting
    const t = document.createElement("canvas"); t.width = c.width; t.height = c.height;
    const tg = t.getContext("2d")!; tg.drawImage(c, 0, 0);
    tg.globalCompositeOperation = "source-atop"; tg.globalAlpha = fx.tintA ?? 0.15; tg.fillStyle = fx.tint; tg.fillRect(0, 0, t.width, t.height);
    g.drawImage(t, -300 * s, -975 * s, 600 * s, 1000 * s);
  } else g.drawImage(c, -300 * s, -975 * s, 600 * s, 1000 * s);
  g.restore();
};

// ---------------- painted overlays ----------------
export const font = (g: CanvasRenderingContext2D, px: number, w = 900) => { g.font = `${w} ${px}px "DejaVu Sans", Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; };
export const neon = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string, flick = 1) => {
  font(g, px); g.save(); g.globalAlpha = flick;
  g.shadowColor = col; g.shadowBlur = px * 0.6; g.strokeStyle = col; g.lineWidth = px * 0.1; g.strokeText(s, x, y);
  g.shadowBlur = px * 0.25; g.fillStyle = "#fff"; g.fillText(s, x, y); g.restore();
};
export const calendar = (g: CanvasRenderingContext2D, x: number, y: number, w: number, circle: number, month = "SEPTEMBER", year = "2013", day = 17, first = 0, days = 30) => {
  const h = w * 1.27, s = w / 600;
  g.save(); g.translate(x, y); g.rotate(-0.03);
  g.fillStyle = "rgba(30,20,40,.35)"; g.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  g.fillStyle = "#fbfaf4"; g.strokeStyle = "#241726"; g.lineWidth = 8 * s; g.fillRect(-w / 2, -h / 2, w, h); g.strokeRect(-w / 2, -h / 2, w, h);
  g.fillStyle = "#d8423a"; g.fillRect(-w / 2, -h / 2, w, 190 * s);
  g.translate(-w / 2, -h / 2); g.scale(s, s);
  font(g, 74); g.fillStyle = "#fff"; g.fillText(month, 300, 80); font(g, 60, 700); g.fillText(year, 300, 150);
  font(g, 26, 700); g.fillStyle = "#777"; ["S", "M", "T", "W", "T", "F", "S"].forEach((d, i) => g.fillText(d, 60 + i * 80, 225));
  font(g, 34, 700);
  for (let d = 1; d <= days; d++) {
    const cx = 60 + ((d - 1 + first) % 7) * 80, cy = 290 + Math.floor((d - 1 + first) / 7) * 90;
    g.fillStyle = "#333"; g.fillText(String(d), cx, cy);
    if (d === day && circle > 0) { g.strokeStyle = "#d8423a"; g.lineWidth = 7; g.beginPath(); g.ellipse(cx, cy, 36, 32, -0.2, -1.6, -1.6 + Math.PI * 2 * circle); g.stroke(); }
  }
  g.restore();
};
export const gameBox = (g: CanvasRenderingContext2D, x: number, y: number, w: number, rot: number, num = "V", year = "2013", c0 = "#1f6fb8", c1 = "#0d2f5c") => {
  const h = w * 1.33, s = w / 300;
  g.save(); g.translate(x, y); g.rotate(rot); g.translate(-w / 2, -h / 2); g.scale(s, s);
  const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.fillRect(0, 0, 300, 400); g.fillStyle = "#ffcc33"; g.fillRect(0, 0, 300, 60);
  font(g, 34); g.fillStyle = "#14254a"; g.fillText(year, 150, 32);
  font(g, 120); g.strokeStyle = "#14254a"; g.lineWidth = 10; g.strokeText("GTA", 150, 175); g.fillStyle = "#fff"; g.fillText("GTA", 150, 175);
  font(g, 150); g.strokeText(num, 150, 310); g.fillStyle = "#ff5f5f"; g.fillText(num, 150, 310);
  g.strokeStyle = "#241726"; g.lineWidth = 16; g.strokeRect(8, 8, 284, 384);
  g.restore();
};

// ---------------- perspective quads: the paintings' sign boards and screens are skewed ----------------
export type Quad = [[number, number], [number, number], [number, number], [number, number]]; // tl, tr, br, bl in image units
/** draw `src` onto the screen quad (bilinear grid of affine triangles) */
export const warp = (g: CanvasRenderingContext2D, src: HTMLCanvasElement, q: [number, number][], n = 10, bulge = 0) => {
  const cx0 = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy0 = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  const P = (a: number, b: number): [number, number] => {
    const top = [q[0][0] + (q[1][0] - q[0][0]) * a, q[0][1] + (q[1][1] - q[0][1]) * a];
    const bot = [q[3][0] + (q[2][0] - q[3][0]) * a, q[3][1] + (q[2][1] - q[3][1]) * a];
    const x = top[0] + (bot[0] - top[0]) * b, y = top[1] + (bot[1] - top[1]) * b;
    if (!bulge) return [x, y];
    // convex CRT glass: edges bow outward, most in their middles
    const k = 1 + bulge * (Math.sin(Math.PI * a) * (2 * b - 1) ** 2 + Math.sin(Math.PI * b) * (2 * a - 1) ** 2);
    return [cx0 + (x - cx0) * k, cy0 + (y - cy0) * k];
  };
  const W0 = src.width, H0 = src.height;
  const tri = (s0: number[], s1: number[], s2: number[], d0: number[], d1: number[], d2: number[]) => {
    // expand the destination triangle a hair to hide seams
    const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, e = (p: number[]) => [p[0] + Math.sign(p[0] - cx) * 0.6, p[1] + Math.sign(p[1] - cy) * 0.6];
    const [D0, D1, D2] = [e(d0), e(d1), e(d2)];
    g.save(); g.beginPath(); g.moveTo(D0[0], D0[1]); g.lineTo(D1[0], D1[1]); g.lineTo(D2[0], D2[1]); g.closePath(); g.clip();
    const den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1];
    const a = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
    const b = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
    const c = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
    const d = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
    const e2 = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
    const f = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
    g.transform(a, b, c, d, e2, f); g.drawImage(src, 0, 0); g.restore();
  };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a0 = i / n, a1 = (i + 1) / n, b0 = j / n, b1 = (j + 1) / n;
    const s00 = [a0 * W0, b0 * H0], s10 = [a1 * W0, b0 * H0], s11 = [a1 * W0, b1 * H0], s01 = [a0 * W0, b1 * H0];
    const d00 = P(a0, b0), d10 = P(a1, b0), d11 = P(a1, b1), d01 = P(a0, b1);
    tri(s00, s10, s11, d00, d10, d11); tri(s00, s11, s01, d00, d11, d01);
  }
};
const offs = new Map<string, HTMLCanvasElement>();
/** paint content on a flat canvas (cached by key) and warp it onto an image quad */
export const onQuad = (g: CanvasRenderingContext2D, m: { x: number; y: number; dw: number; dh: number }, Q: Quad, cw: number, ch: number, key: string, draw: (c: CanvasRenderingContext2D) => void, bulge = 0, round = 0) => {
  let c = offs.get(key);
  if (!c) {
    c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const cg = c.getContext("2d")!;
    if (round) { cg.beginPath(); cg.roundRect(0, 0, cw, ch, round); cg.clip(); }
    draw(cg);
    if (offs.size > 60) offs.clear();
    offs.set(key, c);
  }
  warp(g, c, Q.map(([u, v]) => [m.x + u * m.dw, m.y + v * m.dh]), 12, bulge);
};
export const SIGN1: Quad = [[0.2867, 0.3422], [0.742, 0.3072], [0.755, 0.4152], [0.2885, 0.4342]];
export const SIGN10: Quad = [[0.3406, 0.283], [0.83, 0.2301], [0.8338, 0.3597], [0.3435, 0.3935]];
export const MONITOR5: Quad = [[0.3844, 0.3524], [0.6802, 0.3524], [0.6802, 0.4806], [0.3865, 0.4897]];
export const LAPTOP9: Quad = [[0.419, 0.3563], [0.6199, 0.3664], [0.588, 0.4514], [0.3898, 0.4362]];
export const signBoard = (g: CanvasRenderingContext2D, m: { x: number; y: number; dw: number; dh: number }, f: number, t: number, top = "GTA VI", sub = "COMING SOON", Q: Quad = SIGN1) => {
  const on = !(f % 37 < 3 && Math.sin(t * 40) < 0);
  onQuad(g, m, Q, 1000, 380, `sign|${top}|${sub}|${on}`, (c) => {
    c.fillStyle = "#2b2236"; c.fillRect(0, 0, 1000, 380);
    c.save(); c.globalAlpha = on ? 1 : 0.8; c.shadowColor = "#ff4fa8"; c.shadowBlur = 26; c.strokeStyle = "#ffd0ea"; c.lineWidth = 11;
    c.beginPath(); c.roundRect(34, 34, 932, 312, 30); c.stroke(); c.restore();
    neon(c, top, 500, 165, 175, "#ff4fa8", on ? 1 : 0.85);
    neon(c, sub, 500, 282, 58, "#3ff0e8");
  });
};

// ---------------- background with camera ----------------
export const bgDraw = (g: CanvasRenderingContext2D, img: HTMLImageElement | undefined, zoom: number, cx: number, cy: number, fallback: [string, string], blur = 0) => {
  g.save();
  if (blur) g.filter = `blur(${blur}px)`;
  if (img && img.naturalWidth) {
    const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    // cx, cy in 0..1: which point of the image sits at the frame centre
    const x = Math.min(0, Math.max(W - dw, W / 2 - cx * dw)), y = Math.min(0, Math.max(H - dh, H / 2 - cy * dh));
    g.drawImage(img, x, y, dw, dh);
    g.restore();
    return { x, y, dw, dh };
  } else {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, fallback[0]); gr.addColorStop(1, fallback[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  g.restore();
  return { x: 0, y: 0, dw: W, dh: H };
};
type Map = { x: number; y: number; dw: number; dh: number };
export const at = (m: Map, u: number, v: number): [number, number] => [m.x + u * m.dw, m.y + v * m.dh];
export const vignette = (g: CanvasRenderingContext2D, a = 0.35) => {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, "rgba(20,10,30,0)"); gr.addColorStop(1, `rgba(20,10,30,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
};

// ---------------- captions ----------------
const chunks = (words: Word[]) => {
  const out: Word[][] = []; let cur: Word[] = [];
  for (const w of words) {
    const gap = cur.length ? w.s - cur[cur.length - 1].e : 0;
    if (cur.length >= 3 || gap > 0.3) { out.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
};
const captions = (g: CanvasRenderingContext2D, words: Word[], t: number, cy = 0.7) => {
  const cs = chunks(words);
  const c = cs.find((ch, i) => t >= ch[0].s && t < (cs[i + 1]?.[0].s ?? ch[ch.length - 1].e + 0.4));
  if (!c) return;
  const shown = c.filter((w) => t >= w.s - 0.03);
  const txt = shown.map((w) => w.w.toUpperCase()).join(" ");
  const last = shown[shown.length - 1], pk = 1 + 0.12 * (1 - clamp01((t - last.s) / 0.12));
  font(g, 78);
  g.save(); g.translate(W / 2, H * cy);
  g.lineJoin = "round"; g.strokeStyle = "#1a1020"; g.lineWidth = 16; g.fillStyle = "#fff";
  // the newest word pops
  const prev = shown.slice(0, -1).map((w) => w.w.toUpperCase()).join(" ");
  const full = g.measureText(txt).width, pw = prev ? g.measureText(prev + " ").width : 0;
  g.textAlign = "left";
  let x = -full / 2;
  if (prev) { g.strokeText(prev, x, 0); g.fillText(prev, x, 0); x += pw; }
  const lw = g.measureText(last.w.toUpperCase()).width;
  g.translate(x + lw / 2, 0); g.scale(pk, pk);
  g.fillStyle = "#ffd84a"; g.strokeText(last.w.toUpperCase(), -lw / 2, 0); g.fillText(last.w.toUpperCase(), -lw / 2, 0);
  g.restore();
};

// ---------------- the timeline ----------------
export const blinkAt = (t: number, seed: number) => ((t + seed * 0.37) % 2.3) < 0.13;
export const shake = (f: number, at: number[], amp = 10) => {
  for (const a of at) { const k = f - a; if (k >= 0 && k < 8) return (k % 2 ? -1 : 1) * amp * (1 - k / 8); }
  return 0;
};

const drawFrame = (g: CanvasRenderingContext2D, f: number, imgs: Record<string, HTMLImageElement>, words: Word[]) => {
  const t = f / FPS;
  if (f >= 312) { drawRest(g, f, imgs); return; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  const sh = shake(f, [243], 12);
  g.translate(sh, -sh * 0.5);
  if (f < 133) {
    // 1. tilt down from the neon sign to the queue
    const k = glide((f - 6) / 80);
    const m = bgDraw(g, imgs.s1, lerp(1.7, 1.08, k) + f * 0.0004, lerp(0.519, 0.5, k), lerp(0.37, 0.62, k), ["#ffb36b", "#6a3a7a"]);
    // the painting's sign board: cover its inner face, draw our own clean neon frame + text inside it
    signBoard(g, m, f, t);
    const queue: [Outfit, number, number, Expr][] = [[townsfolk(4), 0.86, 6, "dazed"], [townsfolk(3), 0.66, 2, "stern"], [townsfolk(1), 0.47, 5, "nervous"], [SAM, 0.27, 3, "dazed"]];
    queue.forEach(([o, u, seed, expr], i) => {
      const bob = Math.sin(t * 2 + seed) * 4, tilt = 0.03 * Math.sin(t * 1.3 + seed);
      const e: Expr = o === SAM && t > 3.6 ? "pained" : expr;
      const [x, y] = at(m, u, 0.735 - i * 0.004);
      drawChar(g, o, { expr: e, blink: blinkAt(t, seed), seed, headTilt: tilt * 2 }, x, y + bob, m.dh * 0.2, { tint: "#ff8a4a", tintA: 0.16, tilt: tilt * 0.3, shadow: 0.45 });
    });
    vignette(g, 0.4);
  } else if (f < 200) {
    // 2a. calendar insert over the soft room
    bgDraw(g, imgs.s2, 1.35 + (f - 133) * 0.001, 0.35, 0.3, ["#9ec3e6", "#5f7fd0"], 14);
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, 0, W, H);
    const pop = back((f - 133) / 14);
    calendar(g, W / 2, H * 0.43, 760 * pop, clamp01((f - 140) / 16));
    vignette(g, 0.3);
  } else if (f < 262) {
    // 2b. kid Sam pops in, lifts the box on "Grand Theft Auto Five", cheers on "out"
    const k = glide((f - 200) / 30);
    const m = bgDraw(g, imgs.s2, lerp(1.25, 1.1, k), 0.5, 0.62, ["#9ec3e6", "#5f7fd0"]);
    const cheer = f >= 243, lift = glide((f - 203) / 10);
    const pop = back((f - 200) / 10), sq = cheer ? 1 + 0.06 * Math.exp(-(f - 243) / 4) * Math.cos((f - 243) * 0.9) : 1;
    const [x, y] = at(m, 0.52, 0.86), hh = m.dh * 0.6 * pop;
    drawChar(g, KIDSAM, { expr: cheer ? "laugh" : f >= 203 ? "grin" : "smile", blink: !cheer && blinkAt(t, 4), seed: 4,
      wave: lift > 0.4 ? (cheer ? Math.round((0.5 + 0.5 * Math.sin(t * 14)) * 4) / 10 : 0) : undefined, headTilt: cheer ? 0.08 * Math.sin(t * 12) : 0 },
      x, y, hh, { sx: 1 / sq, sy: sq, tint: "#ffd9a0", tintA: 0.1, shadow: 0.4 });
    // box: held low on the left, then raised high in the waving hand on "Grand Theft Auto Five"
    const hand = cheer ? 0.012 * Math.sin(t * 14) : 0;
    gameBox(g, x + hh * lerp(-0.11, 0.165 + hand, lift), y - hh * lerp(0.3, 0.64, lift) + (cheer ? 6 * Math.sin(t * 18) : 0), hh * 0.14 * (cheer ? 1 + 0.15 * Math.exp(-(f - 243) / 5) : 1), lerp(-0.1, 0.12, lift));
    vignette(g, 0.3);
  } else {
    // 3. the phone with a home button: slow push-in
    const u = (f - 262) / 50;
    bgDraw(g, imgs.s3, lerp(1.05, 1.3, glide(u)), lerp(0.6, 0.64, u), lerp(0.55, 0.65, u), ["#2a2440", "#c08a5a"]);
    vignette(g, 0.45);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (f >= 133 && f < 139) { g.fillStyle = `rgba(255,255,255,${[1, 0.85, 0.6, 0.4, 0.2, 0.08][f - 133]})`; g.fillRect(0, 0, W, H); }
  void captions; // captions off (user asked for none)
};

import { drawRest } from "./rest";
export const Gta2D: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{ imgs: Record<string, HTMLImageElement>; words: Word[] } | null>(null);
  const [handle] = useState(() => delayRender("gta2d assets"));
  useEffect(() => {
    const load = (n: string) => new Promise<[string, HTMLImageElement]>((res) => {
      const im = new Image(); im.onload = () => res([n, im]); im.onerror = () => res([n, im]); im.src = staticFile(`gta2d/${n}.png`);
    });
    Promise.all([Promise.all(["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11"].map(load)), fetch(staticFile("gta2d/words.json")).then((r) => r.json()), document.fonts.ready])
      .then(([ims, words]) => { setData({ imgs: Object.fromEntries(ims), words }); continueRender(handle); });
  }, [handle]);
  useLayoutEffect(() => { if (data && ref.current) drawFrame(ref.current.getContext("2d")!, f, data.imgs, data.words); }, [f, data]);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
