// 3D city world from Kenney CC0 kits (public/k3/{car,com,road,nat}) + flat cartoon people cards (chars.ts).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { twoTone, TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK } from "../bridge/lights";
import { cloudHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { person2, Look, Pose } from "../chars/chars";
import { neon, gameBox } from "../gta2d/Gta2D";
import { FPS, shotAt, camAt, taxiZ, OFFICE_X, V3 } from "./story";

const MODELS: Record<string, string> = {
  taxi: "car/taxi", sedan: "car/sedan", suv: "car/suv", police: "car/police", van: "car/van", sport: "car/sedan-sports", hatch: "car/hatchback-sports",
  road: "road/road-straight", cross: "road/road-crossroad", lamp: "road/light-curved", tlight: "road/traffic-light",
  palm: "nat/tree_palmTall", palm2: "nat/tree_palm", palmBend: "nat/tree_palmBend", bush: "nat/plant_bushLarge", oak: "nat/tree_oak",
  awning: "com/detail-awning-wide",
  ...Object.fromEntries("abcdefghijklmn".split("").map((c) => [`b${c}`, `com/building-${c}`])),
  ...Object.fromEntries("abcde".split("").map((c) => [`sky${c}`, `com/building-skyscraper-${c}`])),
};
export type Kit = Record<string, THREE.Object3D>;
let kitP: Promise<Kit> | null = null;
export const loadCity = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(Object.entries(MODELS).map(([k, p]) => loader.loadAsync(staticFile(`k3/${p}.glb`)).then((g) => [k, g.scene] as const).catch(() => [k, null] as const)))
      .then((l) => Object.fromEntries(l.filter((e) => e[1]).map(([k, s]) => [k, s!])) as Kit);
  }
  return kitP;
};

// Kenney PBR materials -> the engine's two-tone toon Lambert (one lighting model for the whole world)
const matCache = new Map<string, THREE.Material>();
const toon = (m: THREE.Material) => {
  let t = matCache.get(m.uuid);
  if (!t) {
    const s = m as THREE.MeshStandardMaterial;
    t = twoTone(new THREE.MeshLambertMaterial({ map: s.map ?? null, color: s.color ?? new THREE.Color(1, 1, 1), vertexColors: (s as unknown as { vertexColors: boolean }).vertexColors }));
    matCache.set(m.uuid, t);
  }
  return t;
};
const box3 = new THREE.Box3(), v3 = new THREE.Vector3();
/** clone a model, scale it so its height is h (or its longest side is len), stand it on the ground at (x, z) */
const inst = (kit: Kit, name: string, x: number, z: number, rotY: number, size: { h?: number; len?: number }, y = 0) => {
  const src = kit[name];
  if (!src) return null;
  const o = src.clone(true);
  o.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh) { m.material = Array.isArray(m.material) ? m.material.map(toon) : toon(m.material); m.castShadow = m.receiveShadow = true; } });
  box3.setFromObject(o); box3.getSize(v3);
  const k = size.h ? size.h / v3.y : size.len! / Math.max(v3.x, v3.z);
  const g = new THREE.Group(); o.scale.setScalar(k);
  box3.setFromObject(o); const c = box3.getCenter(new THREE.Vector3());
  o.position.set(-c.x, -box3.min.y, -c.z); g.add(o);
  g.position.set(x, y, z); g.rotation.y = rotY;
  return g;
};

// ---------------- flat cartoon people (cards) ----------------
class Card {
  cv = document.createElement("canvas"); tex: THREE.CanvasTexture; mesh: THREE.Mesh; key = "";
  constructor(parent: THREE.Object3D) {
    this.cv.width = 700; this.cv.height = 1100;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const geo = new THREE.PlaneGeometry(1.4, 2.2); geo.translate(0, 1.1 - 0.1, 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh.layers.set(NOINK); this.mesh.renderOrder = 1; parent.add(this.mesh);
  }
  draw(look: Look, pose: Pose, mirror: boolean, extra = "") {
    const key = JSON.stringify([look, { ...pose, hold: !!pose.hold }, mirror, extra]);
    if (key !== this.key) {
      const g = this.cv.getContext("2d")!; g.clearRect(0, 0, 700, 1100);
      person2(g, look, pose, 350, 1050, 1000, { mirror, shadow: 0 });
      this.tex.needsUpdate = true; this.key = key;
    }
  }
}
const shadowBlob = (parent: THREE.Object3D) => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(30,20,50,.55)"); gr.addColorStop(1, "rgba(30,20,50,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.layers.set(NOINK); parent.add(m); return m;
};

const LOOKS: Look[] = [
  { hair: "long", hairCol: "#3a2418", shirt: "#ff6aa0", pants: "#2a2a40", shoes: "#f4f1ea", fem: true, skin: 1 },
  { hair: "short", hairCol: "#4a2f22", shirt: "#2fa7a0", pants: "#3b4a7a", shoes: "#f4f1ea" },
  { hair: "ponytail", hairCol: "#e8b04a", shirt: "#5a8fc2", pants: "#2a3a5a", shoes: "#fff", fem: true },
  { hair: "spiky", hairCol: "#2fd6cf", shirt: "#7f5af0", pants: "#2a2a40", shoes: "#fff", skin: 1 },
  { hair: "short", hairCol: "#1a1a1a", shirt: "#f0a020", pants: "#3a4a6a", shoes: "#5a3a22", skin: 3 },
];
const OFFICE: Look[] = [
  { hair: "short", hairCol: "#2a1a12", shirt: "#f4f1ea", jacket: "#2a3a6a", tie: "#c0303a", pants: "#2a2a40", shoes: "#1a1a1a" },
  { hair: "long", hairCol: "#8a3a2a", shirt: "#f4f1ea", jacket: "#5a5a6a", pants: "#2a2a40", shoes: "#1a1a1a", fem: true, skin: 1 },
  { hair: "short", hairCol: "#4a2f22", shirt: "#bfe0f0", tie: "#2a3a6a", pants: "#3a3a4a", shoes: "#1a1a1a" },   // Sam: he turns back
  { hair: "bob", hairCol: "#1a1a1a", shirt: "#f4f1ea", jacket: "#7a2a3a", pants: "#2a2a40", shoes: "#1a1a1a", fem: true, skin: 2 },
  { hair: "bald", hairCol: "#8a8a8a", shirt: "#f4f1ea", jacket: "#3a3a3a", tie: "#2a6a3a", pants: "#2a2a40", shoes: "#1a1a1a", moustache: "#666", skin: 3 },
];
const boxHold = (g: CanvasRenderingContext2D) => gameBox(g, 0, -470, 190, 0, "VI", "2026", "#ff5f8f", "#5b2a86");

export class World {
  root = new THREE.Group();
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
  private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 60, 600);
  private clouds: THREE.Mesh[] = [];
  private taxi: THREE.Object3D | null; private oncoming: THREE.Object3D | null;
  private cards: Card[] = []; private blobs: THREE.Mesh[] = [];

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0)); vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, d = 650;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 160 + (i % 3) * 50; m.position.set(Math.cos(a) * d, 110 + (i % 4) * 35, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    const add = (o: THREE.Object3D | null) => { if (o) R.add(o); return o; };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), twoTone(new THREE.MeshLambertMaterial({ color: "#cfc6b6" })));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; R.add(ground);
    for (const X of [0, OFFICE_X]) {
      // grass strips beyond the buildings
      for (const s of [-1, 1]) { const gs = new THREE.Mesh(new THREE.PlaneGeometry(200, 400), twoTone(new THREE.MeshLambertMaterial({ color: "#7cbf5a" }))); gs.rotation.x = -Math.PI / 2; gs.position.set(X + s * 130, 0.01, -60); gs.receiveShadow = true; R.add(gs); }
      for (let z = 80; z >= -200; z -= 10) add(inst(kit, z === -60 ? "cross" : "road", X, z, 0, { len: 10 }, 0.02));
    }
    // ---- Vice City street ----
    const bnames = "abcdefghijklmn".split("").map((c) => `b${c}`);
    let i = 0;
    for (const s of [-1, 1]) for (let z = 60; z >= -150; z -= 13) {
      if (s > 0 && Math.abs(z - -43) < 7) continue; // the store slot
      add(inst(kit, bnames[i++ % bnames.length], s * 15, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, { len: 12 }));
    }
    const store = add(inst(kit, "bc", 15, -43, -Math.PI / 2, { len: 13 }));
    for (let z = 52; z >= -150; z -= 12) for (const s of [-1, 1]) {
      add(inst(kit, (z / 12) % 2 ? "palm" : "palmBend", s * 7.6, z + (s > 0 ? 0 : 6), s * 0.4, { h: 9 + ((z * 7) % 3) }));
    }
    for (let z = 46; z >= -150; z -= 26) for (const s of [-1, 1]) add(inst(kit, "lamp", s * 6.2, z, s > 0 ? Math.PI : 0, { h: 7 }));
    // GTA VI billboard on the store roof, facing the street (-x)
    const bb = document.createElement("canvas"); bb.width = 1024; bb.height = 440;
    const bg = bb.getContext("2d")!; bg.fillStyle = "#1e1430"; bg.fillRect(0, 0, 1024, 440);
    bg.save(); bg.shadowColor = "#ff4fa8"; bg.shadowBlur = 30; bg.strokeStyle = "#ffd0ea"; bg.lineWidth = 12; bg.beginPath(); bg.roundRect(30, 30, 964, 380, 30); bg.stroke(); bg.restore();
    neon(bg, "GTA VI", 512, 185, 220, "#ff4fa8"); neon(bg, "OUT NOW", 512, 340, 84, "#3ff0e8");
    const bt = new THREE.CanvasTexture(bb); bt.colorSpace = THREE.SRGBColorSpace;
    const storeH = store ? new THREE.Box3().setFromObject(store).max.y : 12;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 4.7), new THREE.MeshBasicMaterial({ map: bt, color: new THREE.Color(1.6, 1.6, 1.6) }));
    board.position.set(10.5, storeH + 3.2, -43); board.rotation.y = -Math.PI / 2; R.add(board);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 11.6), twoTone(new THREE.MeshLambertMaterial({ color: "#2a2236" })));
    frame.position.set(10.75, storeH + 3.2, -43); frame.castShadow = true; R.add(frame);
    for (const dz of [-4, 4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.3), twoTone(new THREE.MeshLambertMaterial({ color: "#3a3a44" }))); p.position.set(11, storeH + 0.6, -43 + dz); R.add(p); }
    this.taxi = add(inst(kit, "taxi", 2.4, 0, Math.PI, { len: 4.6 }));
    this.oncoming = add(inst(kit, "sport", -2.4, 0, 0, { len: 4.6 }));
    add(inst(kit, "sedan", 4.2, -26, Math.PI, { len: 4.6 })); add(inst(kit, "van", -4.2, -58, 0, { len: 5.2 }));
    // ---- office district ----
    const X = OFFICE_X;
    add(inst(kit, "skya", X + 18, -4, -Math.PI / 2, { h: 46 })); add(inst(kit, "skyb", X + 18, -28, -Math.PI / 2, { h: 38 }));
    add(inst(kit, "skyc", X + 18, 20, -Math.PI / 2, { h: 34 })); add(inst(kit, "skyd", X - 18, -10, Math.PI / 2, { h: 42 }));
    add(inst(kit, "skye", X - 18, 16, Math.PI / 2, { h: 30 })); add(inst(kit, "skyb", X + 20, -60, -Math.PI / 2, { h: 50 }));
    for (const [n, cz] of [["suv", -14], ["sedan", -20], ["police", 26], ["hatch", -32]] as const) add(inst(kit, n, X - 4.2, cz, 0, { len: 4.6 }));
    for (let z = 30; z >= -40; z -= 14) { add(inst(kit, "oak", X + 8.5, z + 7, 0, { h: 7 })); add(inst(kit, "lamp", X + 6.2, z, Math.PI, { h: 7 })); }
    for (let k = 0; k < 6; k++) { this.cards.push(new Card(R)); this.blobs.push(shadowBlob(R)); }
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = shotAt(f), L = LIGHTS[s.light], K = LOOK[s.light], c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.layers.enable(NOINK);
    const fwd = new THREE.Vector3(c.look[0] - c.pos[0], 0, c.look[2] - c.pos[2]).normalize();
    const az = THREE.MathUtils.degToRad(s.sunAz), el = THREE.MathUtils.degToRad(s.sunEl);
    const sunDir = new THREE.Vector3((fwd.x * Math.cos(az) - fwd.z * Math.sin(az)) * Math.cos(el), Math.sin(el), (fwd.z * Math.cos(az) + fwd.x * Math.sin(az)) * Math.cos(el)).normalize();
    const focus = new THREE.Vector3(...c.look);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    this.sun.position.copy(focus).addScaledVector(sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera, Rr = 60; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 450; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * 4;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms; K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = 80; this.fog.far = 700; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);
    // traffic
    if (this.taxi) this.taxi.position.z = taxiZ(f);
    if (this.oncoming) this.oncoming.position.z = -90 + f * 0.38;
    // people
    type Pl = { look: Look; pose: Pose; x: number; z: number; mirror?: boolean };
    const ppl: Pl[] = [];
    const blink = (seed: number) => ((t + seed * 0.37) % 2.4) < 0.12;
    if (s.id === 1) {
      LOOKS.forEach((lk, i) => {
        const cheer = t > 1.66, jump = cheer ? Math.abs(Math.sin((t - 1.66) * 7 + i)) * 0.18 : 0;
        ppl.push({ look: lk, x: 9.2 + (i % 2) * 0.6, z: -38.5 - i * 1.7, pose: { expr: cheer ? "laugh" : "grin", blink: blink(i), rh: cheer && i % 2 ? [150, -830] : undefined, bob: -jump * 60,
          hold: i % 2 ? undefined : boxHold, lh: i % 2 ? undefined : [-88, -470], ...(i % 2 ? {} : { rh: [88, -470] }) } as Pose });
      });
    } else {
      const u = (f - s.a) / (s.b - s.a), turn = t >= 6.06;
      OFFICE.forEach((lk, i) => {
        const back = i === 2 && turn;
        const z0 = 9 + i * 1.6 - (f - s.a) * 0.045, z = back ? z0 + (t - 6.06) * 1.6 * 2 : z0;
        ppl.push({ look: lk, x: OFFICE_X + 8 + (i % 2 ? 0.9 : 0), z, mirror: back,
          pose: { expr: back ? "smug" : i === 4 ? "sad" : "neutral", blink: blink(i), walk: ((t * 1.6) + i * 0.3) % 1,
            ...(back ? { hold: boxHold, lh: [-88, -470], rh: [88, -470] } : {}) } as Pose });
      });
      void u;
    }
    this.cards.forEach((cd, i) => {
      const p = ppl[i], b = this.blobs[i];
      cd.mesh.visible = b.visible = !!p;
      if (!p) return;
      cd.draw(p.look, p.pose, !!p.mirror);
      cd.mesh.position.set(p.x, 0, p.z);
      cd.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      b.position.set(p.x, 0.03, p.z);
    });
    return focus;
  }
}
export type { V3 };
