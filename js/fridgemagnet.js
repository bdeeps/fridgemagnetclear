// Shared 3D parts for FridgeMagnetClear: flux lines drawn as contours of the flux function, the
// cross-section of a flexible magnet sheet (used by two chapters), the printed magnet itself,
// chart boards and small formatting helpers. The physics lives in field.js.
import { THREE, M, box, clamp } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { sheetStrips, mirrorStrips, stripsA, stripsB, G0, TAU } from './field.js';

export { THREE, M, box, clamp };
export const NCOL = 0xe0453a, SCOL = 0x2f6fd6;          // school convention: north red, south blue
export const COL = { field: '#8ef0ff', north: '#ff6a5c', south: '#6aa6ff', hot: '#ffb547', good: '#7be08c', bad: '#ff6b6b', force: '#ff6fa3', soft: 'rgba(255,255,255,.55)' };
export const HEX = { field: 0x8ef0ff, north: 0xff6a5c, south: 0x6aa6ff, hot: 0xffb547, good: 0x7be08c, bad: 0xff6b6b, force: 0xff6fa3, brown: 0x3b2a22, steel: 0x9aa3b2 };

export const inReel = () => document.body.classList.contains('gb-reel');
export const isNarrow = (stage) => stage.host.clientWidth < 560;
// Three layouts. 'wide': a desktop stage, with the readout in the upper left. 'tall': the vertical
// reel video (no readout, no labels). 'phone': a narrow stage with the readout across the top.
export const layout = (stage) => (inReel() ? (stage.host.clientWidth / Math.max(1, stage.host.clientHeight) < 0.8 ? 'tall' : 'wide') : isNarrow(stage) ? 'phone' : 'wide');
export const isTall = (stage) => layout(stage) === 'tall';
// On a phone, keep the readout short (the headline and the first rows) so it does not bury the model.
export function compact(stage, html, keep = 2) {
  if (!isNarrow(stage) || inReel()) return html;
  const parts = html.split('<div class="row">');
  return parts.slice(0, keep + 1).join('<div class="row">');
}
// On a phone, re-frame the scene below the readout. Returns true when the layout has just changed.
export function phoneView(stage, view) {
  if (layout(stage) === 'phone') stage.setView(view.pos, view.target, 0.4);
}

// ---------------------------------------------------------------- formatting
export function fmtB(B) {
  const a = Math.abs(B);
  if (a >= 0.1) return B.toFixed(2) + ' T';
  if (a >= 1e-3) return (B * 1e3).toFixed(a >= 1e-2 ? 0 : 1) + ' mT';
  if (a >= 1e-6) return (B * 1e6).toFixed(a >= 1e-5 ? 0 : 1) + ' µT';
  if (a >= 1e-9) return (B * 1e9).toFixed(a >= 1e-8 ? 0 : 1) + ' nT';
  return 'under 1 nT';
}
// A pressure as grams-force per cm² (how people feel a fridge magnet) and kilopascals.
export const gPerCm2 = (Pa) => Pa / (G0 * 10);
export function fmtG(g) {
  const a = Math.abs(g);
  if (a >= 1000) return (g / 1000).toFixed(a >= 10000 ? 0 : 2) + ' kg';
  if (a >= 100) return Math.round(g) + ' g';
  if (a >= 10) return g.toFixed(0) + ' g';
  if (a >= 1) return g.toFixed(1) + ' g';
  if (a >= 0.01) return g.toFixed(2) + ' g';
  return 'almost 0 g';
}
export const fmtMM = (v) => (v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' mm';

// ---------------------------------------------------------------- chart boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
const BOARD_ZOOM = 1.5;
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // Charts are drawn in a space 1.5 times smaller than the canvas, so their text stays readable on a small stage.
  const redraw = () => { g.setTransform(BOARD_ZOOM, 0, 0, BOARD_ZOOM, 0, 0); draw(g, pxW / BOARD_ZOOM, pxH / BOARD_ZOOM); tex.needsUpdate = true; };
  redraw();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  mesh.position.set(...pos); root.add(mesh);
  return { tex, redraw, canvas: c, mesh };
}
export function title(g, text, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 25px sans-serif'; g.fillText(text, 18, 34);
  if (sub) { g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, 18, 57); }
}
export function axes(g, w, h, { x0 = 74, x1 = w - 22, y0 = h - 58, y1 = 84, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logX = false, logY = false }) {
  const X = logX ? (x) => x0 + ((Math.log10(x) - xMin) / (xMax - xMin)) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY ? (y) => y0 - ((Math.log10(Math.max(y, 1e-30)) - yMin) / (yMax - yMin)) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '18px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 48);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function plot(g, pts, X, Y, col, wdt = 5, dash = null, clip = null) {
  if (pts.length < 2) return;
  g.save();
  if (clip) { g.beginPath(); g.rect(clip.x0, clip.y1, clip.x1 - clip.x0, clip.y0 - clip.y1); g.clip(); }
  g.strokeStyle = col; g.lineWidth = wdt; g.lineJoin = 'round'; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.restore();
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function text(g, s, x, y, col = 'rgba(255,255,255,.78)', font = '18px sans-serif') { g.fillStyle = col; g.font = font; g.fillText(s, x, y); }
// Boards sit beside the model on a wide screen. On a tall one (the reel video) they move to 'tallPos'.
export function placeBoards(stage, list) {
  const m = layout(stage);
  list.forEach(([b, pos, scale = 1, ppos = null, pscale = 1]) => {
    if (!b.home) b.home = b.mesh.position.clone();
    if (m === 'tall') { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); }
    else if (m === 'phone' && ppos) { b.mesh.position.set(...ppos); b.mesh.scale.setScalar(pscale); }
    else { b.mesh.position.copy(b.home); b.mesh.scale.setScalar(1); }
  });
}

// ---------------------------------------------------------------- arrows that point anywhere
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function pointer(color, r = 0.04, head = 0.22) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, depthTest: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), mat);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 2.8, head, 16), mat);
  shaft.renderOrder = tip.renderOrder = 10;
  g.add(shaft, tip);
  g.aim = (from, dir, len) => {
    g.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-12) tmpV.set(0, 1, 0);
    g.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    const L = Math.max(0.001, len), hd = Math.min(head, L * 0.6);
    tip.scale.y = hd / head; shaft.scale.y = Math.max(0.001, L - hd); shaft.position.y = (L - hd) / 2; tip.position.y = L - hd / 2;
    g.visible = len > 0.03;
  };
  return g;
}

// ---------------------------------------------------------------- flux lines
// Marching squares over a grid of the flux function A. Levels are (n + ½)·dA, so every line
// carries the same flux and the density of lines is the strength of the field.
export function contours(A, nx, ny, dA, emit) {
  const px = [0, 0, 0, 0], py = [0, 0, 0, 0];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = A[j * nx + i], b = A[j * nx + i + 1], c = A[(j + 1) * nx + i + 1], d = A[(j + 1) * nx + i];
    const mn = Math.min(a, b, c, d), mx = Math.max(a, b, c, d);
    for (let n = Math.ceil(mn / dA - 0.5); (n + 0.5) * dA < mx; n++) {
      const L = (n + 0.5) * dA; let k = 0;
      if ((a - L) * (b - L) < 0) { px[k] = i + (L - a) / (b - a); py[k++] = j; }
      if ((b - L) * (c - L) < 0) { px[k] = i + 1; py[k++] = j + (L - b) / (c - b); }
      if ((d - L) * (c - L) < 0) { px[k] = i + (L - d) / (c - d); py[k++] = j + 1; }
      if ((a - L) * (d - L) < 0) { px[k] = i; py[k++] = j + (L - a) / (d - a); }
      if (k >= 2) emit(px[0], py[0], px[1], py[1], i, j, n);
      if (k === 4) emit(px[2], py[2], px[3], py[3], i, j, n);
    }
  }
}
// A set of fat line segments that can be rewritten, plus arrow heads.
export function fatLines(stage, color, { width = 2, opacity = 0.9, heads = 0, headSize = 0.16 } = {}) {
  const g = new THREE.Group();
  const mat = stage.lineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false });
  let obj = null, hm = null;
  if (heads) {
    const cone = new THREE.ConeGeometry(headSize * 0.42, headSize, 10); cone.rotateZ(-Math.PI / 2);
    hm = new THREE.InstancedMesh(cone, M.glow(color, { transparent: true, opacity: Math.min(1, opacity + 0.1) }), heads);
    hm.frustumCulled = false; hm.count = 0; g.add(hm);
  }
  const o = new THREE.Object3D();
  // arr: flat [x, y, z, x, y, z, …] pairs. headList: [x, y, z, angle about z].
  g.set = (arr, headList = []) => {
    if (obj) { g.remove(obj); obj.geometry.dispose(); obj = null; }
    if (arr.length) { const geo = new LineSegmentsGeometry(); geo.setPositions(arr); obj = new LineSegments2(geo, mat); obj.frustumCulled = false; g.add(obj); }
    if (hm) {
      const n = Math.min(heads, headList.length);
      for (let i = 0; i < n; i++) { const h = headList[i]; o.position.set(h[0], h[1], h[2]); o.rotation.set(0, 0, h[3]); o.updateMatrix(); hm.setMatrixAt(i, o.matrix); }
      hm.count = n; hm.instanceMatrix.needsUpdate = true;
    }
  };
  g.mat = mat;
  return g;
}

// ---------------------------------------------------------------- the cross-section
// A slice through a flexible magnet sheet, drawn S scene units per millimetre. x runs along the
// sheet (across the stripes), y through it; the strong face (the back, which goes on the door)
// looks towards −y. Everything is built in `group` so a chapter can turn the whole picture.
//   set({ pattern, pitch, t, twist, steel: null | { gap, mu, thick } })
const BLOCK_N = '#b8463c', BLOCK_S = '#3b63b8', BLOCK_SIDE = '#6b4f7a';
export function makeSection(stage, { S = 0.6, span = 16, yLo = -3, yHi = 3, depth = 2.6, dA = 0.05 } = {}) {
  const group = new THREE.Group();
  const H = 0.1;                                        // grid step, mm
  const nx = Math.round(span / H) + 1, ny = Math.round((yHi - yLo) / H) + 1;
  const A = new Float32Array(nx * ny);
  const x0 = -span / 2;

  // The slab of magnet behind the cut face, with its printed front on top.
  const slab = box(1, 1, 1, M.matte(HEX.brown, { roughness: 0.75 })); group.add(slab);
  const print = box(1, 1, 1, M.plastic(0xf2efe6, { roughness: 0.4 })); group.add(print);
  // Stripes on the back face of the slab (seen when you orbit underneath).
  const stripeTex = canvasTex(512, 16); stripeTex.tex.wrapS = THREE.RepeatWrapping;
  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: stripeTex.tex, toneMapped: false, transparent: true, opacity: 0.85 }));
  backFace.rotation.x = Math.PI / 2; group.add(backFace);
  // The cut face: blocks coloured by which way they are magnetised, with an arrow in each.
  const face = canvasTex(4096, 192);
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: face.tex, toneMapped: false })); group.add(faceMesh);
  // Field strength as a glow behind the lines.
  const heat = canvasTex(nx, ny); heat.tex.magFilter = THREE.LinearFilter;
  const heatMesh = new THREE.Mesh(new THREE.PlaneGeometry(span * S, (yHi - yLo) * S), new THREE.MeshBasicMaterial({ map: heat.tex, transparent: true, toneMapped: false, depthWrite: false }));
  heatMesh.position.set(0, ((yHi + yLo) / 2) * S, -0.02); group.add(heatMesh);
  const img = heat.g.createImageData(nx, ny);
  // Steel door (optional): the sheet metal, its paint, and arrows for the flux it carries sideways.
  const steel = box(1, 1, 1, M.metal(0x8f98a8, { roughness: 0.45 })); steel.visible = false; group.add(steel);
  const steelFace = canvasTex(4096, 128);
  const steelFaceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: steelFace.tex, toneMapped: false })); steelFaceMesh.visible = false; group.add(steelFaceMesh);

  const lines = fatLines(stage, HEX.field, { width: 2.2, opacity: 0.92, heads: 220, headSize: 0.13 }); group.add(lines);
  const inner = fatLines(stage, HEX.field, { width: 1.4, opacity: 0.3 }); group.add(inner);
  lines.position.z = inner.position.z = 0.02;

  let cur = null, info = {};
  function set(p) {
    const key = [p.pattern, p.pitch.toFixed(3), p.t.toFixed(3), (p.twist ?? 1).toFixed(2), p.steel ? p.steel.gap.toFixed(3) + '|' + p.steel.mu + '|' + p.steel.thick : '-'].join('|');
    if (key === cur) return info;
    cur = key;
    const lam = 2 * p.pitch, periods = Math.ceil(span / lam) + 6;
    const sheet = sheetStrips({ pattern: p.pattern, pitch: p.pitch, t: p.t, periods: periods + (periods % 2), back: -1, twist: p.twist ?? 1 });
    const ys = p.steel ? -p.t / 2 - p.steel.gap : -1e9;
    const f = p.steel ? (p.steel.mu - 1) / (p.steel.mu + 1) : 0;
    const img2 = p.steel && f > 1e-6 ? mirrorStrips(sheet.strips, ys, f) : null;
    let bmax = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * H, y = yLo + j * H;
      let a = stripsA(sheet.strips, x, y);
      if (img2) a = y >= ys ? a + stripsA(img2, x, y) : a * (1 + f);       // inside the slab: transmitted field (for the glow only)
      A[j * nx + i] = a;
    }
    // Glow: |B| from the gradient of A.
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(ny - 1, j + 1);
      const bx = (A[j1 * nx + i] - A[j0 * nx + i]) / ((j1 - j0) * H), by = -(A[j * nx + i1] - A[j * nx + i0]) / ((i1 - i0) * H);
      const y = yLo + j * H, b = Math.hypot(bx, by), k = (ny - 1 - j) * nx + i;
      const inside = Math.abs(y) <= p.t / 2 + H * 0.5 || y < ys;
      const v = inside ? 0 : clamp(b / 0.42, 0, 1);
      if (!inside) bmax = Math.max(bmax, b);
      img.data[k * 4] = 40 + 70 * v; img.data[k * 4 + 1] = 110 + 90 * v; img.data[k * 4 + 2] = 255; img.data[k * 4 + 3] = 150 * Math.pow(v, 0.7);
    }
    heat.g.putImageData(img, 0, 0); heat.tex.needsUpdate = true;
    // Lines.
    const out = [], ins = [], heads = [], every = p.steel ? 6 : 3;
    const rows = new Set();
    const addRow = (y) => { const j = Math.round((y - yLo) / H); if (j > 0 && j < ny - 1) rows.add(j); };
    addRow(p.t / 2 + 0.5);
    if (!p.steel) addRow(-p.t / 2 - 0.5); else if (p.steel.gap > 0.45) addRow(-p.t / 2 - p.steel.gap / 2);
    contours(A, nx, ny, dA, (xa, ya, xb, yb, i, j, n) => {
      const X1 = (x0 + xa * H) * S, Y1 = (yLo + ya * H) * S, X2 = (x0 + xb * H) * S, Y2 = (yLo + yb * H) * S;
      const ym = yLo + (j + 0.5) * H;
      if (ym < ys && f > 0.5) return;                      // nothing drawn inside magnetic steel: see the arrows there. A non-magnetic door lets the lines straight through.
      if (Math.abs(ym) < p.t / 2) ins.push(X1, Y1, 0, X2, Y2, 0);
      else {
        out.push(X1, Y1, 0, X2, Y2, 0);
        if (rows.has(j) && heads.length < 220 && ((n % every) + every) % every === 0) {
          const bx = (A[(j + 1) * nx + i] - A[j * nx + i]), by = -(A[j * nx + i + 1] - A[j * nx + i]);
          heads.push([(X1 + X2) / 2, (Y1 + Y2) / 2, 0, Math.atan2(by, bx)]);
        }
      }
    });
    lines.set(out, heads); inner.set(ins);

    // The slab, print and cut face.
    const W = span * S, T = p.t * S;
    slab.scale.set(W, T, depth); slab.position.set(0, 0, -depth / 2 - 0.03);
    print.scale.set(W, 0.05, depth); print.position.set(0, T / 2 + 0.025, -depth / 2 - 0.03);
    backFace.scale.set(W, depth, 1); backFace.position.set(0, -T / 2 - 0.004, -depth / 2 - 0.03);
    faceMesh.scale.set(W, T, 1); faceMesh.position.set(0, 0, 0);
    drawFace(face, sheet.blocks, x0, span, p.t);
    drawStripes(stripeTex, sheet.blocks, x0, span);
    // Steel.
    steel.visible = steelFaceMesh.visible = !!p.steel;
    if (p.steel) {
      const th = p.steel.thick * S;
      steel.scale.set(W, th, depth); steel.position.set(0, ys * S - th / 2, -depth / 2 - 0.03);
      steelFaceMesh.scale.set(W, th, 1); steelFaceMesh.position.set(0, ys * S - th / 2, 0);
      drawSteel(steelFace, (x) => stripsA(sheet.strips, x, ys) * (1 + f), x0, span, f);
    }
    info = { bmax, lam, ys };
    return info;
  }
  return { group, set, S, span, yLo, yHi, depth };
}
function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { c, g, tex };
}
function arrow2d(g, cx, cy, ang, len, col = '#fff', lw = 5) {
  g.save(); g.translate(cx, cy); g.rotate(ang);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-len / 2, 0); g.lineTo(len / 2 - lw * 1.6, 0); g.stroke();
  g.beginPath(); g.moveTo(len / 2, 0); g.lineTo(len / 2 - lw * 2.6, -lw * 1.5); g.lineTo(len / 2 - lw * 2.6, lw * 1.5); g.closePath(); g.fill();
  g.restore();
}
function drawFace({ c, g, tex }, blocks, x0, span, t) {
  const w = c.width, h = c.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#3b2a22'; g.fillRect(0, 0, w, h);
  // Draw in millimetres so the arrows keep their shape whatever the thickness.
  g.setTransform(w / span, 0, 0, h / t, 0, h / 2);
  for (const b of blocks) {
    const xa = b.xa - x0, xb = b.xb - x0;
    if (xb < 0 || xa > span) continue;
    const m = Math.hypot(b.mx, b.my);
    // The strong face looks down (−y). A block whose arrow points down puts a north pole there.
    g.fillStyle = m < 0.05 ? '#4a3a34' : Math.abs(b.my) > 0.9 * Math.max(m, 0.5) ? (b.my < 0 ? BLOCK_N : BLOCK_S) : Math.abs(b.my) < 0.3 ? BLOCK_SIDE : (b.my < 0 ? '#93486a' : '#55599c');
    g.fillRect(xa + 0.012, -t / 2, xb - xa - 0.024, t);
    if (m < 0.05) continue;
    const len = Math.min(xb - xa, t) * 0.74 * Math.max(0.35, Math.min(1, m));
    arrow2d(g, (xa + xb) / 2, 0, Math.atan2(-b.my, b.mx), len, '#ffffff', Math.max(0.035, len * 0.1));   // canvas y runs down
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  tex.needsUpdate = true;
}
function drawStripes({ c, g, tex }, blocks, x0, span) {
  const w = c.width, sx = w / span;
  g.fillStyle = '#3b2a22'; g.fillRect(0, 0, w, c.height);
  for (const b of blocks) {
    if (Math.abs(b.my) < 0.3) continue;
    g.fillStyle = b.my < 0 ? 'rgba(224,69,58,.75)' : 'rgba(47,111,214,.75)';
    g.fillRect((b.xa - x0) * sx, 0, (b.xb - b.xa) * sx, c.height);
  }
  tex.needsUpdate = true;
}
// Inside thin, very permeable steel the flux runs sideways, from under each north pole to under
// the south poles next to it. The flux crossing a vertical cut at x is A(x) at the surface (per mm
// of depth), so the arrows are sized by it: computed, not sketched.
function drawSteel({ c, g, tex }, Asurf, x0, span, f) {
  const w = c.width, h = c.height;
  g.fillStyle = '#8f98a8'; g.fillRect(0, 0, w, h);
  const n = 64; let mx = 1e-9; const vals = [];
  for (let i = 0; i < n; i++) { const x = x0 + ((i + 0.5) / n) * span; const a = Asurf(x); vals.push(a); mx = Math.max(mx, Math.abs(a)); }
  const ref = Math.max(mx, 0.12);
  if (f > 0.05) for (let i = 0; i < n; i++) {
    const a = vals[i] / ref; if (Math.abs(a) < 0.12) continue;
    // B_x = ∂A/∂y: with A positive at the surface and zero deep inside, the flux runs towards +x.
    arrow2d(g, ((i + 0.5) / n) * w, h / 2, a > 0 ? 0 : Math.PI, (w / n) * 0.95 * Math.min(1, Math.abs(a) + 0.3), '#0d1830', 9 + 11 * Math.abs(a));
  }
  tex.needsUpdate = true;
}

// ---------------------------------------------------------------- the printed magnet
// A generic souvenir picture: hills, a sun and a lake. No brand, no real place.
export function souvenirTexture(w = 512, h = 384) {
  const { c, g, tex } = canvasTex(w, h);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f08a3c'); sky.addColorStop(0.55, '#f7c56a'); sky.addColorStop(1, '#5fb7d0');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff1b0'; g.beginPath(); g.arc(w * 0.7, h * 0.3, h * 0.13, 0, TAU); g.fill();
  const hill = (col, base, amp, ph, f) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, base - amp * Math.abs(Math.sin(x * f + ph)) - amp * 0.3 * Math.sin(x * f * 2.7 + ph)); g.lineTo(w, h); g.closePath(); g.fill(); };
  hill('#4a5a9c', h * 0.62, h * 0.3, 0.4, 0.008); hill('#2f6a52', h * 0.74, h * 0.22, 1.7, 0.011); hill('#1d4a38', h * 0.86, h * 0.14, 0.2, 0.017);
  g.fillStyle = '#1f7ea6'; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.font = `bold ${Math.round(h * 0.11)}px sans-serif`; g.textAlign = 'center'; g.fillText('HILL STATION', w / 2, h * 0.96 - 6);
  tex.needsUpdate = true;
  return tex;
}
// The back of a magnet sheet: dark brown, with (optionally) its stripes showing.
export function stripeTexture(nStripes, vertical = true, alpha = 0.6) {
  const { c, g, tex } = canvasTex(vertical ? 1024 : 16, vertical ? 16 : 1024);
  const paint = (a) => {
    g.fillStyle = '#3b2a22'; g.fillRect(0, 0, c.width, c.height);
    const L = vertical ? c.width : c.height, w = L / nStripes;
    for (let i = 0; i < nStripes; i++) {
      g.fillStyle = i % 2 ? `rgba(47,111,214,${a})` : `rgba(224,69,58,${a})`;
      if (vertical) g.fillRect(i * w + w * 0.08, 0, w * 0.84, c.height); else g.fillRect(0, i * w + w * 0.08, c.width, w * 0.84);
    }
    tex.needsUpdate = true;
  };
  paint(alpha);
  tex.paint = paint;
  return tex;
}
