// Chapter 3: two ways to find the stripes at home. A magnetic viewing film, and two fridge magnets
// rubbed back to back, which jump along in steps.
// Scene: 0.12 units per millimetre across the table; thicknesses are drawn 3 times too big.
//
// The force between the two sheets is computed, not assumed: the upper sheet's bound currents sit
// in the lower sheet's field, dF = K ẑ × B dl, summed over one period (field.js, twoSheetForce).
// For 2 mm poles and a 0.1 mm gap (two printed laminates would be more) the sideways force swings
// between about ±34 g per cm², repeating every 4 mm: one north stripe plus one south stripe.
// The magnet's motion is a simple stick-slip model: your finger pulls through a soft spring, the
// stripes hold the magnet in a "valley" until the spring wins, then it snaps to the next valley.
//
// Viewing film: a sheet of micro-capsules holding nickel flakes in oil. Where the field lies along
// the film the flakes lie flat and reflect light (bright); where it points through the film the
// flakes stand on edge (dark) (Wikipedia, "Magnetic field viewing film"; maker notes). So the film
// is bright along the boundaries between stripes and dark over the middle of each pole. The
// brightness drawn here is |B along the film| ÷ |B| from the same field model, 0.3 mm above the back.
import { THREE, M, box, approach, clamp } from '../kit.js';
import { sheetStrips, stripsB, twoSheetForce } from '../field.js';
import { board, panelBg, title, axes, plot, dot, text, COL, HEX, placeBoards, layout, phoneView, compact, gPerCm2, souvenirTexture, pointer } from '../fridgemagnet.js';

const S = 0.12, TH = 0.76 * S * 3, LOW = { w: 64, d: 44 }, UP = { w: 28, d: 40 };
function forceTable(pitch) {
  const lam = 2 * pitch, n = 48, sh = [], nm = [];
  for (let i = 0; i <= n; i++) { const f = twoSheetForce({ pitch, shift: (i / n) * lam, gap: 0.1 }); sh.push(gPerCm2(f.shear)); nm.push(gPerCm2(f.normal)); }
  const look = (arr, x) => { const u = ((((x % lam) + lam) % lam) / lam) * n, i = Math.floor(u), k = u - i; return arr[i] + (arr[Math.min(n, i + 1)] - arr[i]) * k; };
  return { lam, shear: (x) => look(sh, x), normal: (x) => look(nm, x), max: Math.max(...sh.map(Math.abs)) };
}
// How bright the film looks across one period (0..1), from the field 0.3 mm above the strong face.
function filmProfile(pitch, n = 64) {
  const sheet = sheetStrips({ pitch, periods: 10, back: 1 }), out = [];
  for (let i = 0; i < n; i++) { const [bx, by] = stripsB(sheet.strips, (i / n) * 2 * pitch, 0.38 + 0.3); out.push(Math.abs(bx) / Math.hypot(bx, by)); }
  return out;
}

export default {
  id: 'steps',
  short: 'Find the stripes',
  title: 'Find the stripes yourself',
  subtitle: 'Rub two fridge magnets back to back and they jump in steps. A green film shows why.',
  view: { pos: [-0.8, 9.6, 10.6], target: [-0.8, 2.2, -0.4] },
  learn: `<p>You can feel the stripes with your fingers. Take two flat fridge magnets and put them <b>back to back</b>, brown sides together. Now slide one across the other. In one direction it glides. Turn it a quarter turn and it <b>judders</b>, clicking along in little jumps.</p>
    <p>Each jump is the stripes passing over each other. When north stripes sit over south stripes, the sheets <b>attract</b> and lock together. Slide half a stripe and norths begin to face norths: the sheets <b>repel</b>, the top one lifts a little and skips forward to the next place where it locks. One jump is <b>two stripe-widths</b>, about 4 mm.</p>
    <p>Slide <i>along</i> the stripes instead and nothing changes as you go, so there is nothing to click against.</p>
    <p>To <i>see</i> the stripes, lay a <b>magnetic viewing film</b> on the back. It is a thin green sheet full of tiny capsules, each holding flakes of nickel floating in oil. Where the field points <b>through</b> the film, the flakes stand on edge and the film looks <b>dark</b>. Where the field runs <b>along</b> the film, the flakes lie flat and shine. So you see a bright line at every boundary between a north stripe and a south stripe.</p>
    <p class="tip"><b>Try it:</b> pull the top magnet slowly with the slider and count the jumps. Then turn it 90° and pull again.</p>`,
  terms: [
    { t: 'Viewing film', d: 'A green sheet of nickel flakes in oil that turns dark where a magnetic field passes through it and bright where the field runs along it.' },
    { t: 'Stick-slip', d: 'Motion in jerks: something holds still while the push builds up, then lets go all at once.' },
    { t: 'Period', d: 'The distance after which a pattern repeats. Here it is one north stripe plus one south stripe.' },
    { t: 'Repel', d: 'To push away. Like poles (north and north, or south and south) repel.' },
  ],
  defaults: { pull: 0, turn: 'across', film: true, pitch: 2 },
  controls: [
    { key: 'pull', type: 'range', label: 'Pull the top magnet', min: 0, max: 20, step: 0.05, ends: ['start', '20 mm'], fmt: (v) => v.toFixed(1) + ' mm', hint: 'Your finger pulls through a soft spring, as a real fingertip does.' },
    { key: 'turn', type: 'seg', label: 'Which way you slide', options: [{ v: 'across', label: 'Across the stripes' }, { v: 'along', label: 'Along the stripes' }] },
    { key: 'film', type: 'toggle', label: 'Lay the viewing film on the back' },
    { key: 'pitch', type: 'range', label: 'Stripe width', min: 1, max: 4, step: 0.5, fmt: (v) => v.toFixed(1) + ' mm' },
  ],
  quiz: [
    { q: 'Two fridge magnets are back to back. Why does one judder when you slide it across the other?', options: ['The backs are rough', 'Their stripes alternately attract and repel as they pass', 'Static electricity builds up', 'Air gets trapped between them'], answer: 1, why: 'North stripes over south stripes lock together; half a stripe later like poles face each other and push apart.' },
    { q: 'How far does the magnet move in one jump, if the stripes are 2 mm wide?', options: ['1 mm', '2 mm', '4 mm', '8 mm'], answer: 2, why: 'The pattern repeats after one north stripe plus one south stripe: 4 mm.' },
    { q: 'On a magnetic viewing film, where do the bright lines appear?', options: ['Over the middle of each north pole', 'Over the middle of each south pole', 'At the boundaries between stripes, where the field runs along the film', 'Nowhere: the film only goes dark'], answer: 2, why: 'The nickel flakes lie flat and shine where the field is parallel to the film, which is between the poles.' },
  ],
  reel: [
    { ms: 5800, caption: 'Slide two fridge magnets back to back and they jump in steps: stripes attracting, then repelling.', set: { turn: 'across', film: true, pitch: 2 }, anim: { pull: [0, 18] }, view: { pos: [0.3, 5.4, 4.6], target: [0.3, 1.6, 0.2] }, spin: 0.25 },
  ],

  build({ stage }) {
    const root = stage.root, Y0 = 0.5;
    const table = box(10.5, 0.5, 7.4, M.matte(0x6b4a2e, { roughness: 0.9 })); table.position.set(0, 0.25, 0); root.add(table);
    // Lower magnet: back (brown, striped) facing up.
    const lc = document.createElement('canvas'); lc.width = 2048; lc.height = 16;
    const lg = lc.getContext('2d'), lowTex = new THREE.CanvasTexture(lc); lowTex.colorSpace = THREE.SRGBColorSpace; lowTex.anisotropy = 4;
    // Stripes where the field model has them: a north stripe centred on the sheet's centre line.
    const drawLow = (pitch) => {
      lg.fillStyle = '#3b2a22'; lg.fillRect(0, 0, lc.width, 16);
      const sx = lc.width / LOW.w;
      for (let k = Math.floor((-LOW.w / 2 + pitch / 2) / pitch) - 1; k * pitch < LOW.w / 2 + pitch; k++) {
        lg.fillStyle = k % 2 === 0 ? 'rgba(224,69,58,.38)' : 'rgba(47,111,214,.38)';
        lg.fillRect((k * pitch - pitch / 2 + LOW.w / 2 + pitch * 0.08) * sx, 0, pitch * 0.84 * sx, 16);
      }
      lowTex.needsUpdate = true;
    };
    drawLow(2);
    const lowMats = [M.matte(HEX.brown), M.matte(HEX.brown), new THREE.MeshStandardMaterial({ map: lowTex, roughness: 0.8 }), M.plastic(0xf2efe6), M.matte(HEX.brown), M.matte(HEX.brown)];
    const low = new THREE.Mesh(new THREE.BoxGeometry(LOW.w * S, TH, LOW.d * S), lowMats); low.castShadow = low.receiveShadow = true;
    low.position.set(0, Y0 + TH / 2, 0); root.add(low);
    // Upper magnet: back down, printed front up. Its own stripes are on its underside.
    const upGroup = new THREE.Group(); root.add(upGroup);
    const upMats = [M.matte(HEX.brown), M.matte(HEX.brown), new THREE.MeshStandardMaterial({ map: souvenirTexture(), roughness: 0.45 }), M.matte(HEX.brown), M.matte(HEX.brown), M.matte(HEX.brown)];
    const up = new THREE.Mesh(new THREE.BoxGeometry(UP.w * S, TH, UP.d * S), upMats); up.castShadow = true; upGroup.add(up);
    // The viewing film: a green card over the left part of the lower magnet.
    const FW = 26, FD = 40;
    const fc = document.createElement('canvas'); fc.width = 1024; fc.height = 64;
    const fg = fc.getContext('2d'), ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
    const film = new THREE.Mesh(new THREE.BoxGeometry(FW * S, 0.03, FD * S), [M.plastic(0x1d4a2a), M.plastic(0x1d4a2a), new THREE.MeshBasicMaterial({ map: ftex, toneMapped: false }), M.plastic(0x1d4a2a), M.plastic(0x1d4a2a), M.plastic(0x1d4a2a)]);
    film.position.set((-LOW.w / 2 + FW / 2 + 3) * S, Y0 + TH + 0.03, 0); root.add(film);
    const drawFilm = (pitch) => {
      const prof = filmProfile(pitch), lam = 2 * pitch, w = fc.width;
      // The film's left edge sits at x = −LOW.w/2 + 3 mm; the sheet's pattern has a north stripe centred on the sheet's centre line.
      for (let px = 0; px < w; px++) {
        const x = -LOW.w / 2 + 3 + (px / w) * FW, u = (((x % lam) + lam) % lam) / lam;
        const v = Math.pow(prof[Math.floor(u * prof.length) % prof.length], 1.6);
        fg.fillStyle = `rgb(${Math.round(28 + 150 * v)},${Math.round(74 + 160 * v)},${Math.round(40 + 110 * v)})`;
        fg.fillRect(px, 0, 1, fc.height);
      }
      ftex.needsUpdate = true;
    };
    // Arrows: the finger's pull, and the magnetic force along the slide.
    const aPull = pointer(HEX.hot, 0.05, 0.26), aMag = pointer(HEX.force, 0.05, 0.26); root.add(aPull, aMag);
    const finger = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), M.glow(HEX.hot)); root.add(finger);
    const lUp = stage.label('Top magnet, back down', [0, 0.7, 0], upGroup);
    const lFilm = stage.label('Viewing film: bright lines between stripes', [0, 0.5, -FD * S / 2 - 0.2], film);
    const lLow = stage.label('Lower magnet, back up: stripes', [LOW.w * S / 2 - 1.6, 0.35, LOW.d * S / 2 + 0.3], low);

    let tab = forceTable(this.defaults.pitch), pitchNow = this.defaults.pitch, x = 0, lift = 0, turnNow = 'across', jumps = 0, lastValley = 0;
    drawFilm(pitchNow);
    const xs = Array.from({ length: 97 }, (_, i) => (i / 96) * 2);
    const b = board(root, 7.0, 3.71, 990, 525, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Force on the top magnet as it slides', 'grams per cm², over two repeats of the pattern');
      const top = Math.max(20, Math.ceil(tab.max / 20) * 20);
      const ax = axes(g, w, h, { xMax: 2 * tab.lam, yMin: -top, yMax: top, xTicks: [0, tab.lam / 2, tab.lam, 1.5 * tab.lam, 2 * tab.lam], yTicks: [-top, -top / 2, 0, top / 2, top], xFmt: (v) => v.toFixed(0), xLabel: 'slide (mm)', yLabel: 'g per cm²' });
      const along = turnNow === 'along';
      plot(g, xs.map((u) => [u * tab.lam, along ? 0 : -tab.normal(u * tab.lam)]), ax.X, ax.Y, COL.south, 4, [9, 7], ax);
      plot(g, xs.map((u) => [u * tab.lam, along ? 0 : tab.shear(u * tab.lam)]), ax.X, ax.Y, COL.force, 6, null, ax);
      text(g, 'sideways', ax.x0 + 12, ax.y1 + 20, COL.force, 'bold 18px sans-serif');
      text(g, 'clamping (dashed), up = together', ax.x0 + 110, ax.y1 + 20, COL.south, '17px sans-serif');
      const xm = ((x % (2 * tab.lam)) + 2 * tab.lam) % (2 * tab.lam);
      dot(g, ax.X(xm), ax.Y(along ? 0 : tab.shear(xm)), COL.force, 11);
    }, [4.2, 4.0, -4.2]);
    b.mesh.rotation.x = -0.5;

    let tall = false, mode = '', lastDraw = 0, st = { x: 0, fm: 0, nrm: 0, jumps: 0, lam: 4, max: 1 };
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const lay = layout(stage);
        if (lay !== mode) {
          mode = lay; tall = lay === 'tall';
          placeBoards(stage, [[b, [0.3, 4.7, -2.6], 0.5, [0, 1.1, 5.0], 0.72]]);
          b.mesh.rotation.x = tall ? -0.1 : mode === 'phone' ? -0.75 : -0.5;
          phoneView(stage, { pos: [0, 10.7, 9], target: [0, 3.6, 1.0] });
        }
        if (s.pitch !== pitchNow) { pitchNow = s.pitch; tab = forceTable(s.pitch); drawFilm(s.pitch); drawLow(s.pitch); }
        turnNow = s.turn;
        const across = s.turn === 'across';
        // Stick-slip. Units: mm and g per cm². The fingertip is a spring of stiffness kf; the magnet is
        // heavily damped. The stripes hold while kf × stretch is less than the peak sideways force.
        const kf = (0.35 * tab.max * 2 * Math.PI) / tab.lam, c = tab.max / 60;       // c: g/cm² per (mm/s)
        const steps = 8, h = Math.min(dt, 0.05) / steps;
        for (let i = 0; i < steps; i++) {
          const F = kf * (s.pull - x) + (across ? tab.shear(x) : 0);
          x += clamp(F / c, -400, 400) * h;
        }
        if (Math.abs(s.pull - x) > tab.lam * 3) x = s.pull;
        const nrm = across ? tab.normal(x) : -tab.max * 0.2;
        lift = approach(lift, across ? clamp(nrm / tab.max, 0, 1) * 0.12 : 0, 14, dt);
        const valley = Math.round(x / tab.lam); if (valley !== lastValley) { jumps += Math.abs(valley - lastValley); lastValley = valley; }
        if (s.pull < 0.05) { jumps = 0; lastValley = 0; }
        // Place things. The top magnet starts over the right half and slides to the left (−x) across the stripes,
        // or towards the viewer (+z) along them.
        const baseX = (LOW.w / 2 - UP.w / 2 - 2) * S;
        upGroup.position.set(baseX - (across ? x * S : 0), Y0 + TH * 1.5 + 0.02 + lift, across ? 0 : (x - 8) * S * 0.5);
        const fx = baseX - (across ? s.pull * S : 0) - (across ? UP.w * S / 2 + 0.35 : 0), fz = across ? 0 : (s.pull - 8) * S * 0.5 + UP.d * S / 2 + 0.35;
        finger.position.set(across ? fx : baseX, upGroup.position.y + 0.05, across ? 0 : fz);
        const stretch = s.pull - x;
        aPull.aim([upGroup.position.x - (across ? UP.w * S / 2 : 0), upGroup.position.y + 0.3, upGroup.position.z + (across ? 0 : UP.d * S / 2)], across ? [-1, 0, 0] : [0, 0, 1], clamp(Math.abs(stretch) * 0.45, 0, 2.2));
        const fm = across ? tab.shear(x) : 0;
        aMag.aim([upGroup.position.x, upGroup.position.y + 0.55, upGroup.position.z], [fm > 0 ? -1 : 1, 0, 0], clamp((Math.abs(fm) / tab.max) * 1.5, 0, 1.5));
        film.visible = s.film; lFilm.visible = s.film && mode === 'wide';
        lLow.visible = mode === 'wide';
        if (time - lastDraw > 0.05 || time < lastDraw) { lastDraw = time; b.redraw(); }
        st = { x, fm, nrm, jumps, lam: tab.lam, max: tab.max };
      },
      readout: (s) => {
        if (s.turn === 'along') return `<div class="big">Smooth glide</div>Sliding along the stripes, nothing changes from one millimetre to the next, so there is nothing to catch on.
          <div class="row"><span>Finger</span><b>${s.pull.toFixed(1)} mm</b></div><div class="row"><span>Magnet</span><b>${st.x.toFixed(1)} mm</b></div>`;
        const state = st.nrm < -0.25 * st.max ? '<b class="ok">locked: unlike stripes face each other</b>' : st.nrm > 0.25 * st.max ? '<b class="no">pushed apart: like stripes face each other</b>' : '<b>on the slope between</b>';
        return compact(stage, `<div class="big">${st.jumps} jump${st.jumps === 1 ? '' : 's'} of ${st.lam.toFixed(0)} mm</div>The sheets are ${state}.
          <div class="row"><span>Finger / magnet</span><b>${s.pull.toFixed(1)} mm / ${st.x.toFixed(1)} mm</b></div>
          <div class="row"><span>Sideways force now</span><b>${Math.abs(st.fm).toFixed(0)} g per cm² ${st.fm > 0.5 ? 'forwards' : st.fm < -0.5 ? 'backwards' : ''}</b></div>
          <div class="row"><span>Peak grip of the stripes</span><b>${st.max.toFixed(0)} g per cm²</b></div>`, 1);
      },
    };
  },
};
