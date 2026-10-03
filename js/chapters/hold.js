// Chapter 5: what actually holds the magnet up. A load test on the door.
// Scene: 0.2 units per centimetre (the door is 35 cm wide, 45 cm tall). The paper stack's
// thickness is drawn 25 times too big. Falls are shown about 10 times slower than real.
//
// The physics is two lines:
//   pull into the door  N = pull pressure(gap) × magnet area        (field.js, sheetPull)
//   friction can carry  F ≤ μ × N                                    (Amontons' law; see FrictionClear)
// The magnet's pull is horizontal, so it cannot carry any weight by itself. It only presses the
// stack against the door; friction, which is at most μ times that press, carries the weight.
//
// Numbers:
//  · Pull pressure: the calibrated sheet model (0.76 mm sheet, 2 mm poles; a maker's table gives
//    85 lb/ft² = 41 g/cm² on bare steel: Adams Magnetic Products). Gap = 0.05 mm of paint plus
//    0.1 mm per sheet of 80 g/m² paper.
//  · An A4 sheet of 80 g/m² paper weighs 0.21 m × 0.297 m × 80 g/m² = 5.0 g (ISO 216, ISO 536).
//  · Magnet: 0.76 mm thick, 3.7 g/cm³ → 0.28 g per cm².
//  · μ: there is no single value. A nickel-plated neodymium disc on glossy fridge paint slides at a
//    few percent of its listed pull, and K&J Magnetics suggest assuming μ ≈ 0.15 for plated magnets
//    on steel ("Leverage & Friction When Using Magnets"); rubbery surfaces grip far better. Paper
//    on paint and rubber on paper sit around 0.3–0.5 (handbook ranges). Default 0.3, and a slider.
import { THREE, M, box, approach, clamp } from '../kit.js';
import { sheetPull } from '../field.js';
import { board, panelBg, title, axes, plot, dot, text, COL, HEX, placeBoards, layout, phoneView, compact, gPerCm2, fmtG, souvenirTexture, pointer } from '../fridgemagnet.js';

const U = 0.2;                                  // units per cm
const PAINT = 0.05, SHEET_MM = 0.1, A4_G = 5.0, MAG_G_CM2 = 0.076 * 3.7, NMAX = 25;
const PULL = Array.from({ length: NMAX + 1 }, (_, n) => gPerCm2(sheetPull({ gap: PAINT + n * SHEET_MM })));     // g per cm²
export function loadTest(s) {
  const n = Math.round(s.sheets);
  const pull = PULL[n] * s.area, cap = s.mu * pull;
  const mag = MAG_G_CM2 * s.area, paper = n * A4_G, load = mag + paper + s.extra;
  return { n, pull, cap, mag, paper, load, holds: cap >= load, margin: cap - load };
}

export default {
  id: 'hold',
  short: 'What holds it up',
  title: 'What holds it up: friction',
  subtitle: 'The magnet pulls into the door, not upwards. Friction does the lifting.',
  view: { pos: [3.2, 5.4, 13.6], target: [-2.7, 4.3, 0] },
  learn: `<p>Here is a puzzle. Gravity pulls the magnet and its papers <b>down</b>. The magnet pulls <b>sideways</b>, into the door. A sideways pull cannot hold anything up. So why does the magnet not slide to the floor?</p>
    <p>The answer is <b>friction</b>. The magnet squeezes the paper against the door, and two surfaces squeezed together resist sliding. The most friction can carry is the squeeze multiplied by a number called the <b>coefficient of friction</b>, <b>μ</b>, which depends on the two surfaces. For paper, paint and rubbery magnet it is roughly 0.3, so friction can carry only about <b>a third</b> of the magnet's pull. (More on this in <a href="https://glassbox.how/frictionclear/" target="_blank" rel="noopener">FrictionClear</a>.)</p>
    <p>That is why a magnet that takes real effort to pull <i>off</i> the door can be pushed <i>along</i> it with one finger.</p>
    <p>Now add paper. Each sheet weighs 5 g and adds 0.1 mm of gap. The weight creeps up while the pull <b>collapses</b>, roughly halving every two sheets. Somewhere between a few sheets and a thick wad, friction loses and the lot slides down.</p>
    <p>Three ways to hold more: a <b>bigger magnet</b> (more area, more pull), a <b>grippier</b> surface, or a magnet whose field reaches further, like the small hard magnets in the next chapter.</p>
    <p class="tip"><b>Try it:</b> add sheets of paper one at a time until it slides. Then double the magnet's size and try again.</p>`,
  terms: [
    { t: 'Friction', d: 'The force that resists two touching surfaces sliding over each other.' },
    { t: 'Coefficient of friction (μ)', d: 'The most friction two surfaces can give, as a fraction of the force pressing them together.' },
    { t: 'Normal force', d: 'The force pressing two surfaces together, at right angles to them. Here it is the magnet\'s pull.' },
    { t: 'Shear', d: 'A force along a surface rather than into it. The hanging weight loads the magnet in shear.' },
  ],
  defaults: { sheets: 2, area: 35, extra: 0, mu: 0.3 },
  controls: [
    { key: 'sheets', type: 'range', label: 'Sheets of A4 paper under the magnet', min: 0, max: NMAX, step: 1, fmt: (v) => `${v} sheet${v === 1 ? '' : 's'}: ${(PAINT + v * SHEET_MM).toFixed(2)} mm gap` },
    { key: 'area', type: 'range', label: 'Magnet size', min: 4, max: 80, step: 1, fmt: (v) => `${v} cm² (${Math.sqrt(v * 1.4).toFixed(1)} × ${Math.sqrt(v / 1.4).toFixed(1)} cm)` },
    { key: 'extra', type: 'range', label: 'Extra weight hung on', min: 0, max: 300, step: 5, fmt: (v) => v + ' g' },
    { key: 'mu', type: 'range', label: 'Grip (coefficient of friction μ)', min: 0.05, max: 0.8, step: 0.01, ends: ['slippery', 'rubbery'], fmt: (v) => v.toFixed(2) },
  ],
  quiz: [
    { q: 'The magnet pulls horizontally into the door. What force holds its weight up?', options: ['The magnetic pull itself', 'Friction between the surfaces it squeezes together', 'Air pressure', 'The paint is sticky'], answer: 1, why: 'A horizontal pull cannot carry a vertical load. It presses the surfaces together, and friction carries the weight.' },
    { q: 'A magnet pulls into the door with 900 g and μ is 0.3. What is the most it can hold without sliding?', options: ['About 90 g', 'About 270 g', 'About 900 g', 'About 3 kg'], answer: 1, why: 'Friction can carry at most μ × pull = 0.3 × 900 g = 270 g.' },
    { q: 'Why does a thick stack of paper slide down even though each sheet weighs only 5 g?', options: ['Paper is magnetic', 'The extra gap makes the pull collapse far faster than the weight grows', 'Paper is heavier than it looks', 'The door bends'], answer: 1, why: 'Each sheet adds 0.1 mm of gap, and the pull of narrow stripes halves about every 0.2 mm.' },
  ],
  reel: [
    { ms: 5600, caption: 'The magnet pulls into the door, not up. Friction, about a third of that pull, carries the weight.', set: { sheets: 2, area: 35, extra: 0, mu: 0.3 }, anim: { extra: [0, 60] }, view: { pos: [2.6, 5.9, 6.9], target: [0.2, 5.7, 0] }, spin: 0.15 },
    { ms: 6200, caption: 'Each sheet of paper adds weight and gap. The pull collapses, friction loses, and it all slides down.', set: { area: 35, extra: 0, mu: 0.3 }, anim: { sheets: [2, 16] }, view: { pos: [2.6, 5.9, 6.9], target: [0.2, 5.7, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = stage.root;
    // The fridge door: a white steel panel with a handle, standing on the floor.
    const DW = 35 * U, DH = 45 * U;
    const door = box(DW, DH, 0.5, M.plastic(0xeef0f3, { roughness: 0.35 })); door.position.set(0, DH / 2, -0.25); root.add(door);
    const handle = box(0.18, 3.2, 0.25, M.metal(0xb9bec8)); handle.position.set(-DW / 2 + 0.45, DH / 2, 0.14); root.add(handle);
    // Everything that hangs (and falls together).
    const hang = new THREE.Group(); root.add(hang);
    const PW = 21 * U, PH = 29.7 * U, TOP = DH - 2.2;
    const stack = box(PW, PH, 1, M.matte(0xf7f4ea)); hang.add(stack);
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(PW * 0.8, PH * 0.62), new THREE.MeshBasicMaterial({ map: paperLines(), transparent: true, toneMapped: false })); hang.add(lines);
    const magMats = [M.matte(HEX.brown), M.matte(HEX.brown), M.matte(HEX.brown), M.matte(HEX.brown), new THREE.MeshStandardMaterial({ map: souvenirTexture(), roughness: 0.45 }), M.matte(HEX.brown)];
    const mag = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.07), magMats); mag.castShadow = true; hang.add(mag);
    // A weight on a string, hung from a clip on the magnet.
    const string = box(0.02, 1, 0.02, M.matte(0x333a48)); hang.add(string);
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 28), M.metal(0xc9a23c, { roughness: 0.35 })); weight.castShadow = true; hang.add(weight);
    // Force arrows.
    const aPull = pointer(HEX.force, 0.05, 0.26), aFric = pointer(HEX.good, 0.05, 0.26), aLoad = pointer(HEX.hot, 0.05, 0.26);
    root.add(aPull, aFric, aLoad);
    const lPull = stage.label('', [0, 0, 0], root), lFric = stage.label('', [0, 0, 0], root), lLoad = stage.label('', [0, 0, 0], root, 'hot');

    let cur = { ...this.defaults };
    const b = board(root, 6.2, 3.29, 990, 525, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Friction against weight', 'what the grip can carry, and what hangs on it');
      const caps = [], loads = [];
      for (let n = 0; n <= NMAX; n++) { const r = loadTest({ ...cur, sheets: n }); caps.push([n, r.cap]); loads.push([n, r.load]); }
      const top = Math.max(50, Math.ceil(Math.max(caps[0][1], loads[NMAX][1]) / 50) * 50);
      const ax = axes(g, w, h, { xMax: NMAX, yMax: top, xTicks: [0, 5, 10, 15, 20, 25], yTicks: [0, top / 4, top / 2, (3 * top) / 4, top], yFmt: (v) => v.toFixed(0), xLabel: 'sheets of paper under the magnet', yLabel: 'grams' });
      plot(g, loads, ax.X, ax.Y, COL.hot, 5, null, ax); plot(g, caps, ax.X, ax.Y, COL.good, 6, null, ax);
      text(g, 'friction can carry', ax.X(3.4), ax.Y(Math.min(top * 0.86, caps[3][1])) - 10, COL.good, 'bold 19px sans-serif');
      text(g, 'weight hanging', ax.X(14), ax.Y(loads[17][1]) - 14, COL.hot, 'bold 19px sans-serif');
      const r = loadTest(cur);
      dot(g, ax.X(r.n), ax.Y(Math.min(top, r.cap)), r.holds ? COL.good : COL.bad, 11);
    }, [-6.6, 2.1, 2.4]);
    b.mesh.rotation.y = 0.25;

    let tall = false, mode = '', drop = 0, vel = 0, key = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const lay = layout(stage);
        if (lay !== mode) {
          mode = lay; tall = lay === 'tall';
          placeBoards(stage, [[b, [0, 10.9, 0], 1.0, [0, 1.55, 1.3], 0.82]]);
          b.mesh.rotation.y = mode === 'wide' ? 0.25 : 0;
          phoneView(stage, { pos: [2.2, 7.6, 11.6], target: [0, 7.1, 0] });
        }
        const r = loadTest(s);
        const k = [r.n, s.area, s.extra, s.mu].join('|');
        if (k !== key) { key = k; cur = { ...s }; b.redraw(); }
        // Geometry.
        const zs = Math.max(0.004, r.n * SHEET_MM * 0.1 * U * 25);       // stack thickness, 25× exaggerated
        stack.visible = lines.visible = r.n > 0;
        stack.scale.z = zs; stack.position.set(0, TOP - PH / 2, zs / 2); lines.position.set(0, TOP - PH / 2 - 0.3, zs + 0.004);
        const mw = Math.sqrt(s.area * 1.4) * U, mh = Math.sqrt(s.area / 1.4) * U;
        mag.scale.set(mw, mh, 1); mag.position.set(0, TOP - 0.25 - mh / 2, zs + 0.035);
        const wr = Math.cbrt(Math.max(s.extra, 1) / 100);
        weight.visible = string.visible = s.extra > 0;
        const wy = Math.min(mag.position.y - mh / 2 - 1.4, TOP - PH - 0.5);
        weight.scale.setScalar(wr); weight.position.set(0, wy, zs + 0.4);
        string.scale.y = mag.position.y - wy; string.position.set(0, (mag.position.y + wy) / 2, zs + 0.2);
        // Slide and fall, or climb back.
        const floorDrop = Math.max(0.5, (s.extra > 0 ? wy - 0.25 * wr : TOP - PH) - 0.05);
        if (!r.holds) { vel += 1.96 * (1 - r.cap / Math.max(r.load, 1e-6)) * dt; drop = Math.min(floorDrop, drop + vel * dt); if (drop >= floorDrop) vel = 0; }
        else { vel = 0; drop = approach(drop, 0, 5, dt); }
        hang.position.y = -drop;
        // Arrows from the magnet's middle.
        const mx = 0, my = mag.position.y - drop, mz = zs + 0.12;
        // Arrow lengths grow with the square root of the force, so 20 g and 2 kg both stay readable.
        const Lp = clamp(0.1 * Math.sqrt(r.pull), 0.15, 3.6), Lf = clamp(0.33 * Math.sqrt(Math.min(r.cap, r.load)), 0.15, 3.4), Ll = clamp(0.33 * Math.sqrt(r.load), 0.15, 3.4);
        aPull.aim([mx, my, mz + Lp + 0.1], [0, 0, -1], Lp);
        aFric.aim([mx + 0.22, my, mz + 0.06], [0, 1, 0], Lf);
        aLoad.aim([mx - 0.22, my, mz + 0.06], [0, -1, 0], Ll);
        lPull.position.set(mx, my + 0.45, mz + Lp + 0.4); lFric.position.set(mx + 0.3, my + Lf + 0.35, mz); lLoad.position.set(mx - 0.3, my - Ll - 0.35, mz);
        lPull.element.textContent = `Pull into door ${fmtG(r.pull)}`;
        lFric.element.textContent = r.holds ? `Friction ${fmtG(r.load)}` : `Friction: only ${fmtG(r.cap)}`;
        lLoad.element.textContent = `Weight ${fmtG(r.load)}`;
      },
      readout: (s) => {
        const r = loadTest(s);
        return compact(stage, `<div class="big">${r.holds ? `It holds, with ${fmtG(r.margin)} to spare` : `It slides: ${fmtG(-r.margin)} too heavy`}</div>
          <div class="row"><span>Pull into the door</span><b>${fmtG(r.pull)}</b></div>
          <div class="row"><span>Friction can carry (μ × pull)</span><b class="${r.holds ? 'ok' : 'no'}">${fmtG(r.cap)}</b></div>
          <div class="row"><span>Weight hanging</span><b>${fmtG(r.load)}</b></div>
          <div class="row"><span>of which paper / magnet / extra</span><b>${r.paper.toFixed(0)} / ${r.mag.toFixed(0)} / ${s.extra} g</b></div>
          <div class="row"><span>Gap: paint + ${r.n} sheet${r.n === 1 ? '' : 's'}</span><b>${(PAINT + r.n * SHEET_MM).toFixed(2)} mm</b></div>`, 3);
      },
    };
  },
};

function paperLines() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d'); g.strokeStyle = 'rgba(60,70,90,.45)'; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(8, 12 + i * 18); g.lineTo(i % 4 === 3 ? 150 : 248, 12 + i * 18); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
