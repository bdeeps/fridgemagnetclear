// Chapter 6: the hard little magnets (ceramic ferrite, neodymium) against the flexible sheet, how
// far each one's field reaches, and the myths and safety rules that follow from that.
// Scene: 1 unit = 1 cm. Three magnets lie on a wooden table (wood does not change the field).
//
// Fields:
//  · Disc magnets are magnetised through their thickness: a pole on each flat face. On the axis,
//      B(z) = (Br ÷ 2) × [ (z + L) ÷ √((z + L)² + R²) − z ÷ √(z² + R²) ]          (field.js)
//    Ceramic ferrite disc 20 × 5 mm, grade Y30 / C8, Br 0.39 T. Neodymium disc 10 × 2 mm, grade N35,
//    Br 1.2 T (IEC 60404-8-1 grade tables; K&J Magnetics, supermagnete datasheets).
//  · Flexible sheet: the calibrated stripe model of chapter 2, averaged over the stripes. It falls
//    by e^(−πd ÷ pitch): for 2 mm stripes, a factor of 4.8 for every millimetre.
//  · The "bubbles" are surfaces of equal field. For the discs: the distance along the axis from the
//    exact formula, with the shape of a dipole's surface, r(θ) = r_axis × ((1 + 3cos²θ) ÷ 4)^(1/6).
//  · Pull: Maxwell stress B² ÷ 2μ0 with the image field, on thick steel through 0.05 mm of paint
//    (field.js, discPull). Check: the same code gives 7.3 lb for a 1/2 × 1/8 inch N42 disc, which
//    K&J Magnetics list at 6.44 lb (D82). A thin fridge door saturates under a neodymium disc, so
//    on a real door it pulls less than this.
//
// Thresholds (what a field can do):
//  · Earth's field: 25–65 µT (NOAA NCEI, World Magnetic Model).
//  · Implanted pacemakers and defibrillators: ISO 14117 has them tested to work normally in static
//    fields up to 1 mT (10 gauss); stronger fields can switch them into "magnet mode". The US FDA
//    (13 May 2021) advises keeping consumer electronics with strong magnets 6 inches (15 cm) from an
//    implanted device, and not carrying them in a pocket over it.
//  · Magnetic stripes: low-coercivity (LoCo, hotel keys, gift cards) 300 Oe; high-coercivity (HiCo,
//    bank cards) 2,750–4,000 Oe (ISO/IEC 7811-2 and 7811-6; K&J Magnetics, "Credit Cards and Magnetic
//    Stripes"). In air 1 Oe corresponds to 0.1 mT, so 30 mT and 275 mT.
import { THREE, M, box, approach, clamp } from '../kit.js';
import { BR, REAL_SHEET, sheetStrips, scanNormal, sheetPull, discAxisB, discPull, G0 } from '../field.js';
import { board, panelBg, title, axes, plot, dot, text, COL, HEX, placeBoards, layout, phoneView, compact, fmtB, fmtG, fmtMM, gPerCm2, souvenirTexture } from '../fridgemagnet.js';

const SHEET_K = BR.flex * Math.sqrt(REAL_SHEET);
// Average field of the sheet's strong face against distance (mm → T): sampled, then pure exponential.
const SH = (() => { const sheet = sheetStrips({ periods: 10, back: -1 }); return [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3].map((d) => [d, scanNormal(sheet, -0.38 - d, null, 48).mag * SHEET_K]); })();
function sheetB(d) {
  if (d <= SH[0][0]) return SH[0][1];
  for (let i = 1; i < SH.length; i++) if (d <= SH[i][0]) { const k = (d - SH[i - 1][0]) / (SH[i][0] - SH[i - 1][0]); return SH[i - 1][1] * Math.pow(SH[i][1] / SH[i - 1][1], k); }
  return SH.at(-1)[1] * Math.exp(-(Math.PI / 2) * (d - 3));
}
export const KINDS = {
  sheet: { name: 'Flexible sheet', sub: '5 × 5 cm, 0.76 mm', area: 25, mass: 25 * 0.076 * 3.7, B: sheetB, pull: (gap) => (gPerCm2(sheetPull({ gap })) * 25 * G0) / 1000, color: HEX.brown },
  ferrite: { name: 'Ceramic ferrite disc', sub: '20 mm across, 5 mm thick', R: 10, L: 5, Br: BR.ferrite, area: Math.PI, mass: Math.PI * 0.5 * 4.9, color: 0x2c2f36 },
  neo: { name: 'Neodymium disc', sub: '10 mm across, 2 mm thick', R: 5, L: 2, Br: BR.n35, area: Math.PI * 0.25, mass: Math.PI * 0.25 * 0.2 * 7.5, color: 0xcfd3da },
};
for (const k of ['ferrite', 'neo']) { const m = KINDS[k]; m.B = (d) => discAxisB(m.Br, m.R, m.L, d); m.pull = (gap) => discPull(m.Br, m.R, m.L, gap); }
// Distance (mm from the face) at which the field has fallen to B0, or 0 if it never reaches B0.
function rangeOf(m, B0) {
  if (m.B(0.02) < B0) return 0;
  let a = 0.02, b = 500;
  for (let i = 0; i < 50; i++) { const c = Math.sqrt(a * b); if (m.B(c) > B0) a = c; else b = c; }
  return a;
}
// How many A4 sheets (5 g, 0.1 mm each) it pins to thick steel with μ = 0.3.
function sheetsHeld(m) {
  let n = 0;
  while (n < 200 && 0.3 * (m.pull(0.05 + (n + 1) * 0.1) / G0) * 1000 >= (n + 1) * 5 + m.mass) n++;
  return n;
}
const LIMITS = [
  { B: 50e-6, name: 'Earth\'s own field', short: 'Earth' },
  { B: 1e-3, name: 'Implant test level (1 mT)', short: 'pacemaker test level' },
  { B: 30e-3, name: 'Hotel key card stripe (LoCo)', short: 'hotel key card' },
  { B: 275e-3, name: 'Bank card stripe (HiCo)', short: 'bank card stripe' },
];
const logs = Array.from({ length: 71 }, (_, i) => Math.pow(10, -1 + (i / 70) * 3.5));

export default {
  id: 'kinds',
  short: 'Hard magnets, myths, safety',
  title: 'Stronger magnets, myths and safety',
  subtitle: 'A ceramic disc, a neodymium disc and the flexible sheet: how far each field really reaches.',
  view: { pos: [1, 12, 24], target: [-1, 5.5, 0] },
  learn: `<p>Not every fridge magnet is a flexible sheet. The chunky ones, behind a plastic fruit or a souvenir from a hill station, hide a hard <b>disc magnet</b>. It has just two poles, one on each flat face, so its field reaches much further than the sheet's narrow stripes.</p>
    <p>A <b>ceramic ferrite</b> disc is the same material as the powder in the sheet, pressed solid and fired. A <b>neodymium</b> disc is a different thing altogether: an alloy of neodymium, iron and boron, about three times as strongly magnetised. A neodymium disc the size of a shirt button pulls on steel with over a kilogram, and for its size about forty times harder than flexible sheet.</p>
    <p><b>Myths, answered plainly.</b> Fridge magnets do <b>not</b> raise the electricity bill: a permanent magnet uses no energy, and its field barely gets through the door's steel. They do <b>not</b> spoil food. A flexible fridge magnet will <b>not</b> wipe a phone, whose memory is not magnetic at all, or a modern bank card, whose stripe needs a field far stronger than a fridge magnet makes (and the chip does not care). The weak ones are <b>hotel key cards</b>, old tapes and floppy disks: keep hard magnets off those.</p>
    <p><b>Do they wear out?</b> Barely. Ferrite keeps its magnetism for decades. It is lost only by heating towards the <b>Curie point</b>, about 450 °C for ferrite, or by a stronger magnet forcing it the other way. The rubber gives up long before the ferrite does.</p>
    <p><b>Safety, from the regulators.</b> Small strong magnets are dangerous to <b>swallow</b>. The US Consumer Product Safety Commission warns that two or more can attract each other through the walls of the gut and trap and damage the tissue between them, and estimated about 26,600 emergency visits for swallowed magnets in the US from 2010 to 2021. Keep small neodymium magnets away from young children, and get medical help at once if one is swallowed. If you have a <b>pacemaker</b> or implanted defibrillator, the US FDA advises keeping strong magnets at least <b>15 cm (6 inches)</b> from it, and asking your doctor.</p>
    <p class="tip"><b>Try it:</b> pick each magnet and move the card away. Watch for the distance where the field drops below each line on the chart.</p>`,
  terms: [
    { t: 'Neodymium magnet', d: 'A magnet made of neodymium, iron and boron: the strongest kind you can buy. Invented in 1982–84.' },
    { t: 'Ceramic magnet', d: 'Solid ferrite, pressed and fired like pottery. Cheap, brittle and moderately strong.' },
    { t: 'Curie point', d: 'The temperature above which a material stops being a permanent magnet. About 450 °C for ferrite.' },
    { t: 'Coercivity', d: 'How strong a field it takes to wipe or reverse a magnet. Bank card stripes have high coercivity; hotel key cards low.' },
    { t: 'Millitesla (mT)', d: 'A thousandth of a tesla, the unit of magnetic field. The Earth\'s field is about 0.05 mT.' },
  ],
  defaults: { kind: 'neo', d: 10 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Magnet', options: [{ v: 'sheet', label: 'Flexible sheet' }, { v: 'ferrite', label: 'Ceramic disc' }, { v: 'neo', label: 'Neodymium disc' }] },
    { key: 'd', type: 'log', label: 'Distance from the magnet\'s face', min: 0.5, max: 100, fmt: (v) => fmtMM(v) },
  ],
  quiz: [
    { q: 'Why does a disc magnet\'s field reach further than a flexible sheet\'s?', options: ['It is heavier', 'It has one pole on each face, not narrow alternating stripes that cancel a short way off', 'It is made of metal', 'It is rounder'], answer: 1, why: 'Close stripes of opposite poles cancel within a millimetre or two. Two well-separated poles are felt much further away.' },
    { q: 'Will a flexible fridge magnet wipe your phone?', options: ['Yes, always', 'Only old phones', 'No: phone memory is not stored magnetically, and the field fades within millimetres', 'Only if it touches the screen'], answer: 2, why: 'Flash memory holds data as trapped electric charge. A magnet can at most confuse the compass for a moment.' },
    { q: 'Why are small neodymium magnets dangerous for young children?', options: ['They are poisonous', 'They are radioactive', 'Two swallowed magnets can attract through the gut wall and damage the tissue trapped between them', 'They get hot'], answer: 2, why: 'That is the hazard consumer-safety regulators warn about. Swallowed magnets need urgent medical help.' },
  ],
  reel: [
    { ms: 5800, caption: 'A neodymium disc the size of a shirt button pulls about forty times harder for its size, and reaches centimetres.', set: { kind: 'neo' }, anim: { d: [2, 45, true] }, view: { pos: [1.2, 4.2, 6.2], target: [0, 3.6, 0] }, spin: 0.25 },
  ],

  build({ stage }) {
    const root = stage.root, TY = 0.6;
    const table = box(25, 0.6, 11, M.matte(0x6b4a2e, { roughness: 0.9 })); table.position.set(-1, TY - 0.3, 0); root.add(table);
    const groups = {}, X = { sheet: -9, ferrite: -1.5, neo: 6 };
    // Flexible sheet, back up (drawn 3× thicker).
    { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(5, 0.23, 5), [M.matte(HEX.brown), M.matte(HEX.brown), M.matte(HEX.brown), new THREE.MeshStandardMaterial({ map: souvenirTexture() }), M.matte(HEX.brown), M.matte(HEX.brown)]); m.position.y = 0.115; m.castShadow = true; g.add(m); g.userData.top = 0.23; groups.sheet = g; }
    { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 48), M.matte(0x2c2f36, { roughness: 0.6 })); m.position.y = 0.25; m.castShadow = true; g.add(m); g.userData.top = 0.5; groups.ferrite = g; }
    { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 48), M.metal(0xdfe3ea, { roughness: 0.18 })); m.position.y = 0.1; m.castShadow = true; g.add(m); g.userData.top = 0.2; groups.neo = g; }
    // Bubbles of equal field: a dipole-shaped dome for the discs, a thin slab for the sheet.
    const prof = []; for (let i = 0; i <= 40; i++) { const th = (i / 40) * Math.PI / 2, r = Math.pow((1 + 3 * Math.cos(th) ** 2) / 4, 1 / 6); prof.push(new THREE.Vector2(r * Math.sin(th), r * Math.cos(th))); }
    const domeGeo = new THREE.LatheGeometry(prof, 56);
    const bub = {};
    for (const k of Object.keys(KINDS)) {
      const g = groups[k]; g.position.set(X[k], TY, 0); root.add(g);
      bub[k] = [[1e-3, 0xffb547, 0.16], [30e-3, 0xff5a4a, 0.3]].map(([B0, col, op]) => {
        const mat = M.ghost(col, op), r = rangeOf(KINDS[k], B0);
        let mesh;
        if (k === 'sheet') { mesh = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1, 5.1), mat); mesh.scale.y = Math.max(0.001, r / 10); mesh.position.y = g.userData.top + r / 20; }
        else { mesh = new THREE.Mesh(domeGeo, mat); const ra = (r + KINDS[k].L / 2) / 10; mesh.scale.setScalar(Math.max(0.001, ra)); mesh.position.y = g.userData.top / 2; }
        mesh.visible = r > 0; mesh.renderOrder = B0 > 0.01 ? 2 : 3; g.add(mesh);
        return { mesh, r, B0 };
      });
    }
    // A bank card with a magnetic stripe, held above the chosen magnet.
    const card = new THREE.Group(); root.add(card);
    const cardBody = box(8.56, 0.08, 5.4, M.plastic(0x2f6fd6, { roughness: 0.4 })); card.add(cardBody);
    const stripe = box(8.56, 0.01, 0.9, M.matte(0x1b1410)); stripe.position.set(0, -0.045, -1.6); card.add(stripe);
    const chip = box(1.1, 0.02, 0.9, M.metal(0xd8b24a)); chip.position.set(-2.4, 0.045, 0.3); card.add(chip);
    const ruler = box(0.04, 1, 0.04, M.glow(0xffffff, { transparent: true, opacity: 0.6 })); root.add(ruler);
    const lName = Object.fromEntries(Object.keys(KINDS).map((k) => [k, stage.label(KINDS[k].name, [0, -0.5, 3.6], groups[k])]));
    const lCard = stage.label('', [0, 0.2, 3.3], card, 'hot');
    const l1 = stage.label('Orange: above 1 mT. Red: above 30 mT', [0, 0, 0], root);

    let kindNow = 'neo', dNow = 10;
    const b = board(root, 15, 7.95, 990, 525, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Field against distance', 'on each magnet\'s axis; both scales are logarithmic');
      const ax = axes(g, w, h, { logX: true, logY: true, xMin: -1, xMax: 2.5, yMin: -6, yMax: 0, xTicks: [0.1, 1, 10, 100], yTicks: [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1], xFmt: (v) => v + ' mm', yFmt: (v) => fmtB(v).replace('0.00 T', '1 µT').replace('1.00 T', '1 T'), xLabel: 'distance from the face', yLabel: '' });
      for (const L of LIMITS) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([6, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(ax.x0, ax.Y(L.B)); g.lineTo(ax.x1, ax.Y(L.B)); g.stroke(); g.setLineDash([]); g.font = '16px sans-serif'; text(g, L.short, ax.x1 - g.measureText(L.short).width - 8, ax.Y(L.B) - 6, 'rgba(255,255,255,.7)', '16px sans-serif'); }
      const cols = { sheet: '#c9906b', ferrite: '#b9c0cc', neo: COL.field };
      for (const k of Object.keys(KINDS)) plot(g, logs.map((d) => [d, Math.max(KINDS[k].B(d), 1e-9)]), ax.X, ax.Y, cols[k], k === kindNow ? 7 : 3.5, null, ax);
      text(g, 'sheet', ax.X(2.2), ax.Y(2e-5), cols.sheet, 'bold 18px sans-serif'); text(g, 'ceramic', ax.X(0.13), ax.Y(KINDS.ferrite.B(0.13)) + 22, cols.ferrite, 'bold 18px sans-serif'); text(g, 'neodymium', ax.X(0.13), ax.Y(KINDS.neo.B(0.13)) - 10, cols.neo, 'bold 18px sans-serif');
      const By = KINDS[kindNow].B(dNow);
      if (By > 1e-6) dot(g, ax.X(dNow), ax.Y(By), cols[kindNow], 11);
    }, [5.6, 12.6, -6.2]);

    let tall = false, mode = '', kindShown = '', dShown = 10, key = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const lay = layout(stage);
        if (lay !== mode || s.kind !== kindShown) {
          const changed = lay !== mode;
          mode = lay; tall = lay !== 'wide'; kindShown = s.kind;
          // On a tall or narrow screen only the chosen magnet is shown, in the middle.
          for (const k of Object.keys(KINDS)) { groups[k].visible = !tall || k === s.kind; groups[k].position.x = tall ? 0 : X[k]; }
          table.scale.x = tall ? 0.5 : 1; table.position.x = tall ? 0 : -1;
          placeBoards(stage, [[b, [0, 7.9, -1], 0.42, [0, 2.9, -5.4], 0.6]]);
          if (changed) phoneView(stage, { pos: [0, 11.6, 15], target: [0, 7.8, 0] });
        }
        dShown = approach(dShown, s.d, 10, dt);
        const k2 = s.kind + dShown.toFixed(2);
        if (k2 !== key) { key = k2; kindNow = s.kind; dNow = dShown; b.redraw(); }
        const g = groups[s.kind], top = TY + g.userData.top, y = top + dShown / 10;
        card.position.set(g.position.x, y + 0.045, 0);
        ruler.scale.y = Math.max(0.001, dShown / 10); ruler.position.set(g.position.x + (s.kind === 'sheet' ? 2.2 : KINDS[s.kind].R / 10 + 0.15), top + dShown / 20, 2.9);
        const B = KINDS[s.kind].B(s.d);
        lCard.element.textContent = `${fmtMM(s.d)} away: ${fmtB(B)}`;
        const wide = mode === 'wide';
        for (const k of Object.keys(KINDS)) { lName[k].visible = wide; bub[k].forEach((q) => { q.mesh.material.opacity = (k === s.kind ? 1 : 0.45) * (q.B0 > 0.01 ? 0.3 : 0.16); }); }
        const bb = bub[s.kind];
        l1.visible = wide && s.kind !== 'sheet';
        l1.position.set(g.position.x - 1.2, top + bb[0].r / 10 + 1.0, 0);
      },
      readout: (s) => {
        const m = KINDS[s.kind], B = m.B(s.d), pull = m.pull(0.05), n = sheetsHeld(m);
        const rows = LIMITS.map((L) => `<div class="row"><span>${L.name}</span><b class="${B > L.B ? 'no' : 'ok'}">${B > L.B ? 'above' : 'below'}</b></div>`).join('');
        const r1 = rangeOf(m, 1e-3);
        return compact(stage, `<div class="big">${fmtB(B)} at ${fmtMM(s.d)}</div>${m.name}, ${m.sub}.
          ${rows}
          <div class="row"><span>Drops under 1 mT beyond</span><b>${fmtMM(r1)}</b></div>
          <div class="row"><span>Pull on thick steel</span><b>${fmtG((pull / G0) * 1000)} (${((pull / G0) * 1000 / m.area).toFixed(0)} g per cm²)</b></div>
          <div class="row"><span>A4 sheets it can pin (μ 0.3)</span><b>about ${n}</b></div>`, 4);
      },
    };
  },
};
