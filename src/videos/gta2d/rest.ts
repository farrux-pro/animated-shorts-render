// GTA short, 10.4 s .. end: the remaining scenes. Times are voice word onsets (shorts/gta6/words.json).
import { townsfolk, Outfit, Expr, FrontOpts } from "../bridge/toon";
import {
  drawChar, calendar, gameBox, bgDraw, vignette, font, signBoard, onQuad, SIGN10, MONITOR5, LAPTOP9, blinkAt, at, glide, back, lerp, clamp01,
} from "./Gta2D";

const W = 1080, H = 1920, FPS = 30;
type G = CanvasRenderingContext2D;
type M = { x: number; y: number; dw: number; dh: number };
type Imgs = Record<string, HTMLImageElement>;

// (outfits are defined here, not imported: Gta2D imports this module, so its consts are not ready at load time)
const SAM: Outfit = { jacket: "#2fa7a0", pants: "#3b3f66", boots: "#f4f1ea", hat: "hair", hair: "#4a2f22" };
const KIDSAM: Outfit = { ...SAM, hat: "cap", cap: "#e2453c", build: "kid", jacket: "#f08a2c" };
const ADULT: Outfit = { ...SAM, jacket: "#4f7ad9" };            // Sam at work, 25
const GREY: Outfit = { ...ADULT, hair: "#c9c9c9" };             // the midlife-crisis joke
const SON: Outfit = { ...KIDSAM };                               // his son looks just like little Sam
const TEEN: Outfit = { ...SAM, jacket: "#5b4fa8", hat: "cap", cap: "#e2453c" };
const SOONS = [22.91, 25.44, 28.26, 71.34];
const KICKS = [13.75, 22.91, 25.44, 28.26, 30.51, 39.33, 45.23, 46.35, 49.4, 55.96, 71.34];

const pk = (t: number, t0: number, d = 0.12) => (t < t0 ? 0 : back((t - t0) / d / 1.7));
const person = (g: G, m: M, o: Outfit, u: number, v: number, h: number, opts: FrontOpts, fx: Parameters<typeof drawChar>[6] = {}) => {
  const [x, y] = at(m, u, v);
  drawChar(g, o, opts, x, y, m.dh * h, fx);
};
const idle = (t: number, seed: number) => ({ blink: blinkAt(t, seed), seed, headTilt: Math.round(0.05 * Math.sin(t * 1.4 + seed) * 50) / 50 });

/** red rubber stamp "SOON" slamming onto the frame */
const stamp = (g: G, t: number) => {
  for (const t0 of SOONS) {
    const k = t - t0 + 0.05;
    if (k < 0 || k > 1.4) continue;
    const sc = k < 0.12 ? lerp(2.6, 1, k / 0.12) : 1, a = k > 1.1 ? 1 - (k - 1.1) / 0.3 : 1;
    g.save(); g.globalAlpha = a; g.translate(W / 2, H * 0.3); g.rotate(-0.16); g.scale(sc, sc);
    g.lineWidth = 22; g.strokeStyle = "#e0303a"; g.beginPath(); g.roundRect(-330, -120, 660, 240, 30); g.stroke();
    font(g, 190); g.fillStyle = "#e0303a"; g.fillText("SOON", 0, 8);
    g.restore();
  }
};
const flash = (g: G, t: number, t0: number) => {
  const k = (t - t0) * FPS;
  if (k >= 0 && k < 6) { g.fillStyle = `rgba(255,255,255,${[1, 0.85, 0.6, 0.4, 0.2, 0.08][Math.floor(k)]})`; g.fillRect(0, 0, W, H); }
};
const kick = (t: number) => {
  for (const a of KICKS) { const k = Math.floor((t - a) * FPS); if (k >= 0 && k < 7) return (k % 2 ? -1 : 1) * 12 * (1 - k / 7); }
  return 0;
};
const screen = (g: G, m: M, u0: number, v0: number, u1: number, v1: number, rot: number, draw: (w: number, h: number) => void) => {
  const [x0, y0] = at(m, u0, v0), [x1, y1] = at(m, u1, v1), w = x1 - x0, h = y1 - y0;
  g.save(); g.translate(x0 + w / 2, y0 + h / 2); g.rotate(rot);
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.translate(-w / 2, -h / 2); draw(w, h); g.restore();
};
const phone = (g: G, x: number, y: number, w: number, kind: number) => {
  const h = w * (kind === 0 ? 1.9 : kind === 1 ? 2.05 : 2.15);
  g.save(); g.translate(x, y);
  g.fillStyle = "#1c1c22"; g.strokeStyle = "#241726"; g.lineWidth = 8; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, w * 0.14); g.fill(); g.stroke();
  const pad = kind === 0 ? h * 0.14 : w * 0.05;
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, ["#3a7bd5", "#ff7a59", "#7f5af0"][kind]); gr.addColorStop(1, ["#8e54e9", "#ffcc33", "#2cb67d"][kind]);
  g.fillStyle = gr; g.beginPath(); g.roundRect(-w / 2 + w * 0.06, -h / 2 + pad, w * 0.88, h - 2 * pad, w * 0.08); g.fill();
  if (kind === 0) { g.strokeStyle = "#8a8a94"; g.lineWidth = 5; g.beginPath(); g.arc(0, h / 2 - pad / 2, pad * 0.28, 0, 7); g.stroke(); }
  if (kind === 1) { g.fillStyle = "#1c1c22"; g.beginPath(); g.roundRect(-w * 0.2, -h / 2 + 2, w * 0.4, w * 0.12, 10); g.fill(); }
  if (kind === 2) { g.fillStyle = "#1c1c22"; g.beginPath(); g.arc(0, -h / 2 + w * 0.13, w * 0.04, 0, 7); g.fill(); }
  g.restore();
};
const consoleBox = (g: G, x: number, y: number, w: number, c: string) => {
  g.save(); g.translate(x, y); g.fillStyle = c; g.strokeStyle = "#241726"; g.lineWidth = 10;
  g.beginPath(); g.roundRect(-w / 2, -w * 0.12, w, w * 0.24, 20); g.fill(); g.stroke();
  g.fillStyle = "#241726"; g.fillRect(-w * 0.3, -w * 0.02, w * 0.4, w * 0.035); g.beginPath(); g.arc(w * 0.35, 0, w * 0.03, 0, 7); g.fill();
  g.restore();
};
const bubbleQ = (g: G, x: number, y: number, s: number) => {
  if (s <= 0.01) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = "#fff"; g.strokeStyle = "#241726"; g.lineWidth = 9;
  g.beginPath(); g.ellipse(0, 0, 120, 105, 0, 0, 7); g.fill(); g.stroke();
  for (const [bx, by, r] of [[-70, 120, 22], [-105, 165, 13]]) { g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill(); g.stroke(); }
  font(g, 150); g.fillStyle = "#e0303a"; g.fillText("?", 0, 8);
  g.restore();
};

type Scene = { a: number; b: number; draw: (g: G, t: number, lt: number, u: number, im: Imgs) => void };
const SCENES: Scene[] = [
  { // 10.4 "A twelve-year-old named Sam saves his birthday money and buys it on day one."
    a: 10.4, b: 15.2, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s4, lerp(1.25, 1.12, glide(u)), 0.5, 0.62, ["#c08a5a", "#5a3b2a"]);
      person(g, m, townsfolk(2), 0.38, 0.6, 0.27, { ...idle(t, 2), expr: t > 13.75 ? "grin" : "neutral" }, { tint: "#ffd9a0", tintA: 0.1 });
      const bought = t >= 13.75, lift = glide((t - 13.75) / 0.3);
      person(g, m, KIDSAM, 0.6, 0.9, 0.55 * pk(t, 10.45, 0.3), { ...idle(t, 4), expr: t > 11.4 ? (bought ? "laugh" : "smile") : "neutral", wave: bought ? 0 : undefined }, { tint: "#ffd9a0", tintA: 0.1, shadow: 0.4 });
      const [x, y] = at(m, 0.6, 0.9), hh = m.dh * 0.55;
      if (t > 12.0 && !bought) { // the birthday money: a fan of bills in his hand
        const bw = hh * 0.11; g.save(); g.translate(x - hh * 0.107, y - hh * 0.172); g.rotate(-0.55);
        for (let i = 0; i < 3; i++) { g.rotate(0.2); g.fillStyle = "#7cc47a"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.fillRect(-bw * 0.1, -bw * 0.5, bw, bw * 0.5); g.strokeRect(-bw * 0.1, -bw * 0.5, bw, bw * 0.5); }
        g.fillStyle = "#ffe2c2"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, hh * 0.016, 0, 7); g.fill(); g.stroke();
        g.restore();
      }
      if (bought) gameBox(g, x + hh * 0.165, y - hh * 0.64 + 6 * Math.sin(t * 16), hh * 0.14 * (1 + 0.2 * Math.exp(-(t - 13.75) * 8)), 0.12 * lift);
      vignette(g, 0.35);
    },
  },
  { // 15.2 "He plays it every day. Then every week. Then he starts asking one question. When's the next one?"
    a: 15.2, b: 21.0, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s2, lerp(1.35, 1.2, glide(u)), 0.55, 0.62, ["#9ec3e6", "#5f7fd0"]);
      const dusk = clamp01((t - 16.7) / 2.5);
      g.fillStyle = `rgba(40,30,90,${0.35 * dusk})`; g.fillRect(0, 0, W, H);
      const q = t >= 19.99;
      person(g, m, KIDSAM, 0.42, 0.84, 0.55, { ...idle(t, 4), mode: "sit", expr: q ? "nervous" : t > 16.7 ? "neutral" : "grin", look: q ? 0 : 0.8 }, { tint: dusk > 0.5 ? "#8a7ad0" : "#ffd9a0", tintA: 0.12, shadow: 0.4 });
      const [x, y] = at(m, 0.42, 0.84);
      bubbleQ(g, x + m.dh * 0.13, y - m.dh * 0.31, pk(t, 19.99, 0.18) * 0.75);
      vignette(g, 0.35 + 0.15 * dusk);
    },
  },
  { // 21.0 "The answer is always the same. Soon."
    a: 21.0, b: 23.6, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s5, lerp(1.15, 1.45, glide(u)), lerp(0.5, 0.53, u), lerp(0.55, 0.43, u), ["#1b2440", "#0e1222"]);
      onQuad(g, m, MONITOR5, 800, 560, "monitor2", (c) => {
        c.fillStyle = "#dff0ff"; c.fillRect(0, 0, 800, 560);
        c.fillStyle = "#3a7bd5"; c.fillRect(0, 0, 800, 84);
        font(c, 100, 900); c.fillStyle = "#1c2a44"; c.fillText("NEXT GTA?", 400, 230);
        c.fillStyle = "#b9cbe6"; c.fillRect(90, 340, 620, 34); c.fillRect(90, 410, 440, 34);
        const v = c.createRadialGradient(400, 280, 200, 400, 280, 520); v.addColorStop(0, "rgba(40,90,180,0)"); v.addColorStop(1, "rgba(40,90,180,.35)");
        c.fillStyle = v; c.fillRect(0, 0, 800, 560);
      }, 0.035, 46);
      person(g, m, TEEN, 0.78, 1.02, 0.6, { ...idle(t, 5), expr: t > 22.9 ? "pained" : "neutral", look: -0.8 }, { tint: "#7aa8ff", tintA: 0.2, shadow: 0.3 });
      vignette(g, 0.5);
    },
  },
  { // 23.6 "Sam finishes school. Still soon."
    a: 23.6, b: 26.1, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s6, lerp(1.12, 1.22, glide(u)), 0.5, 0.65, ["#8fd3f0", "#6ab04c"]);
      const jump = t > 24.36 && t < 25.1 ? Math.sin(((t - 24.36) / 0.74) * Math.PI) * 0.05 : 0;
      person(g, m, TEEN, 0.5, 0.9 - jump, 0.5, { ...idle(t, 5), expr: t > 25.18 ? "dazed" : "laugh", wave: t < 25.18 ? Math.round((0.5 + 0.5 * Math.sin(t * 12)) * 4) / 10 : undefined }, { tint: "#ffd9a0", tintA: 0.08 });
      // confetti
      for (let i = 0; i < 40; i++) {
        const k = (t - 24.36) * 0.6 + (i * 0.137) % 1; if (t < 24.36) break;
        const x = ((i * 241) % W) + Math.sin(t * 3 + i) * 30, y = ((k % 1) * H * 0.8);
        g.fillStyle = ["#ff4f7a", "#ffd84a", "#3fc1f0", "#6ad46a"][i % 4]; g.save(); g.translate(x, y); g.rotate(t * 5 + i); g.fillRect(-10, -5, 20, 10); g.restore();
      }
      vignette(g, 0.3);
    },
  },
  { // 26.1 "He gets his driver's license. Still soon."
    a: 26.1, b: 29.0, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s7, lerp(1.2, 1.1, glide(u)), 0.5, 0.62, ["#8fd3f0", "#555"]);
      person(g, m, ADULT, 0.33, 0.88, 0.48, { ...idle(t, 3), expr: t > 28.0 ? "stern" : "grin", wave: t < 28.0 ? 0 : undefined }, { tint: "#ffd9a0", tintA: 0.08 });
      if (t < 28.0) { // the licence card held up
        const [x, y] = at(m, 0.33, 0.88), hh = m.dh * 0.48, p2 = pk(t, 26.6, 0.2);
        g.save(); g.translate(x + hh * 0.165, y - hh * 0.66); g.scale(p2, p2); g.rotate(0.1);
        g.fillStyle = "#f4f1ea"; g.strokeStyle = "#241726"; g.lineWidth = 7; g.beginPath(); g.roundRect(-85, -55, 170, 110, 12); g.fill(); g.stroke();
        g.fillStyle = "#3a7bd5"; g.fillRect(-85, -55, 170, 26); g.fillStyle = "#c9a27a"; g.fillRect(-70, -18, 50, 60);
        g.fillStyle = "#999"; for (let i = 0; i < 3; i++) g.fillRect(-5, -12 + i * 18, 75, 8);
        g.restore();
      }
      vignette(g, 0.3);
    },
  },
  { // 29.0 "Phones get smarter, a pandemic shuts down the planet, and a whole console generation comes and goes."
    a: 29.0, b: 35.1, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s8, lerp(1.1, 1.2, glide(u)), lerp(0.45, 0.55, u), 0.6, ["#9aa4b0", "#555c66"]);
      if (t < 30.4) [29.1, 29.4, 29.6].forEach((t0, i) => phone(g, W * (0.25 + i * 0.25), H * 0.35, 150 * pk(t, t0, 0.15) * (1 + i * 0.12), i));
      const walk = clamp01((t - 30.4) / 4.4);
      if (t > 30.4) {
        const [x, y] = at(m, lerp(0.15, 0.7, walk), 0.86);
        drawChar(g, ADULT, { seed: 3, mode: "stroll", phase: (t * 1.6) % 1, expr: "nervous", blink: blinkAt(t, 3) }, x, y, m.dh * 0.45, { tint: "#9aa4c0", tintA: 0.2 });
      }
      if (t > 32.8) { const k = clamp01((t - 32.8) / 1.6); consoleBox(g, lerp(-300, W + 300, k), H * 0.3 + Math.sin(k * 9) * 20, 420, "#f4f1ea"); consoleBox(g, lerp(-600, W + 100, k), H * 0.42, 380, "#2a2a32"); }
      const grey = clamp01((t - 30.5) / 0.6);
      g.fillStyle = `rgba(60,70,90,${0.25 * grey})`; g.fillRect(0, 0, W, H);
      vignette(g, 0.45);
    },
  },
  { // 35.1 "In 2023, a trailer finally drops. It breaks YouTube records in a single day. Sam watches it on his lunch break, at his first real job."
    a: 35.1, b: 44.3, draw: (g, t, lt, u, im) => {
      if (t < 36.5) {
        bgDraw(g, im.s9, 1.3, 0.5, 0.4, ["#f4e6c8", "#c9b9a0"], 14);
        calendar(g, W / 2, H * 0.43, 760 * back((t - 35.1) / 0.45), clamp01((t - 35.6) / 0.5), "DECEMBER", "2023", 5, 5, 31);
        vignette(g, 0.3); return;
      }
      const zoom = t < 38.4 ? lerp(1.1, 1.2, glide((t - 36.5) / 2)) : t < 40.9 ? lerp(1.2, 1.7, glide((t - 38.4) / 0.6)) : lerp(1.7, 1.15, glide((t - 40.9) / 0.6));
      const m = bgDraw(g, im.s9, zoom, 0.52, t > 38.4 && t < 40.9 ? 0.41 : 0.55, ["#f4e6c8", "#c9b9a0"]);
      const views = t < 38.5 ? 0 : Math.round(90 * glide((t - 38.5) / 1.8) ** 1.5), play = t < 37.4;
      onQuad(g, m, LAPTOP9, 800, 500, `laptop2|${views}|${play}`, (c) => {
        const w = 800, h = 500;
        c.fillStyle = "#14101c"; c.fillRect(0, 0, w, h);
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#ff5f8f"); gr.addColorStop(1, "#3a1d5c");
        c.fillStyle = gr; c.fillRect(0, 0, w, h * 0.74);
        font(c, 110); c.fillStyle = "#fff"; c.fillText("GTA VI", w / 2, h * 0.3);
        if (play) { c.fillStyle = "#e0303a"; c.beginPath(); c.roundRect(w / 2 - 80, h * 0.44, 160, 110, 22); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(w / 2 - 25, h * 0.48); c.lineTo(w / 2 + 35, h * 0.55); c.lineTo(w / 2 - 25, h * 0.62); c.fill(); }
        font(c, 64, 800); c.fillStyle = "#fff"; c.fillText(`${views}M views`, w / 2, h * 0.87);
      }, 0, 14);
      person(g, m, ADULT, 0.75, 0.86, 0.5, { ...idle(t, 3), expr: t > 39.33 && t < 40.9 ? "shock" : "grin", look: -0.8 }, { tint: "#ffe9b0", tintA: 0.08 });
      vignette(g, 0.3);
    },
  },
  { // 44.3 "Then the release date moves. Then it moves again. Fans joke the game will come out after their midlife crisis."
    a: 44.3, b: 50.8, draw: (g, t, lt, u, im) => {
      const punch = t > 49.4 ? glide((t - 49.4) / 0.25) * 0.12 : 0;
      const m = bgDraw(g, im.s10, lerp(1.1, 1.2, glide(u)) + punch, 0.55, lerp(0.4, 0.6, glide(u)), ["#2a1d5c", "#14101c"]);
      const sub = t < 45.23 ? "COMING 2025" : t < 46.35 ? "MAY 2026" : "NOV 2026";
      signBoard(g, m, Math.floor(t * FPS), t, "GTA VI", sub, SIGN10);
      const old = t >= 49.4;
      person(g, m, old ? GREY : ADULT, 0.4, 0.78, 0.4, { ...idle(t, 3), expr: old ? "dazed" : t > 45.23 ? "pained" : "neutral", look: 0.5 }, { tint: "#a07ad0", tintA: 0.22, shadow: 0.5 });
      if (old) { // a walking stick
        const [x, y] = at(m, 0.4, 0.78), hh = m.dh * 0.4;
        g.save(); g.strokeStyle = "#7a4f33"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(x - hh * 0.13, y - hh * 0.385); g.lineTo(x - hh * 0.17, y); g.stroke();
        g.fillStyle = "#ffe2c2"; g.strokeStyle = "#241726"; g.lineWidth = 4; g.beginPath(); g.arc(x - hh * 0.13, y - hh * 0.385, hh * 0.022, 0, 7); g.fill(); g.stroke(); g.restore();
      }
      vignette(g, 0.45);
    },
  },
  { // 50.8 "But here's what nobody planned for. Sam isn't twelve anymore. He's twenty-five. And he has a kid of his own."
    a: 50.8, b: 57.1, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s11, lerp(1.35, 1.1, glide((t - 50.8) / 2.5)), 0.55, 0.65, ["#f4c9a0", "#8a5a3c"]);
      person(g, m, ADULT, 0.38, 0.9, 0.5 * pk(t, 52.7, 0.25), { ...idle(t, 3), expr: t > 55.96 ? "grin" : "smile" }, { tint: "#ffb070", tintA: 0.12, shadow: 0.4 });
      const hop = t > 55.96 ? Math.abs(Math.sin((t - 55.96) * 7)) * 0.02 * Math.exp(-(t - 55.96)) : 0;
      person(g, m, SON, 0.66, 0.9 - hop, 0.42 * pk(t, 55.96, 0.2), { ...idle(t, 6), expr: "laugh", wave: 0.5 + 0.5 * Math.round(Math.sin(t * 12) * 2) / 2 }, { tint: "#ffb070", tintA: 0.12, shadow: 0.4 });
      vignette(g, 0.35);
    },
  },
  { // 57.1 "So tomorrow, Sam will finally walk out of the store with the game he waited thirteen years for. And his little boy will look up and ask, 'Dad, can I play too?'"
    a: 57.1, b: 66.9, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s1, lerp(1.08, 1.18, glide(u)), 0.5, 0.6, ["#ffb36b", "#6a3a7a"]);
      signBoard(g, m, Math.floor(t * FPS), t, "GTA VI", "OUT NOW");
      const w = clamp01((t - 58.9) / 1.6);
      const sv = lerp(0.68, 0.79, glide(w)), su = lerp(0.5, 0.42, glide(w)), sh = lerp(0.2, 0.28, glide(w));
      const walking = w > 0 && w < 1;
      person(g, m, ADULT, su, sv, sh, { ...idle(t, 3), mode: walking ? "stroll" : "stand", phase: (t * 1.6) % 1, expr: t > 60.6 ? "relief" : "smile" }, { tint: "#ff8a4a", tintA: 0.14, shadow: 0.45 });
      const [x, y] = at(m, su, sv), hh = m.dh * sh;
      gameBox(g, x + hh * 0.13, y - hh * 0.42, hh * 0.14, 0.05, "VI", "2026", "#ff5f8f", "#5b2a86");
      const ask = t >= 64.9;
      person(g, m, SON, 0.66, 0.8 - (ask ? Math.abs(Math.sin(t * 9)) * 0.008 : 0), 0.24, { ...idle(t, 6), expr: ask ? "grin" : t > 63.56 ? "smile" : "neutral", look: t > 63.56 ? -0.8 : 0, headTilt: t > 63.56 ? -0.15 : 0, wave: ask ? 0.6 : undefined }, { tint: "#ff8a4a", tintA: 0.14, shadow: 0.45 });
      vignette(g, 0.4);
    },
  },
  { // 66.9 "And Sam will smile and say the only word he's heard for thirteen years. 'Soon.'"
    a: 66.9, b: 99, draw: (g, t, lt, u, im) => {
      const m = bgDraw(g, im.s1, lerp(1.55, 1.75, glide((t - 66.9) / 5)), 0.52, 0.66, ["#ffb36b", "#6a3a7a"]);
      signBoard(g, m, Math.floor(t * FPS), t, "GTA VI", "OUT NOW");
      const smile = t > 67.42, soon = t > 71.34;
      person(g, m, ADULT, 0.42, 0.79, 0.28, { ...idle(t, 3), expr: soon ? "smile" : smile ? "smile_closed" : "neutral", look: 0.6 }, { tint: "#ff8a4a", tintA: 0.14, shadow: 0.45 });
      person(g, m, SON, 0.62, 0.8, 0.24, { ...idle(t, 6), expr: soon ? "shock" : "grin", look: -0.8, headTilt: -0.15 }, { tint: "#ff8a4a", tintA: 0.14, shadow: 0.45 });
      vignette(g, 0.45);
    },
  },
];

export const drawRest = (g: G, f: number, im: Imgs) => {
  const t = f / FPS;
  const sc = SCENES.find((s) => t >= s.a && t < s.b) ?? SCENES[SCENES.length - 1];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  const k = kick(t); g.translate(k, -k * 0.5);
  sc.draw(g, t, t - sc.a, clamp01((t - sc.a) / (Math.min(sc.b, 72.2) - sc.a)), im);
  g.setTransform(1, 0, 0, 1, 0, 0);
  stamp(g, t);
  for (const t0 of [10.4, 35.1, 50.8, 57.1]) flash(g, t, t0);
  // fade to black at the very end
  if (t > 71.9) { g.fillStyle = `rgba(0,0,0,${clamp01((t - 71.9) / 0.3)})`; g.fillRect(0, 0, W, H); }
};
export type { Expr };
