import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { person2, Look } from "./chars";
import { gameBox } from "../gta2d/Gta2D";

const W = 1080, H = 1920;
const SAM: Look = { hair: "short", hairCol: "#4a2f22", shirt: "#2fa7a0", pants: "#3b4a7a", shoes: "#f4f1ea" };
const GIRL: Look = { hair: "long", hairCol: "#3a2418", shirt: "#ff6aa0", pants: "#2a2a40", shoes: "#f4f1ea", fem: true, skin: 1 };
const BLONDE: Look = { hair: "ponytail", hairCol: "#e8b04a", shirt: "#5a8fc2", pants: "#2a3a5a", shoes: "#fff", fem: true, dress: "#5a8fc2" };
const BOSS: Look = { hair: "bald", hairCol: "#9a9a9a", shirt: "#f4f1ea", jacket: "#2a2a40", tie: "#c0303a", pants: "#2a2a40", shoes: "#1a1a1a", moustache: "#777", stout: true };
const WORKER: Look = { hair: "short", hairCol: "#2a1a12", hat: "hardhat", hatCol: "#ffcc33", shirt: "#f0a020", pants: "#3a4a6a", shoes: "#5a3a22", skin: 2 };
const SOLDIER: Look = { hair: "short", hairCol: "#2a1a12", hat: "army", hatCol: "#4a5a32", shirt: "#5a6a3a", pants: "#4a5a32", shoes: "#2a2a1a", skin: 3 };
const PILOT: Look = { hair: "short", hairCol: "#2a1a12", hat: "pilot", hatCol: "#1f2a50", shirt: "#f4f1ea", jacket: "#1f2a50", tie: "#1f2a50", pants: "#1f2a50", shoes: "#111" };
const GENZ: Look = { hair: "spiky", hairCol: "#2fd6cf", shirt: "#7f5af0", pants: "#2a2a40", shoes: "#fff", skin: 1 };

const pad = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#2a2a32"; g.strokeStyle = "#2a1a2e"; g.lineWidth = 7;
  g.beginPath(); g.ellipse(-55, -440, 45, 40, 0.4, 0, 7); g.ellipse(55, -440, 45, 40, -0.4, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(-80, -475, 160, 55, 22); g.fill(); g.stroke();
  for (const [c, x, y] of [["#ff4f7a", 45, -458], ["#3ff0e8", 28, -442], ["#ffd84a", 62, -442]] as const) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
};
const box = (g: CanvasRenderingContext2D) => gameBox(g, 0, -470, 190, 0, "VI", "2026", "#ff5f8f", "#5b2a86");
const phone = (g: CanvasRenderingContext2D) => { g.fillStyle = "#1c1c22"; g.strokeStyle = "#2a1a2e"; g.lineWidth = 6; g.beginPath(); g.roundRect(80, -800, 46, 92, 10); g.fill(); g.stroke(); g.fillStyle = "#5a9ad8"; g.fillRect(87, -792, 32, 74); };

export const CharTest: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [im, setIm] = useState<HTMLImageElement | null>(null);
  const [h] = useState(() => delayRender("bg"));
  useEffect(() => { const i = new Image(); i.onload = () => { setIm(i); continueRender(h); }; i.src = staticFile("eco/s2.png"); }, [h]);
  useLayoutEffect(() => {
    if (!im || !ref.current) return;
    const g = ref.current.getContext("2d")!;
    g.drawImage(im, 0, 0, W, H);
    const row = (y: number, items: [Look, object][]) => items.forEach(([L, o], i) => person2(g, L, o, 140 + i * 265, y, 520));
    row(1000, [
      [SAM, { expr: "smile" }],
      [GIRL, { expr: "laugh", rh: [140, -820] }],
      [BLONDE, { expr: "smug", hold: box, lh: [-88, -470], rh: [88, -470] }],
      [BOSS, { expr: "grin", hold: pad, lh: [-62, -440], rh: [62, -440] }],
    ]);
    row(1800, [
      [WORKER, { expr: "grin", hold: box, lh: [-88, -470], rh: [88, -470] }],
      [SOLDIER, { expr: "neutral", hold: pad, lh: [-62, -440], rh: [62, -440] }],
      [PILOT, { expr: "shock", look: 1 }],
      [GENZ, { expr: "sick", sit: true, hold: phone, rh: [100, -730] }],
    ]);
  }, [im]);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
