// Chapter 1: take a flat fridge magnet, and the door behind it, apart.
// Scene: 0.06 units per millimetre across the door (the magnet is 70 × 50 mm). Thicknesses are
// drawn about 3.5 times too big so the layers can be seen; the readout gives the real ones.
//
// Facts and sources:
//  · A flexible magnet is ferrite powder (strontium or barium ferrite, SrFe12O19 / BaFe12O19) mixed
//    into rubber or a soft plastic, up to about 90% ferrite by weight, rolled or extruded into
//    sheet (Max Baermann GmbH, "Flexible permanent magnets"; Wikipedia, "Refrigerator magnet").
//    Binders: nitrile rubber (NBR), chlorinated polyethylene (CPE) or thermoplastic elastomers; usable to
//    about 100 °C (Max Baermann GmbH, "Flexible magnets").
//  · Ferrite powder for magnets is ground to grains of roughly 1 µm, small enough for each grain to
//    be a single magnetic domain (Wikipedia, "Ferrite (magnet)"; hexaferrite reviews).
//  · Sheet thickness: makers list 0.3 to 1.5 mm; 0.76 mm (0.030 inch) is a common one (Adams
//    Magnetic Products, "Flexible Magnetic Sheet").
//  · Density about 3.7 g/cm³ (typical flexible ferrite datasheets give 3.5–3.8; Adams' shipping
//    weight of 63 lb per 100 ft² of 0.030 in sheet works out at 4.0 including the roll's core).
//  · Fridge door: painted low-carbon steel sheet about 0.4–0.6 mm thick over polyurethane foam
//    insulation, with a plastic inner liner (see FridgeClear). Drawn as 0.5 mm.
import { THREE, M, box, exploder, approach, clamp } from '../kit.js';
import { HEX, souvenirTexture, layout, phoneView, compact } from '../fridgemagnet.js';

const S = 0.06, MAG = { w: 70, h: 50, t: 0.76 }, DENSITY = 3.7, EX = 3.5;
const massG = (MAG.w / 10) * (MAG.h / 10) * (MAG.t / 10) * DENSITY;

function grainTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  // Grains: flat six-sided plates, packed at random. Fixed positions so every frame matches.
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grains = [];
  for (let k = 0; k < 900 && grains.length < 62; k++) {
    const x = 256 + (rnd() - 0.5) * 430, y = 256 + (rnd() - 0.5) * 430, r = 22 + rnd() * 12;
    if (Math.hypot(x - 256, y - 256) > 225) continue;
    if (grains.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 3)) continue;
    grains.push({ x, y, r, a: rnd() * Math.PI * 2, tilt: rnd() * Math.PI });
  }
  tex.paint = (state) => {
    g.clearRect(0, 0, 512, 512);
    g.save(); g.beginPath(); g.arc(256, 256, 248, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#5a3f30'; g.fillRect(0, 0, 512, 512);
    for (const q of grains) {
      g.save(); g.translate(q.x, q.y); g.rotate(q.tilt);
      g.fillStyle = '#2b2f38'; g.strokeStyle = '#8c94a6'; g.lineWidth = 2;
      g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q.r, Math.sin(a) * q.r * 0.8); } g.closePath(); g.fill(); g.stroke();
      g.restore();
      // Each grain is one domain: a tiny magnet. Before magnetising they point at random and cancel.
      // After, the grains of one stripe point one way (left half: out of the back; right half: into it).
      const ang = state === 'before' ? q.a : (q.x < 256 ? -Math.PI / 2 : Math.PI / 2) + (q.a - Math.PI) * 0.12;
      g.save(); g.translate(q.x, q.y); g.rotate(ang);
      g.strokeStyle = g.fillStyle = state === 'before' ? '#e8eef8' : q.x < 256 ? '#ff7d70' : '#7fb0ff'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-q.r * 0.55, 0); g.lineTo(q.r * 0.3, 0); g.stroke();
      g.beginPath(); g.moveTo(q.r * 0.62, 0); g.lineTo(q.r * 0.2, -7); g.lineTo(q.r * 0.2, 7); g.closePath(); g.fill();
      g.restore();
    }
    if (state !== 'before') { g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([10, 10]); g.lineWidth = 3; g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.stroke(); g.setLineDash([]); }
    g.restore();
    g.strokeStyle = '#cfd6e4'; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 248, 0, Math.PI * 2); g.stroke();
    tex.needsUpdate = true;
  };
  tex.paint('after');
  return tex;
}
function stripeOverlay() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 16;
  const g = c.getContext('2d'), n = MAG.w / 2, w = c.width / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? 'rgba(47,111,214,.9)' : 'rgba(224,69,58,.9)'; g.fillRect(i * w + w * 0.1, 0, w * 0.8, 16); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

export default {
  id: 'anatomy',
  short: 'Inside a fridge magnet',
  title: 'Inside a fridge magnet',
  subtitle: 'A picture, a sheet of rubber packed with ferrite powder, and a steel door to hold on to.',
  view: { pos: [5.4, 6.4, 11.2], target: [-1.5, 4.6, 0.2] },
  learn: `<p>A flat fridge magnet looks like a bit of printed plastic, and most of it is. Peel it apart and you find three layers. On the front, a clear <b>laminate</b> over a <b>printed picture</b>. Behind that, the part that does the work: a dark brown <b>flexible magnet sheet</b>, usually less than a millimetre thick.</p>
    <p>That sheet is <b>ferrite powder</b> mixed into rubber or soft plastic, as much as 90% ferrite by weight. Ferrite is a hard, dark ceramic made from iron oxide with a little strontium or barium. On its own it is as brittle as a teacup. Ground to grains about a thousandth of a millimetre across and bound in rubber, it bends, cuts with scissors and costs very little.</p>
    <p>Every grain is a tiny permanent magnet. Fresh from the mixer they point every which way and cancel out. At the factory the sheet passes over a strong magnetising roller, which swings the grains' magnetism into line in narrow <b>stripes</b>. Turn on <b>Show the stripes</b> to see them.</p>
    <p>The other half of the story is the <b>door</b>: a thin sheet of painted <b>steel</b> over foam insulation. The magnet does not stick to the paint or the foam. It sticks to the steel, straight through the paint.</p>
    <p>The soft <b>gasket</b> round the inside edge of the door holds a strip of the same flexible magnet. It pulls the door shut and seals it (see <a href="https://glassbox.how/fridgeclear/" target="_blank" rel="noopener">FridgeClear</a>).</p>
    <p class="tip"><b>Try it:</b> pull the layers apart, show the stripes, then switch the grains between before and after magnetising.</p>`,
  terms: [
    { t: 'Ferrite', d: 'A dark ceramic made from iron oxide with strontium or barium. It makes cheap permanent magnets that do not rust.' },
    { t: 'Flexible magnet', d: 'Ferrite powder bound in rubber or soft plastic, so the magnet bends and can be cut with scissors.' },
    { t: 'Binder', d: 'The rubber or plastic that holds the powder grains together.' },
    { t: 'Magnetising', d: 'Exposing a material to a strong field so its grains keep pointing one way afterwards.' },
    { t: 'Gasket', d: 'The soft seal round a fridge door. It has a flexible magnet strip inside.' },
  ],
  defaults: { explode: 0, stripes: false, grains: 'after' },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'stripes', type: 'toggle', label: 'Show the stripes', hint: 'Red: a north pole on the back. Blue: a south pole.' },
    { key: 'grains', type: 'seg', label: 'Ferrite grains', options: [{ v: 'before', label: 'Before magnetising' }, { v: 'after', label: 'After' }] },
  ],
  quiz: [
    { q: 'What is the dark brown layer of a flat fridge magnet made of?', options: ['Solid iron', 'Ferrite powder bound in rubber or plastic', 'Magnetised paper', 'Copper wire'], answer: 1, why: 'It is ferrite powder, up to about 90% by weight, held in a flexible binder.' },
    { q: 'Which part of the fridge door does the magnet actually hold on to?', options: ['The paint', 'The foam insulation', 'The steel sheet under the paint', 'The plastic liner'], answer: 2, why: 'Only the steel is ferromagnetic. The field passes straight through the thin paint.' },
    { q: 'Before the sheet is magnetised, why is it not a magnet?', options: ['The grains have no magnetism yet', 'The grains are magnets, but point in random directions and cancel out', 'Rubber blocks magnetism', 'It is too thin'], answer: 1, why: 'Each ferrite grain is already a tiny magnet. Magnetising lines them up in stripes so they add instead of cancelling.' },
  ],
  reel: [
    { ms: 5600, caption: 'A fridge magnet is a picture on a thin sheet of rubber packed with ferrite powder.', set: { stripes: false, grains: 'after' }, anim: { explode: [0, 1] }, view: { pos: [3.9, 4.6, 7.6], target: [0.4, 4.0, 0.6] }, spin: 0.5 },
  ],

  build({ stage }) {
    const root = stage.root, CX = 0, CY = 3.6;
    const W = MAG.w * S, H = MAG.h * S, T = MAG.t * S * EX;
    // The door, cut out as a tile: paint, steel, foam, liner.
    const DW = 7.4, DH = 6.2;
    const paint = box(DW, DH, 0.04, M.plastic(0xf3f4f6, { roughness: 0.35 })); paint.position.set(CX, CY, -0.02);
    const steel = box(DW, DH, 0.5 * S * EX, M.metal(0x9aa3b2, { roughness: 0.4 })); steel.position.set(CX, CY, -0.04 - 0.5 * S * EX / 2);
    const foam = box(DW, DH, 1.3, M.matte(0xe9d9a6)); foam.position.set(CX, CY, -0.15 - 0.65);
    const liner = box(DW, DH, 0.08, M.plastic(0xfafafa)); liner.position.set(CX, CY, -1.5);
    root.add(paint, steel, foam, liner);
    // The magnet: sheet, print, laminate.
    const sheetMat = M.matte(HEX.brown, { roughness: 0.8 });
    const sheet = box(W, H, T, sheetMat); sheet.position.set(CX, CY + 0.3, T / 2);
    const stripeMat = new THREE.MeshBasicMaterial({ map: stripeOverlay(), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    for (const z of [T / 2 + 0.004, -T / 2 - 0.004]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W, H), stripeMat); p.position.z = z; if (z < 0) p.rotation.y = Math.PI; sheet.add(p); }
    const printMat = new THREE.MeshStandardMaterial({ map: souvenirTexture(), roughness: 0.5, transparent: true });
    const print = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.03), [M.plastic(0xffffff), M.plastic(0xffffff), M.plastic(0xffffff), M.plastic(0xffffff), printMat, M.plastic(0xffffff, { transparent: true })]);
    print.castShadow = true; print.position.set(CX, CY + 0.3, T + 0.015);
    const lamMat = M.clear(0xdff2ff, 0.12, { roughness: 0.05 });
    const lam = box(W, H, 0.02, lamMat); lam.position.set(CX, CY + 0.3, T + 0.04);
    root.add(sheet, print, lam);
    const setExplode = exploder([
      { obj: lam, off: [0.5, 0.35, 3.0] }, { obj: print, off: [0.25, 0.18, 2.0] }, { obj: sheet, off: [0, 0, 1.0] },
      { obj: steel, off: [0, 0, -0.45] }, { obj: foam, off: [0, 0, -1.0] }, { obj: liner, off: [0, 0, -1.6] },
    ]);
    // The microscope view of the sheet.
    const gtex = grainTexture();
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), new THREE.MeshBasicMaterial({ map: gtex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    lens.position.set(CX + 3.1, CY - 1.4, 2.6); root.add(lens);
    const lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xcfd6e4, transparent: true, opacity: 0.7 }));
    root.add(lead);

    const L = (t, o, p, cls) => stage.label(t, p, o, cls);
    L('Flexible magnet sheet', sheet, [-W / 2 - 0.1, -H / 2 - 0.25, 0], 'hot');
    const lPrint = L('Printed picture', print, [-W / 2 + 0.2, H / 2 + 0.3, 0]);
    const lLam = L('Clear laminate', lam, [W / 2 - 0.4, H / 2 + 0.3, 0]);
    L('Door: painted steel', paint, [-DW / 2 + 1.2, -DH / 2 + 0.4, 0.1]);
    const lFoam = L('Foam insulation', foam, [-DW / 2 + 1.0, DH / 2 + 0.3, 0]);
    const lLiner = L('Plastic liner', liner, [DW / 2 - 0.9, DH / 2 + 0.3, 0]);
    const lLens = L('Ferrite grains in rubber, about 1 µm each', lens, [0, -1.5, 0]);

    let grainsNow = 'after', op = 0, tall = false, mode = '';
    const p0 = new THREE.Vector3();
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        setExplode(s.explode);
        const lay = layout(stage);
        if (lay !== mode) { mode = lay; tall = lay === 'tall'; phoneView(stage, { pos: [4.6, 7.4, 11], target: [0.2, 5.9, 0.2] }); lens.position.set(tall ? CX + 0.6 : CX + 3.1, tall ? CY + 4.3 : CY - 1.4, tall ? 1.2 : 2.6); lens.scale.setScalar(tall ? 1.25 : 1); }
        if (s.grains !== grainsNow) { grainsNow = s.grains; gtex.paint(s.grains); }
        op = approach(op, s.stripes ? 1 : 0, 8, dt);
        stripeMat.opacity = 0.85 * op;
        printMat.opacity = 1 - 0.8 * op; lamMat.opacity = 0.12 * (1 - 0.7 * op);
        const out = s.explode > 0.3;
        lPrint.visible = lLam.visible = out; lFoam.visible = lLiner.visible = out && mode === 'wide';
        lLens.visible = mode === 'wide';
        lens.lookAt(stage.camera.position);
        p0.copy(sheet.position).add(new THREE.Vector3(W / 2 - 0.3, tall ? H / 2 - 0.3 : -H / 2 + 0.3, T / 2));
        const pos = lead.geometry.attributes.position;
        pos.setXYZ(0, p0.x, p0.y, p0.z); pos.setXYZ(1, lens.position.x - 0.9 * lens.scale.x, lens.position.y + (tall ? -0.85 : 0.85) * lens.scale.x, lens.position.z); pos.needsUpdate = true;
      },
      readout: (s) => compact(stage, `<div class="big">${s.stripes ? 'Stripes 2 mm wide' : 'Three layers, under 1 mm'}</div>${s.grains === 'before' ? 'Before magnetising, the grains point at random and cancel: no magnet yet.' : 'After magnetising, the grains in each stripe point the same way.'}
        <div class="row"><span>Magnet sheet</span><b>${MAG.t} mm thick</b></div>
        <div class="row"><span>Ferrite powder</span><b>up to 90% by weight</b></div>
        <div class="row"><span>This ${MAG.w / 10} × ${MAG.h / 10} cm magnet weighs</span><b>about ${massG.toFixed(0)} g</b></div>
        <div class="row"><span>Door steel</span><b>about 0.5 mm, under paint</b></div>
        <div class="row"><span>Drawn</span><b>layers ${EX}× thicker than real</b></div>`, 2),
    };
  },
};
