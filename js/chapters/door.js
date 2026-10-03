// Chapter 4: why it sticks to the door, and why a small gap matters so much.
// Scene: the same slice as chapter 2 (0.6 units per mm), now with the door's steel sheet under it.
//
// Physics (field.js): a slab of permeability μr mirrors the magnet's bound currents with strength
// f = (μr − 1) ÷ (μr + 1) (method of images, Jackson §5.9). For steel f ≈ 1: the field in the gap
// is the magnet's plus its mirror image's, and it meets the steel at right angles. The pull is the
// Maxwell stress B² ÷ 2μ0 on the steel's face, averaged over the stripes, times f, times the
// REAL_SHEET calibration to a maker's pull table (Adams Magnetic Products: 85 lb/ft² for 0.76 mm
// sheet on bare steel). The pull falls as e^(−2k·gap) with k = π ÷ pole pitch: for 2 mm poles it
// halves about every 0.22 mm.
//
// Inside the thin steel the flux runs sideways from under each north stripe to the south stripes
// beside it. The arrows on the steel are sized by that flux (the flux function A at the surface),
// and the readout divides it by the sheet's thickness to get the flux density in the steel. It is
// far below the 1.6–2 T at which low-carbon steel saturates, so a fridge door is "thick enough"
// for a flexible magnet (it is not for a strong neodymium disc: see chapter 6).
//
// Fridge doors: pre-painted or powder-coated low-carbon steel sheet, about 0.4–0.6 mm thick, with
// a paint film of the order of 0.02–0.1 mm (appliance pre-coated steel, maker data; drawn 0.5 mm).
// Paper: 80 g/m² office paper is about 0.1 mm thick.
import { approach } from '../kit.js';
import { BR, REAL_SHEET, DOORS, imageFactor, sheetStrips, stripsA, sheetPull } from '../field.js';
import { makeSection, board, panelBg, title, axes, plot, dot, text, COL, placeBoards, layout, phoneView, compact, fmtMM, gPerCm2, THREE, M } from '../fridgemagnet.js';

const T = 0.76, PITCH = 2, STEEL = 0.5, S = 0.6;
const K = BR.flex * Math.sqrt(REAL_SHEET);
const GAPS = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];
const PULL0 = GAPS.map((g) => [g, gPerCm2(sheetPull({ gap: g, mu: 1e9 }))]);       // on ideal steel
const pullAt = (gap, door) => gPerCm2(sheetPull({ gap, mu: DOORS[door].mu }));
// Peak flux density in the door steel (T).
function steelB(gap, door) {
  const f = imageFactor(DOORS[door].mu), sheet = sheetStrips({ periods: 10, back: -1 });
  let mx = 0;
  for (let i = 0; i < 40; i++) mx = Math.max(mx, Math.abs(stripsA(sheet.strips, -2 + (i / 40) * 4, -T / 2 - gap)));
  return (mx * (1 + f) * K) / STEEL;
}

export default {
  id: 'door',
  short: 'Why it sticks',
  title: 'Why it sticks to the door',
  subtitle: 'The steel becomes a magnet facing it. A millimetre of gap is enough to lose it.',
  view: { pos: [0, 2.6, 9.6], target: [0, 3.9, 0] },
  learn: `<p>A fridge door is a thin sheet of painted <b>steel</b>, and steel is <b>ferromagnetic</b>. It is full of tiny magnetic regions called <b>domains</b>, normally pointing every which way so they cancel out. Bring the magnet's stripes close and the domains under each stripe swing round to face it: a south patch forms under every north stripe, and a north patch under every south stripe. The steel has become a <b>mirror image</b> of the magnet, and unlike poles pull.</p>
    <p>Look at the field lines. Without steel they loop lazily through the air. With steel they dive <b>straight in</b>, run sideways inside the metal, and come back out under the next stripe. Steel carries magnetic flux hundreds of times more easily than air does.</p>
    <p>Now open the <b>gap</b>. The field of narrow stripes fades within a millimetre or so, and the pull depends on the field <b>squared</b>, so it fades twice as fast. For 2 mm stripes the pull <b>halves about every 0.2 mm</b>: two sheets of paper. A few sheets are fine. A thick stack, a wad of card or a door with a thick plastic skin, and the magnet slides off.</p>
    <p>Change the door. <b>Aluminium</b>, glass and plastic have no domains to line up, so nothing happens. <b>Stainless steel</b> comes in two families. <b>Ferritic</b> grades (like 430) are magnetic and hold a magnet. <b>Austenitic</b> grades (like 304, common on fridge fronts and kitchen sinks) have a different crystal structure that is not ferromagnetic, so the magnet falls off. That is why magnets will not stick to some shiny fridges.</p>
    <p class="tip"><b>Try it:</b> slide the gap from zero to 1 mm and watch the pull collapse. Then switch the door to 304 stainless.</p>`,
  terms: [
    { t: 'Ferromagnetic', d: 'A material, like iron, nickel and most steel, whose atoms line up their magnetism together, so a magnet pulls it strongly.' },
    { t: 'Domain', d: 'A tiny region inside iron or steel where all the atomic magnets point the same way.' },
    { t: 'Permeability', d: 'How easily a material carries magnetic flux, compared with empty space. Steel: hundreds to thousands. Aluminium: 1.' },
    { t: 'Austenitic stainless steel', d: 'Stainless steel with nickel in it, such as grade 304. Its crystal structure is not ferromagnetic.' },
    { t: 'Pull pressure', d: 'The pull per unit of area. A flexible magnet manages a few tens of grams per square centimetre on bare steel.' },
  ],
  defaults: { gap: 0.1, door: 'steel' },
  controls: [
    { key: 'gap', type: 'range', label: 'Gap between magnet and steel', min: 0, max: 3, step: 0.05, ends: ['touching', '3 mm'], fmt: (v) => (v < 0.01 ? 'bare steel' : v.toFixed(2) + ' mm ≈ ' + Math.round(v / 0.1) + ' sheets of paper'), hint: 'Paint alone is about 0.05 to 0.1 mm.' },
    { key: 'door', type: 'seg', label: 'What the door is made of', options: [{ v: 'steel', label: 'Steel' }, { v: 's430', label: '430 stainless' }, { v: 's304', label: '304 stainless' }, { v: 'alu', label: 'Aluminium' }, { v: 'glass', label: 'Glass' }] },
  ],
  quiz: [
    { q: 'Why does a magnet stick to a steel door that is not itself a magnet?', options: ['The paint is sticky', 'The magnet lines up domains in the steel, which then attract it', 'Steel is always a strong magnet', 'Static electricity'], answer: 1, why: 'The steel becomes magnetised by the magnet next to it, with unlike poles facing, so the two pull together.' },
    { q: 'A fridge magnet with 2 mm stripes holds one sheet of paper. Why does it drop a thick stack?', options: ['Paper blocks magnetism', 'The stack is slippery', 'The field of narrow stripes fades within a millimetre or two, so the pull collapses', 'Paper is magnetic the other way'], answer: 2, why: 'Paper does not block the field. It just adds distance, and this field is very short-ranged.' },
    { q: 'Why do magnets fall off some stainless-steel fridges?', options: ['They are too shiny', 'Common 304 stainless is austenitic, which is not ferromagnetic', 'Stainless steel has no iron in it', 'The doors are too cold'], answer: 1, why: 'Grade 304 is mostly iron, but its crystal structure does not line up its magnetism. Ferritic grades like 430 do hold magnets.' },
  ],
  reel: [
    { ms: 5600, caption: 'The steel door becomes a mirror image of the stripes, and the field lines dive straight into it.', set: { door: 'steel' }, anim: { gap: [1.6, 0.1] }, view: { pos: [0, 2.55, 4.8], target: [0, 2.55, 0] }, spin: 0 },
    { ms: 5600, caption: 'The pull halves about every 0.2 mm of gap. A few sheets of paper are fine. A thick stack falls.', set: { door: 'steel' }, anim: { gap: [0.1, 2.2] }, view: { pos: [0, 2.55, 4.8], target: [0, 2.55, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const sec = makeSection(stage, { S, span: 16, yLo: -4, yHi: 1.6 });
    stage.floor.visible = false;
    stage.root.add(sec.group);
    const lFront = stage.label('Printed front', [-3.4, T / 2 * S + 0.55, 0], sec.group);
    const lSteel = stage.label('Door: steel sheet', [-3.0, 0, 0], sec.group, 'hot');
    const lFlux = stage.label('Flux runs sideways in the steel', [2.4, 0, 0], sec.group);
    // Sheets of paper in the gap (0.1 mm each), up to 30.
    const paperMat = M.matte(0xf4f1e8), papers = [];
    for (let i = 0; i < 30; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(16 * S * 0.86, 0.085 * S, sec.depth * 0.9), paperMat);
      p.visible = false; sec.group.add(p); papers.push(p);
    }
    const paperEdge = new THREE.Mesh(new THREE.PlaneGeometry(16 * S * 0.86, 1), new THREE.MeshBasicMaterial({ color: 0x1c2740, toneMapped: false, transparent: true, opacity: 0.62 }));
    paperEdge.position.z = 0.01; sec.group.add(paperEdge);

    let gapNow = this.defaults.gap, doorNow = this.defaults.door;
    const b = board(stage.root, 4.3, 2.28, 990, 525, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Pull against gap', 'grams held per square centimetre of magnet');
      const ax = axes(g, w, h, { xMax: 3, yMax: 50, xTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yTicks: [0, 10, 20, 30, 40, 50], xLabel: 'gap (mm): ten sheets of paper is 1 mm', yLabel: 'g per cm²' });
      const f = imageFactor(DOORS[doorNow].mu);
      plot(g, PULL0, ax.X, ax.Y, 'rgba(255,255,255,.3)', 4, [8, 8], ax);
      plot(g, PULL0.map(([x, y]) => [x, y * f]), ax.X, ax.Y, COL.hot, 6, null, ax);
      const y = pullAt(gapNow, doorNow);
      dot(g, ax.X(gapNow), ax.Y(y), COL.hot, 11);
      text(g, DOORS[doorNow].name, ax.X(1.1), ax.Y(34), COL.hot, 'bold 22px sans-serif');
      if (f < 0.9) text(g, 'dashed: ordinary steel', ax.X(1.1), ax.Y(27), 'rgba(255,255,255,.6)', '20px sans-serif');
    }, [3.1, 5.6, 0.3]);

    let tall = false, mode = '', last = -1, key = '', gapShown = this.defaults.gap;
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const lay = layout(stage);
        if (lay !== mode) {
          mode = lay; tall = lay === 'tall';
          sec.group.rotation.z = tall ? Math.PI / 2 : 0;
          sec.group.position.set(tall ? 0.5 : 0, tall ? 0 : 2.6, 0);
          placeBoards(stage, [[b, [0, 5.75, 0.3], 1.07, [0, -1.25, 0.3], 1.5]]);
          phoneView(stage, { pos: [0, 2.7, 8.8], target: [0, 2.7, 0] });
        }
        gapShown = approach(gapShown, s.gap, 10, dt);
        if (Math.abs(gapShown - s.gap) < 0.004) gapShown = s.gap;
        const k = gapShown.toFixed(2) + s.door;
        if (k !== key && (time - last > 0.07 || time < last)) {
          key = k; last = time; gapNow = gapShown; doorNow = s.door;
          sec.set({ pattern: 'halbach', pitch: PITCH, t: T, twist: 1, steel: { gap: gapShown, mu: DOORS[s.door].mu, thick: STEEL } });
          b.redraw();
          const ys = (-T / 2 - gapShown) * S;
          const n = Math.min(30, Math.floor(gapShown / 0.1 + 1e-6));
          papers.forEach((p, i) => { p.visible = i < n; p.position.set(0, ys + (i + 0.5) * 0.1 * S, -sec.depth / 2 - 0.03); });
          paperEdge.visible = n > 0; paperEdge.scale.y = Math.max(0.001, n * 0.1 * S); paperEdge.position.y = ys + (n * 0.1 * S) / 2;
          lSteel.position.y = ys - STEEL * S - 0.4; lFlux.position.y = ys - STEEL * S - 0.4;
          lSteel.element.textContent = 'Door: ' + DOORS[s.door].name.toLowerCase();
          lFlux.visible = imageFactor(DOORS[s.door].mu) > 0.5 && mode === 'wide';
        }
      },
      dispose() { stage.floor.visible = true; },
      readout: (s) => {
        const p = pullAt(s.gap, s.door), f = imageFactor(DOORS[s.door].mu), p0 = pullAt(0, 'steel');
        const bs = steelB(s.gap, s.door);
        const head = f < 0.05 ? `<div class="big">It will not stick</div>${DOORS[s.door].name} has no domains to line up: it mirrors only <b>${(f * 100).toFixed(f < 0.001 ? 4 : 1)}%</b> of the magnet.`
          : `<div class="big">Pull: ${p >= 1 ? p.toFixed(0) : p.toFixed(2)} g per cm²</div>${s.gap < 0.01 ? 'Touching bare steel: the most it can do.' : `That is <b>${(100 * p / p0).toFixed(p / p0 < 0.1 ? 1 : 0)}%</b> of its pull on bare steel.`}`;
        return compact(stage, `${head}
          <div class="row"><span>A 7 × 5 cm magnet pulls with</span><b>${p * 35 >= 10 ? Math.round(p * 35) : (p * 35).toFixed(1)} g</b></div>
          <div class="row"><span>Gap</span><b>${fmtMM(s.gap)}</b></div>
          <div class="row"><span>The door mirrors</span><b>${(f * 100).toFixed(f > 0.9 ? 1 : f < 0.001 ? 4 : 2)}% of the stripes</b></div>
          ${f > 0.5 ? `<div class="row"><span>Flux in the door steel</span><b>${bs.toFixed(2)} T (saturates near 1.6 T)</b></div>` : ''}`, 1);
      },
    };
  },
};
