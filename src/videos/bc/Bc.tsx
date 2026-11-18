// "Bonnie and Clyde, just with better graphics": GTA 6 short #2. Flow backgrounds public/bc/s1..s7.png
// (1 diner, 2 bank street, 3 country road, 4 hideout, 5 newsstand, 6 Louisiana road, 7 neon Miami) + code-drawn cast.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { townsfolk, Outfit, FrontOpts } from "../bridge/toon";
import { drawChar, bgDraw, vignette, font, neon, gameBox, blinkAt, at, glide, back, lerp, clamp01 } from "../gta2d/Gta2D";

export const BC_FRAMES = 1920;
const W = 1080, H = 1920, FPS = 30;
type G = CanvasRenderingContext2D;
type M = { x: number; y: number; dw: number; dh: number };
type Imgs = Record<string, HTMLImageElement>;

const BONNIE: Outfit = { jacket: "#c94a5a", pants: "#3b3f52", boots: "#3a2a22", hat: "hair", hair: "#e8b04a", dress: "#c94a5a" };
const CLYDE: Outfit = { jacket: "#6b4f3a", pants: "#4a3a2e", boots: "#2a1a12", hat: "cap", cap: "#3a3a40" };
const NEO_HER: Outfit = { jacket: "#ff4fa8", pants: "#2a2a40", boots: "#f4f1ea", hat: "hair", hair: "#2a1a12", dress: "#ff4fa8" };
const NEO_HIM: Outfit = { jacket: "#2fd6cf", pants: "#2a2a40", boots: "#f4f1ea", hat: "hair", hair: "#3a2a1a" };
const COP: Outfit = { jacket: "#2a3a6a", pants: "#2a3a6a", boots: "#111", hat: "cap", cap: "#1f2a50" };
const SEPIA = "sepia(0.55) saturate(0.85)";
const KICKS = [5.72, 9.34, 18.86, 19.66, 20.85, 27.49, 31.76, 33.27, 36.89, 59.45, 62.67];

/** hanging neon billboard of the modern scenes */
const billboard = (g: G, t: number, s: number, sub: string) => {
  if (s <= 0.01) return;
  g.save(); g.translate(W / 2, H * 0.17 + Math.sin(t * 1.5) * 6); g.scale(s, s);
  g.strokeStyle = "#241726"; g.lineWidth = 12; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 220, -150); g.lineTo(sx * 220, -300); g.stroke(); }
  g.fillStyle = "#1e1430"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(-330, -150, 660, 290, 26); g.fill(); g.stroke();
  const on = !(Math.floor(t * 30) % 41 < 2);
  g.save(); g.shadowColor = "#ff4fa8"; g.shadowBlur = 24; g.strokeStyle = "#ffd0ea"; g.lineWidth = 8; g.beginPath(); g.roundRect(-300, -122, 600, 234, 20); g.stroke(); g.restore();
  neon(g, "GTA VI", 0, -25, 150, "#ff4fa8", on ? 1 : 0.75);
  neon(g, sub, 0, 72, 50, "#3ff0e8");
  g.restore();
};
const pk = (t: number, t0: number, d = 0.15) => (t < t0 ? 0 : back((t - t0) / d / 1.7));
const idle = (t: number, seed: number) => ({ blink: blinkAt(t, seed), seed, headTilt: Math.round(0.05 * Math.sin(t * 1.4 + seed) * 50) / 50 });
const person = (g: G, m: M, o: Outfit, u: number, v: number, h: number, opts: FrontOpts, fx: Parameters<typeof drawChar>[6] = {}, sepia = false) => {
  const [x, y] = at(m, u, v);
  if (sepia) { g.save(); g.filter = SEPIA; }
  drawChar(g, o, opts, x, y, m.dh * h, fx);
  if (sepia) g.restore();
};
const kick = (t: number) => {
  for (const a of KICKS) { const k = Math.floor((t - a) * FPS); if (k >= 0 && k < 7) return (k % 2 ? -1 : 1) * 11 * (1 - k / 7); }
  return 0;
};
const flash = (g: G, t: number, t0: number) => {
  const k = Math.floor((t - t0) * FPS);
  if (k >= 0 && k < 6) { g.fillStyle = `rgba(255,255,255,${[1, 0.85, 0.6, 0.4, 0.2, 0.08][k]})`; g.fillRect(0, 0, W, H); }
};
const heart = (g: G, x: number, y: number, s: number) => {
  if (s <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = "#ff4f7a"; g.strokeStyle = "#241726"; g.lineWidth = 7;
  g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-70, -20, -35, -70, 0, -35); g.bezierCurveTo(35, -70, 70, -20, 0, 30); g.fill(); g.stroke(); g.restore();
};
/** old-film title card: "TEXAS · 1930" */
const slate = (g: G, txt: string, s: number) => {
  if (s <= 0.01) return;
  g.save(); g.translate(W / 2, H * 0.2); g.scale(s, s); g.rotate(-0.03);
  g.fillStyle = "#f3e6c8"; g.strokeStyle = "#3a2a1a"; g.lineWidth = 10; g.beginPath(); g.roundRect(-330, -95, 660, 190, 18); g.fill(); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.roundRect(-308, -73, 616, 146, 10); g.stroke();
  font(g, 96); const tw = g.measureText(txt).width; if (tw > 560) font(g, Math.floor(96 * 560 / tw));
  g.fillStyle = "#3a2a1a"; g.fillText(txt, 0, 6); g.restore();
};
const icon = (g: G, kind: number, x: number, y: number, s: number) => {
  if (s <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = "#241726"; g.lineWidth = 8;
  if (kind === 0) { // money bag
    g.fillStyle = "#c9a45a"; g.beginPath(); g.ellipse(0, 25, 85, 80, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-30, -50); g.lineTo(30, -50); g.lineTo(15, -25); g.lineTo(-15, -25); g.closePath(); g.fill(); g.stroke();
    font(g, 90); g.fillStyle = "#3a6a2a"; g.fillText("$", 0, 32);
  } else if (kind === 1) { // gas pump
    g.fillStyle = "#e0303a"; g.beginPath(); g.roundRect(-55, -90, 110, 180, 14); g.fill(); g.stroke();
    g.fillStyle = "#f3e6c8"; g.beginPath(); g.arc(0, -40, 32, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(55, -20); g.quadraticCurveTo(100, 0, 85, 70); g.stroke();
  } else { // grocery bag
    g.fillStyle = "#c08a5a"; g.beginPath(); g.moveTo(-70, -40); g.lineTo(70, -40); g.lineTo(60, 90); g.lineTo(-60, 90); g.closePath(); g.fill(); g.stroke();
    for (const [cx, c] of [[-30, "#ff5f5f"], [10, "#6ad46a"], [40, "#ffd84a"]] as const) { g.fillStyle = c; g.beginPath(); g.arc(cx, -50, 26, 0, 7); g.fill(); g.stroke(); }
  }
  g.restore();
};
/** 1930s car seen from behind, scaled by distance */
const carRear = (g: G, x: number, y: number, w: number, body: string, siren = false, t = 0) => {
  g.save(); g.translate(x, y); g.strokeStyle = "#241726"; g.lineWidth = Math.max(2, w * 0.03);
  g.fillStyle = "#1a1a1a"; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(s * w * 0.38 - w * 0.09, -w * 0.18, w * 0.18, w * 0.2, w * 0.04); g.fill(); }
  g.fillStyle = body; g.beginPath(); g.roundRect(-w * 0.45, -w * 0.42, w * 0.9, w * 0.32, w * 0.08); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(-w * 0.3, -w * 0.7, w * 0.6, w * 0.32, w * 0.1); g.fill(); g.stroke();
  g.fillStyle = "#9fc7d8"; g.beginPath(); g.roundRect(-w * 0.22, -w * 0.64, w * 0.44, w * 0.18, w * 0.05); g.fill(); g.stroke();
  g.fillStyle = "#e0303a"; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * w * 0.33, -w * 0.3, w * 0.04, 0, 7); g.fill(); }
  if (siren) {
    const on = Math.floor(t * 8) % 2 === 0;
    g.fillStyle = on ? "#ff3040" : "#3a6aff"; g.beginPath(); g.arc(0, -w * 0.76, w * 0.07, 0, 7); g.fill(); g.stroke();
    g.globalAlpha = 0.35; g.fillStyle = on ? "#ff3040" : "#3a6aff"; g.beginPath(); g.arc(0, -w * 0.76, w * 0.3, 0, 7); g.fill();
  }
  g.restore();
};
const dust = (g: G, x: number, y: number, w: number, t: number) => {
  for (let i = 0; i < 6; i++) {
    const a = (t * 2 + i / 6) % 1;
    g.fillStyle = `rgba(214,190,150,${0.5 * (1 - a)})`; g.beginPath(); g.arc(x + Math.sin(i * 2.3) * w * 0.5 * a, y - a * w * 0.25, w * (0.12 + 0.25 * a), 0, 7); g.fill();
  }
};
/** newspaper front page with two "photos" */
const paper = (g: G, s: number, t: number) => {
  if (s <= 0.01) return;
  g.save(); g.translate(W / 2, H * 0.42); g.scale(s, s); g.rotate(-0.05 + 0.03 * Math.sin(t));
  g.fillStyle = "#efe6d0"; g.strokeStyle = "#3a2a1a"; g.lineWidth = 10; g.beginPath(); g.rect(-400, -520, 800, 1040); g.fill(); g.stroke();
  font(g, 64); g.fillStyle = "#2a1e14"; g.fillText("THE DAILY HERALD", 0, -450);
  g.fillRect(-360, -410, 720, 6);
  font(g, 78); g.fillText("OUTLAW LOVERS", 0, -330); font(g, 52, 700); g.fillText("STILL ON THE RUN!", 0, -255);
  g.fillStyle = "#cdbfa2"; for (let i = 0; i < 9; i++) g.fillRect(-360, 270 + i * 26, i % 3 === 2 ? 420 : 720, 12);
  g.restore();
};

type Scene = { a: number; b: number; draw: (g: G, t: number, u: number, im: Imgs) => void };
const SCENES: Scene[] = [
  { // hook: modern neon couple
    a: 0, b: 6.5, draw: (g, t, u, im) => {
      const punch = t > 5.72 ? glide((t - 5.72) / 0.3) * 0.1 : 0;
      const m = bgDraw(g, im.s7, lerp(1.2, 1.08, glide(u)) + punch, 0.45, 0.62, ["#2a1d5c", "#14101c"]);
      person(g, m, NEO_HER, 0.3, 0.86, 0.36, { ...idle(t, 2), expr: "smile", wave: t > 1.2 && t < 3.5 ? 0.3 : undefined }, { tint: "#ff6ad5", tintA: 0.15, shadow: 0.5 });
      person(g, m, NEO_HIM, 0.52, 0.87, 0.38, { ...idle(t, 5), expr: t > 3.7 ? "grin" : "smile" }, { tint: "#3ff0e8", tintA: 0.15, shadow: 0.5 });
      { const [x, y] = at(m, 0.52, 0.87), hh = m.dh * 0.38; gameBox(g, x + hh * 0.13, y - hh * 0.42, hh * 0.14, 0.05, "VI", "2026", "#ff5f8f", "#5b2a86"); }
      billboard(g, t, pk(t, 0.15, 0.25), "VICE CITY");
      // the old sepia photo pops on "real couple"
      const s = pk(t, 3.6, 0.2);
      if (s > 0) {
        g.save(); g.translate(W * 0.7, H * 0.3); g.rotate(0.12); g.scale(s, s);
        g.fillStyle = "#f3ead8"; g.strokeStyle = "#241726"; g.lineWidth = 8; g.fillRect(-190, -230, 380, 440); g.strokeRect(-190, -230, 380, 440);
        g.fillStyle = "#b9a37e"; g.fillRect(-160, -200, 320, 320);
        g.filter = SEPIA;
        drawChar(g, BONNIE, { seed: 3, expr: "smile" }, -70, 115, 300);
        drawChar(g, CLYDE, { seed: 6, expr: "smile" }, 70, 118, 320);
        g.restore();
      }
      vignette(g, 0.4);
    },
  },
  { // Texas, 1930. America is broke.
    a: 6.5, b: 10.1, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s2, lerp(1.25, 1.12, glide(u)), 0.5, 0.62, ["#e8d5b0", "#b49a78"]);
      person(g, m, townsfolk(2), 0.45, 0.86, 0.4, { ...idle(t, 2), expr: t > 9.3 ? "pained" : "neutral" }, { tint: "#d9b77a", tintA: 0.18 }, true);
      if (t > 9.3) { // empty-pocket moth
        const k = t - 9.3, [x, y] = at(m, 0.45, 0.86);
        g.fillStyle = "#8a7a6a"; g.beginPath(); g.ellipse(x + 60 + k * 120, y - m.dh * 0.25 - k * 160, 14, 8 + 6 * Math.abs(Math.sin(k * 20)), 0, 0, 7); g.fill();
      }
      slate(g, "TEXAS · 1930", pk(t, 6.6, 0.2));
      vignette(g, 0.45);
    },
  },
  { // Bonnie the waitress; Clyde the thief; love; on the run
    a: 10.1, b: 18.8, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s1, t < 12.9 ? lerp(1.4, 1.3, (t - 10.1) / 2.8) : lerp(1.3, 1.12, glide((t - 12.9) / 1.2)), t < 12.9 ? 0.6 : 0.5, 0.65, ["#e8d5b0", "#b49a78"]);
      const run = clamp01((t - 18.1) / 0.7);
      const love = t > 16.84;
      person(g, m, BONNIE, 0.6 + run * 0.6, 0.86, 0.42, { ...idle(t, 3), mode: run > 0 ? "stroll" : "stand", phase: (t * 2.4) % 1, expr: love ? "smile_closed" : "smile", look: t > 13 ? -0.8 : 0 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      if (t < 12.9 && t > 11.5) { // writing a poem
        const [x, y] = at(m, 0.6, 0.86), hh = m.dh * 0.42;
        g.save(); g.filter = SEPIA; g.translate(x + hh * 0.15, y - hh * 0.36); g.rotate(-0.15);
        g.fillStyle = "#fbf6e8"; g.strokeStyle = "#241726"; g.lineWidth = 5; g.fillRect(-50, -65, 100, 130); g.strokeRect(-50, -65, 100, 130);
        g.strokeStyle = "#6a5a4a"; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-35, -40 + i * 22); g.lineTo(-35 + Math.min(70, (t - 11.5) * 120 - i * 25), -40 + i * 22); g.stroke(); }
        g.restore();
      }
      if (t > 12.9) {
        const enter = glide((t - 12.9) / 0.6);
        person(g, m, CLYDE, lerp(-0.2, 0.3, enter) + run * 0.9, 0.88, 0.45, { ...idle(t, 6), mode: enter < 1 || run > 0 ? "stroll" : "stand", phase: (t * 2.4) % 1, expr: t > 15.3 ? "grin" : "smile", look: 0.8 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      }
      if (love && run < 0.3) { const [x, y] = at(m, 0.45, 0.6); heart(g, x, y - Math.sin((t - 16.84) * 3) * 20, pk(t, 16.84, 0.2) * 1.2); }
      vignette(g, 0.4);
    },
  },
  { // Banks. Gas stations. Grocery stores.
    a: 18.8, b: 23.1, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s2, lerp(1.1, 1.2, glide(u)), 0.55, 0.62, ["#e8d5b0", "#b49a78"]);
      person(g, m, BONNIE, 0.35, 0.86, 0.38, { ...idle(t, 3), expr: "grin" }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      person(g, m, CLYDE, 0.6, 0.87, 0.4, { ...idle(t, 6), expr: "laugh", wave: Math.round((0.5 + 0.5 * Math.sin(t * 10)) * 4) / 10 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      [18.86, 19.66, 20.85].forEach((t0, i) => icon(g, i, W * (0.22 + 0.28 * i), H * 0.3 + Math.sin(t * 3 + i) * 12, pk(t, t0, 0.15) * 1.3));
      vignette(g, 0.4);
    },
  },
  { // outrun the police across half of America
    a: 23.1, b: 26.8, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s3, 1.08, 0.5, 0.55, ["#e8d5b0", "#b49a78"]);
      const k = (t - 23.1) / 3.7;
      const [hx, hy] = at(m, 0.5, 0.52);
      const cy = lerp(H * 0.86, hy + 40, k), cw = lerp(360, 70, k), cx = hx + Math.sin(t * 3) * 20 * (1 - k);
      dust(g, cx, cy, cw * 1.3, t);
      g.save(); g.filter = SEPIA; carRear(g, cx, cy, cw, "#2a2a2a"); g.restore();
      const pyk = clamp01(k - 0.18), py = lerp(H * 1.08, hy + 60, pyk), pw = lerp(480, 90, pyk);
      carRear(g, hx + Math.sin(t * 3 + 1) * 30 * (1 - pyk), py, pw, "#2a3a6a", true, t);
      vignette(g, 0.45);
    },
  },
  { // the raid, the escape, the camera
    a: 26.8, b: 32.5, draw: (g, t, u, im) => {
      const push = t > 30.8 ? glide((t - 30.8) / 1.2) : 0;
      const m = bgDraw(g, im.s4, lerp(1.1, 1.18, (t - 26.8) / 4) + push * 0.9, lerp(0.5, 0.53, push), lerp(0.62, 0.47, push), ["#c9b9a0", "#7a6a5a"]);
      const esc = clamp01((t - 29.2) / 0.5);
      if (t < 30.0) {
        person(g, m, BONNIE, 0.4 - esc * 0.8, 0.88, 0.42, { ...idle(t, 3), expr: t > 27.49 ? "shock" : "neutral", mode: esc > 0 ? "stroll" : "stand", phase: (t * 3) % 1 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
        person(g, m, CLYDE, 0.65 - esc * 1.0, 0.9, 0.45, { ...idle(t, 6), expr: t > 27.49 ? "shock" : "neutral", mode: esc > 0 ? "stroll" : "stand", phase: (t * 3) % 1 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      }
      if (t > 29.6 && t < 30.8) person(g, m, COP, lerp(1.3, 0.7, glide((t - 29.6) / 0.6)), 0.9, 0.45, { ...idle(t, 1), expr: "stern" }, { tint: "#ffd9a0", tintA: 0.1 }, true);
      // a red-blue police glow through the window during the raid
      if (t > 27.4 && t < 30.5) { g.fillStyle = Math.floor(t * 6) % 2 ? "rgba(255,40,60,.12)" : "rgba(60,90,255,.12)"; g.fillRect(0, 0, W, H); }
      if (t > 31.7) { const [x, y] = at(m, 0.53, 0.46); g.save(); g.globalAlpha = 0.5 * (1 - clamp01((t - 31.7) / 0.4)); g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 300, 0, 7); g.fill(); g.restore(); }
      vignette(g, 0.45);
    },
  },
  { // the photos hit the newspapers; celebrities; people read
    a: 32.5, b: 42.9, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s5, lerp(1.1, 1.25, glide(u)), 0.45, 0.62, ["#e8d5b0", "#b49a78"]);
      const readers = t > 39.8;
      if (readers) {
        [[0.2, 1], [0.5, 4], [0.78, 5]].forEach(([uu, s], i) => {
          person(g, m, townsfolk(s), uu, 0.9, 0.36, { ...idle(t, s), expr: t > 41.2 ? "grin" : "stern", look: i === 0 ? 0.6 : -0.4 }, { tint: "#ffd9a0", tintA: 0.1 }, true);
          const [x, y] = at(m, uu, 0.9), hh = m.dh * 0.36;
          const pw = hh * 0.3, ph = hh * 0.21;
          g.save(); g.filter = SEPIA; g.translate(x, y - hh * 0.4); g.rotate(i === 1 ? 0.04 : -0.04);
          g.fillStyle = "#efe6d0"; g.strokeStyle = "#3a2a1a"; g.lineWidth = 5; g.fillRect(-pw / 2, -ph / 2, pw, ph); g.strokeRect(-pw / 2, -ph / 2, pw, ph);
          g.fillStyle = "#8a7a6a"; g.fillRect(-pw * 0.4, -ph * 0.38, pw * 0.8, ph * 0.14); g.fillRect(-pw * 0.4, -ph * 0.1, pw * 0.35, ph * 0.45);
          g.fillStyle = "#b9ab95"; for (let r = 0; r < 4; r++) g.fillRect(pw * 0.02, -ph * 0.1 + r * ph * 0.12, pw * 0.38, ph * 0.05);
          g.fillStyle = "#ffe2c2"; g.lineWidth = 4; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * pw * 0.47, ph * 0.05, hh * 0.022, 0, 7); g.fill(); g.stroke(); }
          g.restore();
        });
      }
      const ps = readers ? 1 - glide((t - 39.8) / 0.3) : pk(t, 32.6, 0.2);
      paper(g, ps, t);
      if (ps > 0.5) {
        // the two "photos" on the front page, popping in on their words
        g.save(); g.translate(W / 2, H * 0.42); g.scale(ps, ps); g.rotate(-0.05 + 0.03 * Math.sin(t));
        for (const [i, o, t0] of [[0, BONNIE, 34.45], [1, CLYDE, 35.77]] as const) {
          const s = pk(t, t0, 0.15); if (s <= 0) continue;
          g.save(); g.translate(i ? 190 : -190, 10); g.scale(s, s);
          g.fillStyle = "#b9a37e"; g.strokeStyle = "#3a2a1a"; g.lineWidth = 6; g.fillRect(-160, -200, 320, 400); g.strokeRect(-160, -200, 320, 400);
          g.filter = "sepia(1) contrast(1.1)";
          drawChar(g, o, { seed: i ? 6 : 3, expr: i ? "grin" : "smile", wave: i ? 0 : undefined }, 0, 190, 380);
          if (!i) { g.filter = "none"; g.fillStyle = "#6a4a2a"; g.save(); g.translate(2, -47); g.rotate(0.12); g.strokeStyle = "#241726"; g.lineWidth = 3; g.fillRect(0, -5, 52, 10); g.strokeRect(0, -5, 52, 10); g.fillStyle = "#e0a050"; g.fillRect(48, -5, 7, 10); g.restore(); } // the cigar
          g.restore();
        }
        g.restore();
      }
      // flash bulbs: celebrities
      for (const t0 of [36.95, 37.4, 37.9, 38.5, 39.1]) { const k = (t - t0) * FPS; if (k >= 0 && k < 4) { g.fillStyle = `rgba(255,255,255,${0.7 * (1 - k / 4)})`; g.fillRect(0, 0, W, H); } }
      vignette(g, 0.4);
    },
  },
  { // May 1934, a quiet road in Louisiana; the legend never ended
    a: 42.9, b: 52.0, draw: (g, t, u, im) => {
      bgDraw(g, im.s6, lerp(1.05, 1.3, glide(u)), 0.5, lerp(0.6, 0.55, u), ["#e89a6a", "#4a3a6a"]);
      slate(g, "MAY 1934", pk(t, 43.9, 0.2) * (t < 46.5 ? 1 : 1 - clamp01((t - 46.5) / 0.4)));
      const dim = clamp01((t - 47.9) / 2);
      g.fillStyle = `rgba(20,10,30,${0.35 * dim})`; g.fillRect(0, 0, W, H);
      vignette(g, 0.5 + 0.2 * dim);
    },
  },
  { // 90 years later: Lucia and Jason, Bonnie and Clyde with better graphics
    a: 52.0, b: 99, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s7, lerp(1.25, 1.08, glide((t - 52) / 4)) + (t > 59.45 ? 0.06 * glide((t - 59.45) / 0.3) : 0), 0.5, 0.62, ["#2a1d5c", "#14101c"]);
      const pose = t > 59.45;
      person(g, m, NEO_HER, 0.2, 0.86, 0.34 * pk(t, 53.4, 0.25), { ...idle(t, 2), expr: pose ? "grin" : "smile", wave: pose ? 0.2 : undefined }, { tint: "#ff6ad5", tintA: 0.15, shadow: 0.5 });
      person(g, m, NEO_HIM, 0.4, 0.87, 0.36 * pk(t, 53.6, 0.25), { ...idle(t, 5), expr: pose ? "laugh" : "smile" }, { tint: "#3ff0e8", tintA: 0.15, shadow: 0.5 });
      if (t > 54.6 && t < 59) { const [x, y] = at(m, 0.3, 0.55); heart(g, x, y, pk(t, 54.66, 0.2)); }
      // "the whole world watching": phone camera flashes
      for (const t0 of [57.95, 58.2, 58.45, 58.7]) { const k = (t - t0) * FPS; if (k >= 0 && k < 4) { g.fillStyle = `rgba(255,255,255,${0.6 * (1 - k / 4)})`; g.fillRect(0, 0, W, H); } }
      // "Bonnie and Clyde": the sepia originals appear beside them, then get the colour upgrade on "graphics"
      if (t > 60.9) {
        const up = clamp01((t - 62.6) / 0.5);
        g.save(); g.filter = up < 1 ? `sepia(${1 - up}) saturate(${0.85 + 0.15 * up})` : "none";
        const [bx, by] = at(m, 0.61, 0.88), [cx2, cy2] = at(m, 0.8, 0.89);
        drawChar(g, BONNIE, { seed: 3, expr: up > 0.5 ? "grin" : "smile", blink: blinkAt(t, 3) }, bx, by, m.dh * 0.32 * pk(t, 60.92, 0.2), { tint: "#ff6ad5", tintA: 0.1 * up, shadow: 0.5 });
        drawChar(g, CLYDE, { seed: 6, expr: up > 0.5 ? "laugh" : "smile", blink: blinkAt(t, 6) }, cx2, cy2, m.dh * 0.34 * pk(t, 61.31, 0.2), { tint: "#3ff0e8", tintA: 0.1 * up, shadow: 0.5 });
        g.restore();
        if (up > 0 && up < 1) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - up)})`; g.fillRect(0, 0, W, H); }
      }
      billboard(g, t, pk(t, 52.2, 0.25), t > 59.4 ? "OUT NOW" : "VICE CITY");
      { const [x, y] = at(m, 0.4, 0.87), hh = m.dh * 0.36 * pk(t, 53.6, 0.25); if (hh > 10) gameBox(g, x + hh * 0.13, y - hh * 0.42, hh * 0.14, 0.05, "VI", "2026", "#ff5f8f", "#5b2a86"); }
      if (t > 62.2) neon(g, "BETTER GRAPHICS", W / 2, H * 0.36, 80 * pk(t, 62.45, 0.2), "#3ff0e8");
      vignette(g, 0.4);
    },
  },
];

const drawFrame = (g: G, f: number, im: Imgs) => {
  const t = f / FPS;
  const sc = SCENES.find((s) => t >= s.a && t < s.b) ?? SCENES[SCENES.length - 1];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  const k = kick(t); g.translate(k, -k * 0.5);
  sc.draw(g, t, clamp01((t - sc.a) / (Math.min(sc.b, 64) - sc.a)), im);
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const t0 of [6.5, 52.0]) flash(g, t, t0);
  // the old-film flicker over the 1930s part
  if (t > 6.5 && t < 52) { g.fillStyle = `rgba(60,40,20,${0.04 + 0.03 * Math.abs(Math.sin(f * 1.7))})`; g.fillRect(0, 0, W, H); }
  if (t > 63.6) { g.fillStyle = `rgba(0,0,0,${clamp01((t - 63.6) / 0.4)})`; g.fillRect(0, 0, W, H); }
};

export const BonnieClyde: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [imgs, setImgs] = useState<Imgs | null>(null);
  const [handle] = useState(() => delayRender("bc assets"));
  useEffect(() => {
    const load = (n: string) => new Promise<[string, HTMLImageElement]>((res) => {
      const im = new Image(); im.onload = () => res([n, im]); im.onerror = () => res([n, im]); im.src = staticFile(`bc/${n}.png`);
    });
    Promise.all([Promise.all(["s1", "s2", "s3", "s4", "s5", "s6", "s7"].map(load)), document.fonts.ready])
      .then(([ims]) => { setImgs(Object.fromEntries(ims)); continueRender(handle); });
  }, [handle]);
  useLayoutEffect(() => { if (imgs && ref.current) drawFrame(ref.current.getContext("2d")!, f, imgs); }, [f, imgs]);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
