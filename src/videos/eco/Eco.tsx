// "GTA 6 vs the economy": GTA 6 short #3. Backgrounds public/eco/s1..s14.png (all made for this video):
// 1 launch store, 2 office, 3 Gen Z room, 4 sick couch, 5 boss office, 6 factory, 7 pizzeria, 8 airport, 9 barracks,
// 10 empty downtown, 11 trading floor, 12 news studio, 13 money vault, 14 Vice City boulevard.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Outfit, FrontOpts } from "../bridge/toon";
import { drawChar, bgDraw, vignette, font, neon, gameBox, onQuad, blinkAt, at, glide, back, lerp, clamp01, Quad } from "../gta2d/Gta2D";

export const ECO_FRAMES = 1590;
const W = 1080, H = 1920, FPS = 30;
type G = CanvasRenderingContext2D;
type M = { x: number; y: number; dw: number; dh: number };
type Imgs = Record<string, HTMLImageElement>;

const SAM: Outfit = { jacket: "#2fa7a0", pants: "#3b3f66", boots: "#f4f1ea", hat: "hair", hair: "#4a2f22" };
const GENZ: Outfit = { jacket: "#7f5af0", pants: "#2a2a40", boots: "#f4f1ea", hat: "hair", hair: "#2fd6cf" };
const BOSS: Outfit = { jacket: "#2a2a40", pants: "#2a2a40", boots: "#111", hat: "hair", hair: "#9a9a9a", moustache: "#666", build: "stout", buttons: "#e8c45a" };
const FACTORY: Outfit = { jacket: "#f0a020", pants: "#3a4a6a", boots: "#3a2a1a", hat: "cap", cap: "#ffcc33" };
const COURIER: Outfit = { jacket: "#e0303a", pants: "#2a2a40", boots: "#f4f1ea", hat: "cap", cap: "#e0303a" };
const PILOT: Outfit = { jacket: "#f4f1ea", pants: "#1f2a50", boots: "#111", hat: "cap", cap: "#1f2a50", buttons: "#e8c45a" };
const SOLDIER: Outfit = { jacket: "#5a6a3a", pants: "#4a5a32", boots: "#2a2a1a", hat: "cap", cap: "#4a5a32" };
const ANCHOR: Outfit = { jacket: "#3a5ad0", pants: "#2a2a40", boots: "#111", hat: "long", hair: "#e8b04a", lashes: true };
const W1: Outfit = { jacket: "#ff6aa0", pants: "#2a2a40", boots: "#f4f1ea", hat: "long", hair: "#3a2418", dress: "#ff6aa0", lashes: true };
const W2: Outfit = { jacket: "#5a8fc2", pants: "#2a2a40", boots: "#f4f1ea", hat: "long", hair: "#e8b04a", dress: "#5a8fc2", lashes: true };
const W3: Outfit = { jacket: "#f0a040", pants: "#2a2a40", boots: "#3a2a22", hat: "long", hair: "#8a3a2a", lashes: true };
const M1: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#2a1a12" };
const M2: Outfit = { jacket: "#5d7a3a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#6a4a2a", skin: "#c99067" };
const M3: Outfit = { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#1a1a1a", skin: "#f5c9a0" };
const PEOPLE = [M1, W1, M2, W2, M3, W3];
const SIGN1: Quad = [[0.252, 0.253], [0.786, 0.144], [0.79, 0.336], [0.252, 0.386]];
const WALL12: Quad = [[0.225, 0.386], [0.778, 0.386], [0.778, 0.5375], [0.225, 0.5375]];
const KICKS = [1.66, 6.06, 9.81, 16.32, 18.24, 24.9, 29.6, 36.83, 41.94, 42.19, 43.62, 47.08, 51.51];

const pk = (t: number, t0: number, d = 0.15) => (t < t0 ? 0 : back((t - t0) / d / 1.7));
const idle = (t: number, seed: number) => ({ blink: blinkAt(t, seed), seed, headTilt: Math.round(0.05 * Math.sin(t * 1.4 + seed) * 50) / 50 });
const person = (g: G, m: M, o: Outfit, u: number, v: number, h: number, opts: FrontOpts, tint = "#ffd9a0", ta = 0.1) => {
  const [x, y] = at(m, u, v);
  drawChar(g, o, opts, x, y, m.dh * h, { tint, tintA: ta, shadow: 0.4 });
  return { x, y, hh: m.dh * h };
};
const hand = (g: G, x: number, y: number, r: number) => { g.fillStyle = "#ffe2c2"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); };
/** a game controller held in both hands in front of the body (dy = height of the hands above the soles, in hh) */
const pad = (g: G, p: { x: number; y: number; hh: number }, dy = 0.358, t = 0, dx = 0.133) => {
  const w = (2 * dx * p.hh) / 0.9, x = p.x, y = p.y - p.hh * dy - w * 0.08 + Math.sin(t * 9) * 2;
  g.save(); g.translate(x, y); g.fillStyle = "#2a2a32"; g.strokeStyle = "#241726"; g.lineWidth = 5;
  g.beginPath(); g.ellipse(-w * 0.3, w * 0.08, w * 0.25, w * 0.22, 0.4, 0, 7); g.ellipse(w * 0.3, w * 0.08, w * 0.25, w * 0.22, -0.4, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(-w * 0.45, -w * 0.16, w * 0.9, w * 0.3, w * 0.12); g.fill(); g.stroke();
  for (const [c, ddx, dy2] of [["#ff4f7a", 0.28, -0.04], ["#3ff0e8", 0.18, 0.05], ["#ffd84a", 0.38, 0.05]] as const) { g.fillStyle = c; g.beginPath(); g.arc(w * ddx, w * dy2, w * 0.045, 0, 7); g.fill(); }
  g.restore();
  hand(g, x - dx * p.hh, p.y - p.hh * dy, p.hh * 0.024); hand(g, x + dx * p.hh, p.y - p.hh * dy, p.hh * 0.024);
};
/** a GTA VI box held in front with both hanging hands on its sides */
const boxHeld = (g: G, p: { x: number; y: number; hh: number }, dy = 0.358, dx = 0.133) => {
  const w = 2 * dx * p.hh * 0.92;
  gameBox(g, p.x, p.y - p.hh * dy - w * 0.15, w, 0, "VI", "2026", "#ff5f8f", "#5b2a86");
  hand(g, p.x - dx * p.hh, p.y - p.hh * dy, p.hh * 0.024); hand(g, p.x + dx * p.hh, p.y - p.hh * dy, p.hh * 0.024);
};
/** a phone held in two hands, its screen showing the neon city */
const phoneHeld = (g: G, p: { x: number; y: number; hh: number }, dy = 0.38) => {
  const w = p.hh * 0.1, h = w * 1.8, x = p.x, y = p.y - p.hh * dy;
  g.save(); g.translate(x, y); g.rotate(-0.1); g.fillStyle = "#1c1c22"; g.strokeStyle = "#241726"; g.lineWidth = 4;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, w * 0.15); g.fill(); g.stroke();
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, "#ff5f8f"); gr.addColorStop(1, "#3a1d5c");
  g.fillStyle = gr; g.fillRect(-w * 0.4, -h * 0.42, w * 0.8, h * 0.84); g.restore();
  hand(g, x - w * 0.55, y + h * 0.2, p.hh * 0.02); hand(g, x + w * 0.55, y + h * 0.2, p.hh * 0.02);
};
const badge = (g: G, txt: string, s: number, y = H * 0.2, col = "#ff4fa8") => {
  if (s <= 0.01) return;
  g.save(); g.translate(W / 2, y); g.rotate(-0.05); g.scale(s, s);
  font(g, 120); const tw = g.measureText(txt).width + 100;
  g.fillStyle = col; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(-tw / 2, -95, tw, 190, 40); g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.lineWidth = 14; g.lineJoin = "round"; g.strokeText(txt, 0, 8); g.fillText(txt, 0, 8); g.restore();
};
const puff = (g: G, x: number, y: number, k: number, size: number) => {
  if (k < 0 || k > 1) return;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, r = size * (0.3 + k);
    g.fillStyle = `rgba(255,255,255,${0.85 * (1 - k)})`; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, size * 0.35 * (1 - k * 0.5), 0, 7); g.fill();
  }
};
const billboard = (g: G, t: number, s: number, sub: string, y = H * 0.17) => {
  if (s <= 0.01) return;
  g.save(); g.translate(W / 2, y + Math.sin(t * 1.5) * 6); g.scale(s, s);
  g.fillStyle = "#1e1430"; g.strokeStyle = "#241726"; g.lineWidth = 12; g.beginPath(); g.roundRect(-330, -150, 660, 290, 26); g.fill(); g.stroke();
  g.save(); g.shadowColor = "#ff4fa8"; g.shadowBlur = 24; g.strokeStyle = "#ffd0ea"; g.lineWidth = 8; g.beginPath(); g.roundRect(-300, -122, 600, 234, 20); g.stroke(); g.restore();
  neon(g, "GTA VI", 0, -25, 150, "#ff4fa8"); neon(g, sub, 0, 72, 50, "#3ff0e8");
  g.restore();
};
const bill = (g: G, x: number, y: number, r: number, s: number) => {
  g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = "#7cc47a"; g.strokeStyle = "#241726"; g.lineWidth = 4;
  g.fillRect(-60 * s, -30 * s, 120 * s, 60 * s); g.strokeRect(-60 * s, -30 * s, 120 * s, 60 * s);
  font(g, 40 * s); g.fillStyle = "#2a5a2a"; g.fillText("$", 0, 2); g.restore();
};

type Scene = { a: number; b: number; draw: (g: G, t: number, u: number, im: Imgs) => void };
const SCENES: Scene[] = [
  { // 0: "GTA Six is finally here. And America might not show up to work."
    a: 0, b: 4.6, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s1, lerp(1.3, 1.1, glide(u)), 0.5, lerp(0.4, 0.6, glide(u)), ["#2a1d5c", "#14101c"]);
      onQuad(g, m, SIGN1, 1000, 420, "ecoSign", (c) => {
        c.fillStyle = "#1e1430"; c.fillRect(0, 0, 1000, 420);
        neon(c, "GTA VI", 500, 175, 210, "#ff4fa8"); neon(c, "OUT NOW", 500, 320, 80, "#3ff0e8");
      });
      [[0.18, 1], [0.38, 4], [0.6, 0], [0.82, 5]].forEach(([uu, s], i) => {
        const o = i === 2 ? SAM : [W1, M3, SAM, W2][i];
        const jump = t > 1.66 ? Math.abs(Math.sin((t - 1.66) * 7 + i)) * 0.012 : 0;
        const p = person(g, m, o, uu, 0.86 - jump, 0.3, { ...idle(t, s + 2), expr: t > 1.66 ? "laugh" : "grin", wave: t > 1.66 && i % 2 ? 0.3 : undefined }, "#ff6ad5", 0.14);
        if (i % 2 === 0) gameBox(g, p.x + p.hh * 0.13, p.y - p.hh * 0.42, p.hh * 0.14, 0.05, "VI", "2026", "#ff5f8f", "#5b2a86");
      });
      vignette(g, 0.4);
    },
  },
  { // 1: "nearly one in five office workers planned to take launch day off"
    a: 4.6, b: 9.6, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s2, lerp(1.15, 1.08, glide(u)), 0.5, 0.62, ["#f4e6c8", "#c9b9a0"]);
      [0.12, 0.31, 0.5, 0.69, 0.88].forEach((uu, i) => {
        const gone = i === 2 && t > 6.47;
        if (gone) { const [x, y] = at(m, uu, 0.86); puff(g, x, y - m.dh * 0.12, (t - 6.47) / 0.5, 120); return; }
        person(g, m, PEOPLE[i], uu, 0.86, 0.26, { ...idle(t, i + 1), expr: i === 2 ? "whistle" : "neutral", look: i === 2 ? 0.6 : 0 });
      });
      badge(g, "1 IN 5", pk(t, 6.06, 0.2));
      vignette(g, 0.3);
    },
  },
  { // 2: "For Gen Z, it's almost one in three."
    a: 9.6, b: 12.1, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s3, lerp(1.2, 1.1, glide(u)), 0.5, 0.62, ["#3a2a5a", "#1a1030"]);
      const p = person(g, m, GENZ, 0.5, 0.88, 0.5, { ...idle(t, 4), expr: "laugh" }, "#b08aff", 0.15);
      pad(g, p, 0.358, t);
      badge(g, "1 IN 3", pk(t, 11.14, 0.2), H * 0.2, "#7f5af0");
      vignette(g, 0.4);
    },
  },
  { // 3: "half of them won't even ask. They'll just call in sick. With a very dramatic cough."
    a: 12.1, b: 17.1, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s4, lerp(1.25, 1.12, glide(u)), 0.45, 0.62, ["#f4c9a0", "#8a5a3c"]);
      const cough = t > 16.3 && t < 17;
      const p = person(g, m, SAM, 0.3, 0.455, 0.4, { ...idle(t, 3), mode: "sit", expr: cough ? "pained" : t > 14.29 ? "nervous" : "smile", headTilt: cough ? 0.15 * Math.sin(t * 30) : 0 }, "#ffb070", 0.12);
      // a blanket over his lap (hides the dangling legs): he's 'sick'
      g.save(); g.fillStyle = "#6a8fd0"; g.strokeStyle = "#241726"; g.lineWidth = 6; g.beginPath();
      g.moveTo(p.x - p.hh * 0.17, p.y - p.hh * 0.11); g.quadraticCurveTo(p.x, p.y - p.hh * 0.15, p.x + p.hh * 0.17, p.y - p.hh * 0.11);
      g.lineTo(p.x + p.hh * 0.21, p.y + p.hh * 0.03); g.quadraticCurveTo(p.x, p.y + p.hh * 0.06, p.x - p.hh * 0.21, p.y + p.hh * 0.03); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 5; for (const k of [-0.08, 0, 0.08]) { g.beginPath(); g.moveTo(p.x + k * p.hh, p.y - p.hh * 0.12); g.lineTo(p.x + k * p.hh * 1.2, p.y + p.hh * 0.03); g.stroke(); }
      g.restore();
      // a phone held to the ear
      const hx = p.x + p.hh * 0.125, hy = p.y - p.hh * 0.37, pw = p.hh * 0.055;
      g.save(); g.translate(hx, hy); g.rotate(0.25); g.fillStyle = "#1c1c22"; g.strokeStyle = "#241726"; g.lineWidth = 4;
      g.beginPath(); g.roundRect(-pw / 2, -pw, pw, pw * 2, pw * 0.2); g.fill(); g.stroke();
      g.fillStyle = "#5a9ad8"; g.fillRect(-pw * 0.38, -pw * 0.82, pw * 0.76, pw * 1.6); g.restore();
      hand(g, hx + pw * 0.1, hy + pw * 0.7, p.hh * 0.024);
      if (cough) { for (let i = 0; i < 3; i++) puff(g, hx + 60 + i * 30, hy + 40, ((t - 16.3) * 2 + i * 0.2) % 1, 30); }
      vignette(g, 0.35);
    },
  },
  { // 4: "Some bosses just gave up. Logitech gave its employees a day off to play games."
    a: 17.1, b: 22.3, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s5, lerp(1.2, 1.1, glide(u)), 0.5, 0.65, ["#d9c9a8", "#8a6a4a"]);
      const party = t > 20.5;
      const p = person(g, m, BOSS, 0.5, 0.92, 0.5, { ...idle(t, 6), expr: party ? "laugh" : t > 18.0 ? "pained" : "stern" });
      if (party) {
        for (let i = 0; i < 40; i++) {
          const y = (((t - 20.5) * 0.7 + (i * 0.137) % 1) % 1) * H * 0.8, x = ((i * 241) % W) + Math.sin(t * 3 + i) * 30;
          g.fillStyle = ["#ff4f7a", "#ffd84a", "#3fc1f0", "#6ad46a"][i % 4]; g.save(); g.translate(x, y); g.rotate(t * 5 + i); g.fillRect(-10, -5, 20, 10); g.restore();
        }
        badge(g, "DAY OFF!", pk(t, 20.51, 0.2), H * 0.2, "#2fa7a0");
        pad(g, p, 0.327, t, 0.148);
      }
      vignette(g, 0.35);
    },
  },
  { // 5: "Now imagine everyone does it." - the office empties, desk by desk
    a: 22.3, b: 24.3, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s2, lerp(1.08, 1.2, glide(u)), 0.5, 0.62, ["#f4e6c8", "#c9b9a0"]);
      [0.12, 0.31, 0.5, 0.69, 0.88].forEach((uu, i) => {
        const tg = 22.6 + i * 0.28;
        const [x, y] = at(m, uu, 0.86);
        if (t > tg) { puff(g, x, y - m.dh * 0.12, (t - tg) / 0.5, 120); return; }
        person(g, m, PEOPLE[i], uu, 0.86, 0.26, { ...idle(t, i + 1), expr: "nervous" });
      });
      vignette(g, 0.35);
    },
  },
  { // 6: "The factory stops, because the guy who runs it is stealing cars in Vice City."
    a: 24.3, b: 28.9, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s6, lerp(1.15, 1.08, glide(u)), 0.5, 0.62, ["#d9c9a8", "#8a6a4a"]);
      // boxes tumbling off the stopped line
      for (let i = 0; i < 6; i++) {
        const t0 = 24.9 + i * 0.5; if (t < t0) continue;
        const k = Math.min(1, (t - t0) / 0.6), [x0, y0] = at(m, 0.62 + i * 0.03, 0.42);
        const x = x0 + k * 80, y = y0 + k * k * m.dh * 0.38;
        g.save(); g.translate(x, y); g.rotate(k * 2 + i); g.fillStyle = "#c08a5a"; g.strokeStyle = "#241726"; g.lineWidth = 5; g.fillRect(-45, -35, 90, 70); g.strokeRect(-45, -35, 90, 70); g.restore();
      }
      const p = person(g, m, FACTORY, 0.32, 0.88, 0.42, { ...idle(t, 2), expr: t > 27.4 ? "laugh" : "grin" });
      boxHeld(g, p);
      vignette(g, 0.35);
    },
  },
  { // 7: "Your pizza never comes. The driver is delivering pizzas in the game."
    a: 28.9, b: 32.9, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s7, lerp(1.2, 1.1, glide(u)), 0.4, 0.62, ["#3a2a3a", "#1a1020"]);
      const p = person(g, m, COURIER, 0.42, 0.86, 0.4, { ...idle(t, 5), expr: t > 31.1 ? "laugh" : "grin" }, "#ffb070", 0.15);
      boxHeld(g, p);
      // steam rising from the forgotten pizza box on the scooter
      const [sx, sy] = at(m, 0.86, 0.62);
      for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; g.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; g.lineWidth = 6; g.beginPath(); g.moveTo(sx + i * 18 - 18, sy - k * 120); g.quadraticCurveTo(sx + i * 18, sy - k * 120 - 30, sx + i * 18 - 10, sy - k * 120 - 60); g.stroke(); }
      vignette(g, 0.4);
    },
  },
  { // 8: "Pilots are still flying. Just not real planes."
    a: 32.9, b: 35.9, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s8, lerp(1.1, 1.18, glide(u)), 0.45, 0.62, ["#8fd3f0", "#555"]);
      const p = person(g, m, PILOT, 0.55, 0.88, 0.44, { ...idle(t, 3), expr: t > 34.5 ? "laugh" : "grin", headTilt: 0.06 * Math.sin(t * 6) });
      gameBox(g, p.x + p.hh * 0.13, p.y - p.hh * 0.42, p.hh * 0.15, 0.05, "VI", "2026", "#ff5f8f", "#5b2a86"); hand(g, p.x + p.hh * 0.13, p.y - p.hh * 0.36, p.hh * 0.022);
      // a tiny paper plane looping overhead
      const k = (t - 32.9) / 3, px = lerp(-100, W + 100, k), py = H * 0.25 + Math.sin(k * 9) * 80;
      g.save(); g.translate(px, py); g.rotate(Math.cos(k * 9) * 0.5); g.fillStyle = "#fff"; g.strokeStyle = "#241726"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(60, 0); g.lineTo(-50, -30); g.lineTo(-25, 0); g.lineTo(-50, 30); g.closePath(); g.fill(); g.stroke(); g.restore();
      vignette(g, 0.3);
    },
  },
  { // 9: "Even the army goes quiet. Every soldier is on a mission. In Leonida."
    a: 35.9, b: 40.7, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s9, lerp(1.2, 1.1, glide(u)), 0.5, 0.62, ["#9aa48a", "#4a5a3a"]);
      [[0.2, 1], [0.5, 4], [0.8, 6]].forEach(([uu, s]) => {
        const p = person(g, m, SOLDIER, uu, 0.9, 0.36, { ...idle(t, s), expr: t > 38.8 ? "stern" : "neutral" });
        pad(g, p, 0.358, t + s);
      });
      if (t > 39.66) billboard(g, t, pk(t, 39.7, 0.2) * 0.85, "LEONIDA", H * 0.2);
      vignette(g, 0.35);
    },
  },
  { // 10: "Offices empty."
    a: 40.7, b: 41.9, draw: (g, t, u, im) => {
      bgDraw(g, im.s10, lerp(1.05, 1.15, u), 0.5, 0.6, ["#b8c8d8", "#5a6a7a"]);
      const k = (t - 40.7) / 1.2; bill(g, lerp(-80, W + 80, k), H * 0.7 - Math.sin(k * 7) * 60, k * 6, 1.4);
      vignette(g, 0.35);
    },
  },
  { // 11: "Graphs crash."
    a: 41.9, b: 43.0, draw: (g, t, u, im) => {
      bgDraw(g, im.s11, lerp(1.05, 1.2, u), 0.5, 0.55, ["#5a1a2a", "#1a0a10"]);
      if (Math.floor(t * 8) % 2) { g.fillStyle = "rgba(255,30,40,.15)"; g.fillRect(0, 0, W, H); }
      vignette(g, 0.45);
    },
  },
  { // 12: "Economists panic."
    a: 43.0, b: 44.5, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s12, lerp(1.1, 1.18, u), 0.5, 0.55, ["#2a2a5a", "#10102a"]);
      const k = clamp01((t - 43.0) / 1.0);
      onQuad(g, m, WALL12, 900, 500, `wall|${Math.round(k * 20)}`, (c) => {
        c.fillStyle = "#14101c"; c.fillRect(0, 0, 900, 500);
        c.fillStyle = "#e0303a"; c.fillRect(0, 0, 900, 110); font(c, 70); c.fillStyle = "#fff"; c.fillText("BREAKING NEWS", 450, 58);
        c.strokeStyle = "#ff3040"; c.lineWidth = 14; c.lineJoin = "round"; c.beginPath();
        const n = Math.max(2, Math.round(k * 20));
        for (let i = 0; i < n; i++) { const x = 60 + i * 40, y = 170 + i * 14 + (i % 2 ? 30 : -10); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
        c.stroke();
      });
      const [x, y] = at(m, 0.72, 0.86);
      drawChar(g, ANCHOR, { seed: 2, expr: "shock", headTilt: 0.08 * Math.sin(t * 20), wave: 0.3 + 0.3 * Math.round(Math.sin(t * 16)) }, x, y, m.dh * 0.34, { tint: "#7aa8ff", tintA: 0.12, shadow: 0.4 });
      vignette(g, 0.4);
    },
  },
  { // 13: "But here's the twist. GTA Five made a billion dollars in three days."
    a: 44.5, b: 49.0, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s13, lerp(1.2, 1.08, glide(u)), 0.55, 0.6, ["#3a3a1a", "#1a1a0a"]);
      const p = person(g, m, SAM, 0.42, 0.9, 0.42, { ...idle(t, 3), expr: t > 47.08 ? "shock" : "grin" }, "#ffd84a", 0.15);
      void p;
      if (t > 45.8) {
        const v = Math.round(1000 * glide((t - 46.8) / 1.0));
        badge(g, v >= 1000 ? "$1 BILLION" : `$${v} MILLION`, pk(t, 46.8, 0.2), H * 0.17, "#2a8a3a");
      }
      if (t > 47.96) badge(g, "3 DAYS", pk(t, 47.96, 0.2) * 0.8, H * 0.31, "#ff4fa8");
      for (let i = 0; i < 14 && t > 47.08; i++) { const k = ((t - 47.08) * 0.6 + i / 14) % 1; bill(g, ((i * 337) % W), k * H, t * 3 + i, 1); }
      vignette(g, 0.35);
    },
  },
  { // 14: "So the money doesn't disappear. It just moves to Vice City."
    a: 49.0, b: 99, draw: (g, t, u, im) => {
      const m = bgDraw(g, im.s14, lerp(1.15, 1.05, glide((t - 49) / 3)), 0.5, 0.6, ["#ff9a7a", "#5a3a7a"]);
      for (let i = 0; i < 16; i++) {
        const k = ((t - 49) * 0.45 + i / 16) % 1, sx = lerp(-150, W * 0.7, k), sy = H * 0.65 - Math.sin(k * Math.PI) * H * 0.35 + (i % 4) * 40;
        bill(g, sx, sy, t * 2 + i, 1.1);
      }
      billboard(g, t, pk(t, 51.4, 0.25), "VICE CITY", H * 0.2);
      const p = person(g, m, SAM, 0.7, 0.88, 0.36, { ...idle(t, 3), expr: t > 51.5 ? "laugh" : "smile", wave: t > 51.5 ? 0.3 : undefined }, "#ff8a4a", 0.14);
      gameBox(g, p.x - p.hh * 0.13, p.y - p.hh * 0.42, p.hh * 0.14, -0.05, "VI", "2026", "#ff5f8f", "#5b2a86");
      vignette(g, 0.4);
    },
  },
];

const kick = (t: number) => {
  for (const a of KICKS) { const k = Math.floor((t - a) * FPS); if (k >= 0 && k < 7) return (k % 2 ? -1 : 1) * 11 * (1 - k / 7); }
  return 0;
};
const drawFrame = (g: G, f: number, im: Imgs) => {
  const t = f / FPS;
  const sc = SCENES.find((s) => t >= s.a && t < s.b) ?? SCENES[SCENES.length - 1];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  const k = kick(t); g.translate(k, -k * 0.5);
  sc.draw(g, t, clamp01((t - sc.a) / (Math.min(sc.b, 53) - sc.a)), im);
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const s of SCENES) { const q = Math.floor((t - s.a) * FPS); if (s.a > 0 && q >= 0 && q < 4) { g.fillStyle = `rgba(255,255,255,${[0.7, 0.45, 0.25, 0.1][q]})`; g.fillRect(0, 0, W, H); } }
  if (t > 52.6) { g.fillStyle = `rgba(0,0,0,${clamp01((t - 52.6) / 0.4)})`; g.fillRect(0, 0, W, H); }
};

export const Eco: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [imgs, setImgs] = useState<Imgs | null>(null);
  const [handle] = useState(() => delayRender("eco assets"));
  useEffect(() => {
    const load = (n: string) => new Promise<[string, HTMLImageElement]>((res) => {
      const im = new Image(); im.onload = () => res([n, im]); im.onerror = () => res([n, im]); im.src = staticFile(`eco/${n}.png`);
    });
    Promise.all([Promise.all(Array.from({ length: 14 }, (_, i) => load(`s${i + 1}`))), document.fonts.ready])
      .then(([ims]) => { setImgs(Object.fromEntries(ims)); continueRender(handle); });
  }, [handle]);
  useLayoutEffect(() => { if (imgs && ref.current) drawFrame(ref.current.getContext("2d")!, f, imgs); }, [f, imgs]);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
