// GTA short world: a sunset beach-city street with a game store and palms, and a 2013 bedroom (desk, TV, calendar,
// phone). Built from primitives with painted canvas textures; reuses the bridge engine's two-tone shading, cards and ink.
import * as THREE from "three";
import { lam } from "../bridge/build";
import { ctex, rep, planksHD, cloudHD } from "../bridge/paint";
import { Pen, bodyFront, townsfolk, fxContact, Outfit, Expr } from "../bridge/toon";
import { LIGHTS, LOOK } from "../bridge/lights";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { FPS, SHOTS, shotAt, camAt, dofAt, ROOM_X, PHONE, V3, pop, glide } from "./story";

const SAM: Outfit = { jacket: "#2fa7a0", pants: "#3b3f66", boots: "#f4f1ea", hat: "hair", hair: "#4a2f22" };
const KIDSAM: Outfit = { ...SAM, hat: "cap", cap: "#e2453c", build: "kid", jacket: "#f08a2c" };
const QUEUE: { o: Outfit; x: number; z: number; seed: number; expr: Expr }[] = [
  { o: SAM, x: -0.6, z: -4.2, seed: 3, expr: "dazed" },
  { o: townsfolk(1), x: 0.55, z: -4.0, seed: 5, expr: "nervous" },
  { o: townsfolk(3), x: 1.6, z: -3.75, seed: 2, expr: "stern" },
  { o: townsfolk(4), x: 2.6, z: -3.45, seed: 6, expr: "dazed" },
];

// ---------------- painted textures ----------------
const font = (g: CanvasRenderingContext2D, px: number, w = 900) => { g.font = `${w} ${px}px "DejaVu Sans", Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; };
const neonText = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col: string) => {
  font(g, px);
  g.shadowColor = col; g.shadowBlur = px * 0.5; g.strokeStyle = col; g.lineWidth = px * 0.09; g.strokeText(s, x, y);
  g.shadowBlur = px * 0.2; g.fillStyle = "#ffffff"; g.fillText(s, x, y); g.shadowBlur = 0;
};
const signTex = () => ctex("gtaSign", 1024, 384, (g) => {
  g.fillStyle = "#1b1030"; g.fillRect(0, 0, 1024, 384);
  g.strokeStyle = "#ff4fa8"; g.lineWidth = 14; g.strokeRect(18, 18, 988, 348);
  neonText(g, "GTA VI", 512, 165, 190, "#ff4fa8");
  neonText(g, "COMING SOON", 512, 305, 70, "#3ff0e8");
});
const facadeTex = (key: string, wall: string, trim: string, door: boolean) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.03 + 0.04 * r()})`; g.fillRect(r() * 512, r() * 512, 3 + 8 * r(), 2 + 4 * r()); }
  g.fillStyle = trim; g.fillRect(0, 0, 512, 26); g.fillRect(0, 486, 512, 26);
  const win = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = trim; g.fillRect(x - 8, y - 8, w + 16, h + 16);
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "#9fd8f0"); gr.addColorStop(1, "#4a7fb8");
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(x + w * 0.2, y); g.lineTo(x + w * 0.45, y); g.lineTo(x + w * 0.15, y + h); g.lineTo(x, y + h * 0.8); g.fill();
  };
  win(60, 70, 150, 120); win(302, 70, 150, 120);
  if (door) { win(60, 290, 150, 170); g.fillStyle = "#5a3b2a"; g.fillRect(300, 280, 150, 206); g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(430, 390, 8, 0, 7); g.fill(); }
  else { win(60, 290, 150, 140); win(302, 290, 150, 140); }
});
const storeTex = () => ctex("gtaStore", 1024, 768, (g) => {
  g.fillStyle = "#f7b7c9"; g.fillRect(0, 0, 1024, 768);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1024, 30); g.fillRect(0, 300, 1024, 22);
  // shop windows with "posters" + glass door
  const gr = g.createLinearGradient(0, 360, 0, 768); gr.addColorStop(0, "#5fb7d6"); gr.addColorStop(1, "#2a5f8f");
  g.fillStyle = gr; g.fillRect(40, 360, 360, 380); g.fillRect(624, 360, 360, 380);
  g.fillStyle = "#26324a"; g.fillRect(430, 360, 164, 408);
  g.fillStyle = "#8fd3e8"; g.fillRect(445, 375, 134, 393);
  for (const x0 of [70, 654]) {
    g.fillStyle = "#ff8a3d"; g.fillRect(x0 + 40, 400, 220, 290);
    const s = g.createLinearGradient(0, 400, 0, 690); s.addColorStop(0, "#ffcf5a"); s.addColorStop(0.55, "#ff5f8f"); s.addColorStop(1, "#5b2a86");
    g.fillStyle = s; g.fillRect(x0 + 48, 408, 204, 274);
    g.fillStyle = "#1b1030"; g.beginPath(); g.moveTo(x0 + 70, 682); g.lineTo(x0 + 110, 560); g.lineTo(x0 + 118, 682); g.fill();
    font(g, 54); g.fillStyle = "#ffffff"; g.fillText("VI", x0 + 150, 470);
    font(g, 22, 700); g.fillText("PRE-ORDER", x0 + 150, 640);
  }
});
const calendarTex = () => ctex("cal2013", 600, 760, (g) => {
  g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, 600, 760);
  g.fillStyle = "#d8423a"; g.fillRect(0, 0, 600, 190);
  g.fillStyle = "#3a3a3a"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(50 + i * 62.5, 14, 9, 0, 7); g.fill(); }
  font(g, 74); g.fillStyle = "#ffffff"; g.fillText("SEPTEMBER", 300, 80); font(g, 60, 700); g.fillText("2013", 300, 150);
  font(g, 26, 700); g.fillStyle = "#777";
  ["S", "M", "T", "W", "T", "F", "S"].forEach((d, i) => g.fillText(d, 60 + i * 80, 225));
  font(g, 34, 700);
  for (let d = 1; d <= 30; d++) {
    const c = (d - 1) % 7, row = Math.floor((d - 1) / 7), x = 60 + c * 80, y = 290 + row * 90;
    g.fillStyle = "#333"; g.fillText(String(d), x, y);
    if (d === 17) { g.strokeStyle = "#d8423a"; g.lineWidth = 7; g.beginPath(); g.ellipse(x, y, 36, 32, -0.2, 0, 7); g.stroke(); }
  }
});
const wallTex = () => ctex("wall2013", 512, 512, (g) => {
  g.fillStyle = "#9ec3e6"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "#8fb6dd"; g.fillRect(x, 0, 26, 512); }
});
const posterTex = () => ctex("carPoster", 512, 700, (g) => {
  const s = g.createLinearGradient(0, 0, 0, 700); s.addColorStop(0, "#ffb347"); s.addColorStop(0.6, "#ff5f8f"); s.addColorStop(1, "#3a1d5c");
  g.fillStyle = s; g.fillRect(0, 0, 512, 700);
  g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(256, 330, 110, 0, 7); g.fill();
  g.fillStyle = "#24123d"; g.fillRect(0, 430, 512, 270);
  g.fillStyle = "#e23d4f"; g.beginPath(); g.roundRect(90, 470, 330, 70, 30); g.fill(); g.beginPath(); g.roundRect(170, 430, 170, 60, 26); g.fill();
  g.fillStyle = "#111"; for (const x of [160, 350]) { g.beginPath(); g.arc(x, 545, 30, 0, 7); g.fill(); }
  g.fillStyle = "#24123d"; g.fillRect(40, 250, 14, 220); g.fillRect(460, 230, 14, 240);
  g.fillStyle = "#fff"; g.lineWidth = 10; g.strokeStyle = "#fff"; g.strokeRect(5, 5, 502, 690);
});
const boxTex = () => ctex("gtaVbox", 300, 400, (g) => {
  const s = g.createLinearGradient(0, 0, 0, 400); s.addColorStop(0, "#1f6fb8"); s.addColorStop(1, "#0d2f5c");
  g.fillStyle = s; g.fillRect(0, 0, 300, 400);
  g.fillStyle = "#ffcc33"; g.fillRect(0, 0, 300, 60);
  font(g, 34); g.fillStyle = "#14254a"; g.fillText("2013", 150, 32);
  font(g, 120); g.fillStyle = "#ffffff"; g.strokeStyle = "#14254a"; g.lineWidth = 10; g.strokeText("GTA", 150, 175); g.fillText("GTA", 150, 175);
  font(g, 150); g.strokeText("V", 150, 310); g.fillStyle = "#ff5f5f"; g.fillText("V", 150, 310);
  g.strokeStyle = "#241726"; g.lineWidth = 14; g.strokeRect(7, 7, 286, 386);
});
const phoneTex = () => ctex("phone2013", 260, 520, (g) => {
  g.fillStyle = "#1c1c22"; g.beginPath(); g.roundRect(0, 0, 260, 520, 40); g.fill();
  const s = g.createLinearGradient(0, 70, 0, 430); s.addColorStop(0, "#3a7bd5"); s.addColorStop(1, "#8e54e9");
  g.fillStyle = s; g.fillRect(18, 70, 224, 370);
  const cols = ["#4cd964", "#ff9500", "#ff2d55", "#5ac8fa", "#ffcc00", "#ffffff", "#34aadc", "#ff3b30"];
  for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.roundRect(34 + (i % 4) * 50, 92 + Math.floor(i / 4) * 62, 40, 40, 10); g.fill(); }
  g.fillStyle = "#333"; g.fillRect(100, 34, 60, 8);
  // THE home button
  g.fillStyle = "#0e0e12"; g.beginPath(); g.arc(130, 480, 26, 0, 7); g.fill();
  g.strokeStyle = "#8a8a94"; g.lineWidth = 5; g.beginPath(); g.arc(130, 480, 26, 0, 7); g.stroke();
  g.strokeRect(120, 470, 20, 20);
});

// ---------------- helpers ----------------
const box = (R: THREE.Object3D, mat: THREE.Material | THREE.Material[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; R.add(m); return m;
};
const glow = (map: THREE.Texture, k = 1.6) => new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k) });
const flat = (map: THREE.Texture) => lam("tex" + map.uuid, () => ({ map }));
const col = (c: string) => lam("c" + c, () => ({ color: c }));
/** face-textured box: the texture only on +z, plain colour elsewhere */
const fronted = (map: THREE.Material, side: THREE.Material) => [side, side, side, side, map, side];

const palm = (R: THREE.Object3D, x: number, z: number, h: number, lean: number, seed: number) => {
  const trunk = col("#a9825a"), ring = col("#8a6646"), leaf = col("#3f9e4a"), leaf2 = col("#2f8a40");
  const n = 9; let px = x, py = 0, pz = z;
  for (let i = 0; i < n; i++) {
    const t = i / n, r = 0.2 - 0.07 * t, seg = h / n;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, seg * 1.04, 10), i % 2 ? ring : trunk);
    const dx = lean * Math.sin(t * 1.4) * 0.6;
    m.position.set(px + dx / 2, py + seg / 2, pz); m.rotation.z = -Math.atan2(dx, seg);
    m.castShadow = m.receiveShadow = true; R.add(m);
    px += dx; py += seg;
  }
  const top = new THREE.Vector3(px, py, pz);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + seed, g = new THREE.Group();
    g.position.copy(top); g.rotation.y = a;
    // a frond = 4 chained slats curving down from the crown
    let fy = 0, fz = 0.1, ang = -0.35 + 0.12 * Math.sin(seed * 3 + k);
    for (let j = 0; j < 4; j++) {
      const len = 0.75, w = 0.46 - j * 0.09;
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, len), j % 2 ? leaf2 : leaf);
      f.rotation.x = ang;
      f.position.set(0, fy - Math.sin(ang) * len / 2, fz + Math.cos(ang) * len / 2);
      fy -= Math.sin(ang) * len; fz += Math.cos(ang) * len; ang += 0.32;
      f.castShadow = true; g.add(f);
    }
    R.add(g);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), col("#7a5a2e")); nut.position.copy(top).y -= 0.15; R.add(nut);
};

const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1200, 2000, 2.0] : d < 6.5 ? [720, 1200, 1.2] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number) => Math.round(v * 60) / 60;

// ---------------- world ----------------
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private gameBox: THREE.Mesh;

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32, d = 600;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.golden[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 140 + (i % 3) * 40;
      m.position.set(Math.cos(a) * d, 70 + (i % 3) * 45, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    this.buildStreet(R);
    this.buildRoom(R);
    this.gameBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.27, 0.025), fronted(glow(boxTex(), 1.0), col("#0d2f5c")));
    this.gameBox.castShadow = true; R.add(this.gameBox);
  }

  private buildStreet(R: THREE.Object3D) {
    box(R, col("#4a4a5a"), -120, -0.1, -120, 120, 0, 120);                       // asphalt
    box(R, col("#d9cbb5"), -60, 0, -9, 60, 0.15, -2.2);                          // sidewalk
    for (let x = -40; x < 40; x += 4) box(R, col("#f2e9d8"), x, 0.001, 1.2, x + 2, 0.012, 1.45); // lane dashes
    box(R, col("#c9b9a0"), -60, 0, -2.3, 60, 0.17, -2.15);                       // kerb
    // the store
    box(R, fronted(flat(storeTex()), col("#f7b7c9")), -4, 0, -10, 4, 6.2, -6);
    box(R, col("#ffffff"), -4.2, 6.2, -10.2, 4.2, 6.5, -5.8);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.95, 0.25), fronted(glow(signTex(), 1.7), col("#1b1030")));
    sign.position.set(0, 5.05, -5.75); sign.castShadow = true; R.add(sign);
    box(R, col("#ff4fa8"), -3.9, 3.4, -5.95, 3.9, 3.55, -5.2);                   // awning edge
    // neighbours and the skyline
    const walls: [string, string][] = [["#ffd9a0", "#ffffff"], ["#a8e0d2", "#ffffff"], ["#c9b3f0", "#ffffff"], ["#ffe8a3", "#e98a6a"], ["#9fd0f5", "#ffffff"]];
    let x = 4.4, i = 0;
    for (const s of [1, -1]) {
      x = 4.4;
      for (let k = 0; k < 6; k++, i++) {
        const w = 6 + (i % 3) * 1.5, h = 5 + ((i * 7) % 5) * 1.6, [wall, trim] = walls[i % walls.length];
        const x0 = s > 0 ? x : -x - w;
        box(R, fronted(flat(facadeTex("fac" + i, wall, trim, k % 2 === 0)), col(wall)), x0, 0, -11 - (k % 2) * 0.8, x0 + w, h, -6.2 - (k % 2) * 0.8);
        x += w + 0.4;
      }
    }
    for (let k = 0; k < 14; k++) {
      const bx = -90 + k * 13 + ((k * 37) % 7), h = 18 + ((k * 53) % 30), w = 8 + (k % 3) * 3;
      box(R, col(["#e8d5c4", "#cfe3f0", "#f4c9c0", "#dcd2f0"][k % 4]), bx, 0, -70 - (k % 3) * 12, bx + w, h, -60 - (k % 3) * 12);
    }
    for (const [px, pz, h, ln, sd] of [[-5.2, -3.0, 7.5, 0.9, 0.2], [5.4, -3.1, 8.2, -1.0, 1.1], [-13, -3.4, 7.0, 0.6, 2.0], [14, -3.3, 7.8, -0.5, 0.7], [-24, -3.5, 8.5, 0.8, 1.6], [25, -3.6, 7.2, -0.7, 0.4]])
      palm(R, px, pz, h, ln, sd);
  }

  private buildRoom(R: THREE.Object3D) {
    const X = ROOM_X, wood = lam("planksHD", () => ({ map: rep(planksHD(), 2, 2) }));
    box(R, wood, X - 3, -0.1, -3, X + 3, 0, 3);
    const wall = flat(rep(wallTex(), 3, 1.5));
    box(R, wall, X - 3, 0, -3.2, X + 3, 3, -3);                         // back wall
    box(R, wall, X - 3.2, 0, -3.2, X - 3, 3, 1.2);                       // left wall
    box(R, col("#f4efe4"), X - 3, 0, -3.0, X + 3, 0.12, -2.95);           // skirting
    // calendar + poster
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.76), glow(calendarTex(), 1.0)); cal.position.set(X - 1.6, 1.75, -2.97); R.add(cal);
    const pos = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.16), glow(posterTex(), 1.0)); pos.position.set(X - 0.3, 1.85, -2.97); R.add(pos);
    // bed
    box(R, col("#7a5a3e"), X - 2.95, 0, -2.9, X - 1.3, 0.42, -0.7);
    box(R, col("#e85a5a"), X - 2.95, 0.42, -2.6, X - 1.3, 0.56, -0.7);
    box(R, col("#ffffff"), X - 2.8, 0.42, -2.9, X - 1.5, 0.62, -2.55);
    // desk, CRT tv, console, phone
    box(R, col("#c08a5a"), X + 0.9, 0.74, -2.95, X + 2.6, 0.8, -1.6);
    for (const [lx, lz] of [[X + 0.95, -2.9], [X + 2.5, -2.9], [X + 0.95, -1.7], [X + 2.5, -1.7]]) box(R, col("#9a6a44"), lx, 0, lz, lx + 0.07, 0.74, lz + 0.07);
    box(R, col("#2a2a32"), X + 1.25, 0.8, -2.9, X + 2.15, 1.5, -2.25);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.52), glow(posterTex(), 1.25)); scr.position.set(X + 1.7, 1.15, -2.245); R.add(scr);
    box(R, col("#1c1c22"), X + 2.2, 0.8, -2.6, X + 2.5, 0.88, -2.3);
    const stand = box(R, col("#5a5a66"), PHONE[0] - 0.04, 0.8, PHONE[2] - 0.05, PHONE[0] + 0.04, 0.83, PHONE[2] + 0.02);
    stand.castShadow = false;
    const phone = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.13, 0.009), fronted(glow(phoneTex(), 1.0), col("#1c1c22")));
    phone.position.set(...PHONE); phone.rotation.x = -0.18; phone.castShadow = true; R.add(phone);
    // rug
    box(R, col("#5f7fd0"), X - 1.2, 0.0, -1.9, X + 1.3, 0.015, 0.2);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = shotAt(f), L = LIGHTS[s.light], K = LOOK[s.light];
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = c.near; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // camera-relative sun
    const fwd = new THREE.Vector3(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize();
    const az = THREE.MathUtils.degToRad(s.sunAz), el = THREE.MathUtils.degToRad(s.sunEl);
    const hx = fwd.x * Math.cos(az) - fwd.z * Math.sin(az), hz = fwd.z * Math.cos(az) + fwd.x * Math.sin(az);
    const sunDir = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    const focus = new THREE.Vector3(...(s.id === 1 ? [0, 1, -4] as V3 : [ROOM_X, 1, -1.5] as V3));
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = s.id === 1 ? 22 : 6;
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 300; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = s.id === 1 ? 40 : 60; this.fog.far = s.id === 1 ? 260 : 400;
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.visible = s.id === 1; m.lookAt(cam.position.x, m.position.y, cam.position.z); }

    // ---- cast ----
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const light = Math.round(Math.atan2(-sunDir.y, sunDir.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
    type P = { o: Outfit; x: number; z: number; seed: number; expr: Expr; wave?: number; headTilt?: number };
    const people: P[] = [];
    const blinkAt = (seed: number) => ((t + seed * 0.37) % 2.3) < 0.13;
    if (s.id === 1) for (const p of QUEUE) people.push({ ...p, headTilt: q(0.04 * Math.sin(t * 1.3 + p.seed)) });
    let kidHand = 0;
    if (s.id === 2) {
      const lift = glide((f - 203) / 10), cheer = f >= 243;
      kidHand = lift;
      people.push({ o: KIDSAM, x: ROOM_X + 0.15, z: -1.2, seed: 4, expr: cheer ? "laugh" : f >= 203 ? "grin" : "smile",
        wave: cheer ? q(0.5 + 0.5 * Math.sin(t * 14)) : undefined, headTilt: cheer ? q(0.06 * Math.sin(t * 12)) : 0 });
    }
    let ai = 0, fi = 0;
    const used: Actor[] = [], fused: Fx[] = [];
    for (const p of people) {
      const d = cam.position.distanceTo(new THREE.Vector3(p.x, 1.1, p.z));
      const [w, h, k] = tier(d);
      const opts = { mode: "stand" as const, expr: p.expr, blink: blinkAt(p.seed) && p.expr !== "laugh", light, seed: p.seed, wave: p.wave, headTilt: p.headTilt ?? 0 };
      const a = this.actor(ai++);
      a.r = this.pool.req(`F|${p.o.jacket}${p.o.hat}${p.o.build}|${JSON.stringify(opts)}`, w, h, k, (pen: Pen) => bodyFront(pen, p.o, opts));
      a.mesh.visible = true; a.mesh.position.set(p.x, 0, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0); a.mesh.scale.set(1, 1, 1);
      used.push(a);
      const e = this.fx(fi++), cc = s.light === "golden" ? "#7a6a8a" : "#8a8aa8";
      e.r = this.pool.req(`blob|contact|${cc}`, 128, 128, 1, (pen: Pen) => fxContact(pen, cc));
      e.use(false); e.mesh.visible = true; e.mesh.position.set(p.x, s.id === 1 ? 0.152 : 0.018, p.z + 0.02);
      e.mesh.rotation.set(-Math.PI / 2, 0, 0); e.mesh.scale.set(0.6, 0.42, 1); fused.push(e);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    // the game box in the kid's hands: held low, raised on "Grand Theft Auto Five", pops on "out"
    const gb = this.gameBox;
    gb.visible = s.id === 2;
    if (gb.visible) {
      const pk = f >= 243 ? 1 + 0.12 * (1 - pop((f - 243) / 12)) : 1;
      gb.position.set(ROOM_X + 0.15 - 0.14 * kidHand, 0.5 + 0.08 * kidHand + 0.025 * Math.sin(t * 9) * (f >= 243 ? 1 : 0), -1.08);
      gb.rotation.set(0, Math.atan2(cam.position.x - gb.position.x, cam.position.z - gb.position.z), -0.12 + 0.12 * kidHand);
      gb.scale.setScalar(pk);
    }
    void SHOTS; void dofAt;
    return new THREE.Vector3(...c.look);
  }
}
