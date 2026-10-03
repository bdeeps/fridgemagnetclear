// Chapter 2: the one-sided trick. A slice through a flexible magnet, with its real field.
// Scene: 0.6 units per millimetre. The slice shows 16 mm of sheet; the back (the side that goes on
// the door) faces down on a wide screen and to the right on a tall one.
//
// The field is not drawn by eye. The sheet is cut into uniformly magnetised blocks, each block is
// replaced by the bound currents on its faces (K = M × n), and the closed-form field of every
// current strip is added up (field.js). Field lines are contours of the flux function A, at equal
// steps of flux, so their density is the field strength. Checked against Mallinson's analytic
// result for a smoothly rotating sheet: strong side Br(1 − e^(−kt))e^(−kd), weak side zero, and
// plain up-and-down stripes give half of that on each side (J. C. Mallinson, "One-sided fluxes: a
// magnetic curiosity?", IEEE Trans. Magn. 9 (1973) 678).
//
// Numbers: flexible ferrite sheet Br ≈ 0.16 T (isotropic grade; Adams, Arnold FlexMag datasheets),
// scaled to a maker's pull table by REAL_SHEET (see field.js). Pole pitch about 2 mm fits that
// table; makers magnetise sheet anywhere from a few to dozens of poles per inch.
import { THREE, approach } from '../kit.js';
import { PATTERNS, BR, REAL_SHEET, sheetStrips, scanNormal, sheetPull } from '../field.js';
import { makeSection, board, panelBg, title, axes, plot, dot, text, COL, placeBoards, layout, phoneView, compact, fmtB, fmtMM, gPerCm2 } from '../fridgemagnet.js';

const K = BR.flex * Math.sqrt(REAL_SHEET);       // tesla per unit of the model's field
const DS = [0.05, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3];
function curves(s) {
  const sheet = sheetStrips({ pattern: s.pattern, pitch: s.pitch, t: s.t, periods: 10, back: -1, twist: s.twist });
  const back = [], front = [];
  for (const d of DS) {
    back.push([d, scanNormal(sheet, -s.t / 2 - d, null, 48).mag * K * 1e3]);
    front.push([d, scanNormal(sheet, s.t / 2 + d, null, 48).mag * K * 1e3]);
  }
  return { back, front };
}
const at = (c, d) => { for (let i = 1; i < c.length; i++) if (d <= c[i][0]) { const k = (d - c[i - 1][0]) / (c[i][0] - c[i - 1][0]); return c[i - 1][1] * Math.pow(c[i][1] / Math.max(1e-9, c[i - 1][1]), k); } return c.at(-1)[1]; };

export default {
  id: 'stripes',
  short: 'The one-sided trick',
  title: 'The one-sided trick',
  subtitle: 'Stripes of magnetism that turn as they go: all the field on the back, almost none on the front.',
  view: { pos: [0, 2.6, 9.6], target: [0, 3.9, 0] },
  learn: `<p>A fridge magnet is not one big magnet with a north face and a south face. Its back is a row of thin <b>stripes</b>, about 2 mm wide: north, south, north, south. The slice here is cut across those stripes. The <b>arrows</b> show which way each bit of the sheet is magnetised, and the blue-white <b>field lines</b> are worked out from them, not sketched.</p>
    <p>Start with <b>plain stripes</b>, magnetised straight up and down. The field loops out of the back <i>and</i> out of the front, equally. Half of it is wasted on the picture side.</p>
    <p>Now choose a <b>rotating</b> pattern. Between each up stripe and down stripe sits a stripe magnetised <b>sideways</b>, so the direction turns step by step along the sheet. On the back, the sideways stripes' field <b>adds</b> to the others. On the front it <b>cancels</b> them. The back gains about half as much field again, and the front loses nearly all of it. Engineers call this a <b>Halbach array</b>, and the effect <b>one-sided flux</b>.</p>
    <p>Real sheets get this pattern by being magnetised from one side only, so it is rougher than the ideal one here. That is why the printed side of a fridge magnet still clings a little, but far more weakly than the back.</p>
    <p>Notice how <b>short</b> the loops are. Field lines only reach about one stripe-width away before turning back. Narrow stripes grip hard right at the surface and fade within a millimetre or two. For magnets in general, see <a href="https://glassbox.how/magnetismclear/" target="_blank" rel="noopener">MagnetismClear</a>.</p>
    <p class="tip"><b>Try it:</b> pick the 8-step pattern, then slide the sideways stripes from 0% to 100% and watch the field leave the front and pile up on the back.</p>`,
  terms: [
    { t: 'Pole pitch', d: 'The distance from one north stripe to the next south stripe: about 2 mm on a typical fridge magnet.' },
    { t: 'Halbach array', d: 'A row of magnets whose direction turns step by step, so the field is strong on one side and nearly zero on the other.' },
    { t: 'One-sided flux', d: 'A magnetic field that comes out of only one face of a sheet. John Mallinson described it in 1973.' },
    { t: 'Field line', d: 'A curve that follows the field. Where lines crowd together, the field is strong.' },
    { t: 'Remanence', d: 'The magnetism a material keeps after it has been magnetised. Flexible ferrite sheet keeps about 0.16 tesla.' },
  ],
  defaults: { pattern: 'halbach', twist: 1, pitch: 2, t: 0.76 },
  controls: [
    { key: 'pattern', type: 'seg', label: 'Stripe pattern', options: [{ v: 'plain', label: 'Plain' }, { v: 'halbach', label: 'Rotating, 4 steps' }, { v: 'smooth', label: '8 steps' }] },
    { key: 'twist', type: 'range', label: 'Sideways stripes', min: 0, max: 1, step: 0.01, ends: ['off', 'full'], fmt: (v) => Math.round(v * 100) + '%', hint: 'Only the rotating patterns have sideways stripes.' },
    { key: 'pitch', type: 'range', label: 'Stripe width (pole pitch)', min: 1, max: 4, step: 0.25, fmt: (v) => v.toFixed(2) + ' mm' },
    { key: 't', type: 'range', label: 'Sheet thickness', min: 0.3, max: 1.6, step: 0.02, fmt: (v) => v.toFixed(2) + ' mm' },
  ],
  quiz: [
    { q: 'What does the back of a flexible fridge magnet look like to a magnetic field probe?', options: ['One big north pole', 'Thin stripes: north, south, north, south', 'No poles at all', 'A north pole in the middle and south round the edge'], answer: 1, why: 'The sheet is magnetised in narrow stripes about 2 mm wide, alternating north and south.' },
    { q: 'Why is the printed front of a fridge magnet so much weaker than the back?', options: ['The ink blocks magnetism', 'The front is made of plastic only', 'The magnetism turns step by step, so the field adds on the back and cancels on the front', 'The front poles have worn out'], answer: 2, why: 'A rotating (Halbach) pattern sends nearly all the field out of one face. Ink and paper do not block magnetism.' },
    { q: 'How far from the sheet does its field reach before it has mostly faded?', options: ['A millimetre or two', 'About 10 cm', 'About a metre', 'It never fades'], answer: 0, why: 'The loops run from one stripe to the next, so the field fades over about one stripe-width.' },
  ],
  reel: [
    { ms: 5600, caption: 'Its back is not one pole. It is stripes, north, south, north, south, each about 2 mm wide.', set: { pattern: 'plain', twist: 1, pitch: 2, t: 0.76 }, view: { pos: [0, 2.55, 4.8], target: [0, 2.55, 0] }, spin: 0 },
    { ms: 6400, caption: 'Turn the magnetism round in steps and the field piles up on the back and almost vanishes from the front.', set: { pattern: 'smooth', pitch: 2, t: 0.76 }, anim: { twist: [0, 1] }, view: { pos: [0, 2.55, 4.8], target: [0, 2.55, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const sec = makeSection(stage, { S: 0.6, span: 16, yLo: -2.4, yHi: 2.4 });
    stage.floor.visible = false;                     // a diagram, not a thing on a table
    stage.root.add(sec.group);
    const lFront = stage.label('Printed front: weak side', [-3.2, 1.55, 0], sec.group);
    const lBack = stage.label('Back: strong side, goes on the door', [-2.6, -1.75, 0], sec.group, 'hot');
    const lArrow = stage.label('Arrows: direction of magnetism', [3.0, 0.62, 0], sec.group);

    let cv = curves(this.defaults), cvKey = '';
    const b = board(stage.root, 4.3, 2.28, 990, 525, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Field strength near each face', 'average over the stripes, in millitesla');
      const top = Math.max(20, Math.ceil(Math.max(cv.back[0][1], cv.front[0][1]) / 20) * 20);
      const ax = axes(g, w, h, { xMax: 3, yMax: top, xTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yTicks: [0, top / 4, top / 2, (3 * top) / 4, top], yFmt: (v) => v.toFixed(0), xLabel: 'distance from the face (mm)', yLabel: 'mT' });
      plot(g, cv.front, ax.X, ax.Y, COL.soft, 5, [10, 8], ax); plot(g, cv.back, ax.X, ax.Y, COL.hot, 6, null, ax);
      text(g, 'back', ax.X(0.42), ax.Y(at(cv.back, 0.3)) - 14, COL.hot, 'bold 22px sans-serif');
      text(g, 'front', ax.X(1.2), ax.Y(at(cv.front, 1.2)) - 14, 'rgba(255,255,255,.75)', 'bold 22px sans-serif');
      dot(g, ax.X(0.1), ax.Y(Math.min(top, at(cv.back, 0.1))), COL.hot, 9); dot(g, ax.X(0.1), ax.Y(Math.min(top, at(cv.front, 0.1))), '#cfd6e4', 8);
    }, [3.1, 5.5, 0.3]);

    let tall = false, mode = '', tw = this.defaults.twist, last = 0;
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const lay = layout(stage);
        if (lay !== mode) {
          mode = lay; tall = lay === 'tall';
          sec.group.rotation.z = tall ? Math.PI / 2 : 0;
          sec.group.position.set(tall ? -0.4 : 0, tall ? 0 : mode === 'phone' ? 1.6 : 2.3, 0);
          placeBoards(stage, [[b, [0, 5.75, 0.3], 1.07, [0, -1.85, 0.3], 1.5]]);
          phoneView(stage, { pos: [0, 2.2, 8.8], target: [0, 2.2, 0] });
        }
        const twist = PATTERNS[s.pattern].steps.length > 2 ? s.twist : 1;
        // Recompute at most about 12 times a second while a slider is dragged.
        if (time - last > 0.08 || time < last) {
          const key = [s.pattern, twist, s.pitch, s.t].join('|');
          if (key !== cvKey) { cvKey = key; last = time; sec.set({ pattern: s.pattern, pitch: s.pitch, t: s.t, twist }); cv = curves({ ...s, twist }); b.redraw(); }
        }
        tw = approach(tw, twist, 6, dt);
        lFront.position.y = (s.t / 2) * 0.6 + 1.1; lBack.position.y = -(s.t / 2) * 0.6 - 1.2; lArrow.position.y = (s.t / 2) * 0.6 + 0.36;
        lArrow.visible = mode === 'wide'; lFront.position.x = mode === 'phone' ? -1.6 : -3.2; lBack.position.x = mode === 'phone' ? -0.6 : -2.6;
      },
      dispose() { stage.floor.visible = true; },
      readout: (s) => {
        const twist = PATTERNS[s.pattern].steps.length > 2 ? s.twist : 1;
        const c = cvKey ? cv : curves({ ...s, twist });
        const bk = at(c.back, 0.1) / 1e3, fr = at(c.front, 0.1) / 1e3, P = sheetPull({ pattern: s.pattern, pitch: s.pitch, t: s.t, twist, gap: 0 });
        const ratio = bk / Math.max(fr, 1e-9);
        return compact(stage, `<div class="big">Back ${fmtB(bk)}, front ${fmtB(fr)}</div>Measured 0.1 mm from each face. ${ratio > 1.5 ? `The back is <b>${ratio > 20 ? 'over 20' : ratio.toFixed(1)} times</b> stronger.` : 'Both faces are the same: half the field is wasted.'}
          <div class="row"><span>Pull on bare steel</span><b>${gPerCm2(P).toFixed(0)} g per cm²</b></div>
          <div class="row"><span>Field fades by half every</span><b>${fmtMM((2 * s.pitch * Math.LN2) / (2 * Math.PI))}</b></div>
          <div class="row"><span>Stripes</span><b>${s.pitch.toFixed(2)} mm wide, sheet ${s.t.toFixed(2)} mm</b></div>`, 1);
      },
    };
  },
};
