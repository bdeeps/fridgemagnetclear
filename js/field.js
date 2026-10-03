// The physics behind FridgeMagnetClear. No drawing here, only fields and forces, so it can be
// checked on its own (node) against textbook formulas and makers' pull tables.
//
// Lengths are in millimetres, fields in tesla, pressures in pascal unless a name says otherwise.
//
// THE SHEET. A flexible magnet is a long strip magnetised in stripes, the same all the way along
// each stripe, so its field is a two-dimensional problem in the cross-section (x along the sheet,
// y through it). We cut the sheet into rectangular blocks, each uniformly magnetised. A uniformly
// magnetised block is exactly equivalent to sheets of bound current on its faces, K = M × n
// (Griffiths, Introduction to Electrodynamics, 4th ed., §6.2; Jackson §5.8). A flat strip of
// current, infinitely long in z, has a closed-form field, so the field of the whole sheet is an
// exact sum over strips: no grid solver, nothing drawn by eye.
//
// THE STEEL DOOR. A flat slab of permeability μr mirrors every current strip with strength
// f = (μr − 1) ÷ (μr + 1) (the method of images: Jackson §5.9, Smythe ch. 7). Mild steel has μr in
// the hundreds or thousands, so f ≈ 1. Austenitic stainless and aluminium have μr ≈ 1, so f ≈ 0.

export const MU0 = 4e-7 * Math.PI;      // T·m/A
export const G0 = 9.80665;              // m/s², standard gravity
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------- materials
// Remanence Br (the magnetisation a magnet keeps, as a field in tesla).
//  · Flexible ferrite sheet, standard (isotropic) grade: Br 0.16–0.19 T, energy product about
//    0.6–0.8 MGOe (makers' datasheets: Adams Magnetic Products, Arnold FlexMag, Magnum Magnetics).
//  · Sintered (ceramic) ferrite, grade Y30 / C8: Br 0.38–0.40 T (IEC 60404-8-1).
//  · Sintered NdFeB grade N35: Br 1.17–1.22 T; N42: 1.28–1.32 T (IEC 60404-8-1; K&J Magnetics, Arnold).
export const BR = { flex: 0.16, ferrite: 0.39, n35: 1.2, n42: 1.3 };
// Relative permeability of what the magnet is stuck to (typical handbook values).
//  · Low-carbon sheet steel: several hundred to a few thousand at these small fields.
//  · Ferritic stainless (AISI 430): about 600–1,100 (maker data: Carpenter, ATI).
//  · Austenitic stainless (AISI 304), annealed: about 1.003–1.02 (ASM Handbook; British Stainless
//    Steel Association). Cold work can raise it, which is why some 304 sinks hold a magnet weakly.
//  · Aluminium: 1.000 022. Glass and plastic: 1 to within a few millionths.
export const DOORS = {
  steel: { name: 'Painted steel', mu: 1000 },
  s430: { name: 'Ferritic stainless (430)', mu: 800 },
  s304: { name: 'Austenitic stainless (304)', mu: 1.008 },
  alu: { name: 'Aluminium', mu: 1.000022 },
  glass: { name: 'Glass or plastic', mu: 1 },
};
export const imageFactor = (mu) => (mu - 1) / (mu + 1);

// A maker's table of straight pull for flexible sheet on bare steel (Adams Magnetic Products,
// "Flexible Magnetic Sheet": 0.012 in → 30 lb/ft², 0.015 → 40, 0.020 → 60, 0.030 → 85, 0.060 → 144).
// 1 lb/ft² = 47.880 Pa.
export const MAKER_PULL = [[0.305, 30], [0.381, 40], [0.508, 60], [0.762, 85], [1.524, 144]].map(([t, p]) => [t, p * 47.880]);
// An ideal sheet with Br = 0.16 T, 2 mm poles and the 4-step rotating pattern would pull about
// twice the maker's figures. A real sheet is magnetised from one side by a multipole fixture, so
// its pattern is not a perfect rotation, and its grains are not all aligned. We scale the ideal
// pull by one number, set so that a 0.76 mm sheet gives the maker's 85 lb/ft² (4.07 kPa). With
// that single number the model reproduces the whole table (model against maker, kPa: 0.30 mm
// 1.47 / 1.44, 0.38 mm 1.93 / 1.92, 0.51 mm 2.69 / 2.87, 0.76 mm 4.07 / 4.07, 1.52 mm 6.61 / 6.89),
// which is good evidence that the usual pole pitch really is close to 2 mm.
export const REAL_SHEET = 0.46;

// ---------------------------------------------------------------- the sheet as blocks
// Patterns, as the direction of magnetisation in each block of one period, in degrees measured
// from "towards the back of the magnet" turning along the sheet.
export const PATTERNS = {
  plain: { name: 'Plain stripes', steps: [0, 180] },
  halbach: { name: 'Rotating, 4 steps', steps: [0, 90, 180, 270] },
  smooth: { name: 'Rotating, 8 steps', steps: [0, 45, 90, 135, 180, 225, 270, 315] },
};
// Build the current strips for a sheet.
//   pitch: pole pitch (N to next S on the strong face), so one period is 2 × pitch.
//   t: thickness. periods: how many periods. cx, cy: centre. back: −1 if the strong face looks
//   towards −y, +1 if towards +y. shift: slide the pattern along x. twist: 0..1 scales the sideways
//   part of the magnetisation (0 turns a rotating pattern into plain up-and-down stripes).
// Strips are { v: true, x, y1, y2, K } or { v: false, y, x1, x2, K } with K in units of M (so the
// field comes out in units of Br).
export function sheetStrips({ pattern = 'halbach', pitch = 2, t = 0.76, periods = 8, cx = 0, cy = 0, back = -1, shift = 0, twist = 1 } = {}) {
  const steps = PATTERNS[pattern].steps, n = steps.length, lam = 2 * pitch, w = lam / n;
  const strips = [], blocks = [];
  const xL = cx - (periods * lam) / 2 + shift, ya = cy - t / 2, yb = cy + t / 2;
  for (let p = 0; p < periods; p++) for (let i = 0; i < n; i++) {
    const a = (steps[i] * Math.PI) / 180;
    // At 0° the magnetisation points out of the strong face (a north pole there). The sideways part
    // turns the way that adds the field on the strong face and cancels it on the other (checked
    // numerically against Mallinson's result: strong side Br(1 − e^(−kt)), weak side zero).
    const my = back * Math.cos(a), mx = -twist * Math.sin(a);
    const xa = xL + (p * n + i) * w - w / 2, xb = xa + w;       // first block is centred on the left end
    blocks.push({ xa, xb, ya, yb, mx, my });
    if (Math.abs(my) > 1e-9) { strips.push({ v: true, x: xb, y1: ya, y2: yb, K: -my }); strips.push({ v: true, x: xa, y1: ya, y2: yb, K: my }); }
    if (Math.abs(mx) > 1e-9) { strips.push({ v: false, y: yb, x1: xa, x2: xb, K: mx }); strips.push({ v: false, y: ya, x1: xa, x2: xb, K: -mx }); }
  }
  return { strips, blocks, lam, t, cx, cy, xL: xL - w / 2 };
}
// Mirror strips in the plane y = ys (the steel's face), each scaled by f.
export function mirrorStrips(strips, ys, f) {
  return strips.map((s) => (s.v ? { v: true, x: s.x, y1: 2 * ys - s.y2, y2: 2 * ys - s.y1, K: s.K * f } : { v: false, y: 2 * ys - s.y, x1: s.x1, x2: s.x2, K: s.K * f }));
}

const nz = (d) => (Math.abs(d) < 1e-9 ? (d < 0 ? -1e-9 : 1e-9) : d);
const Gint = (u, d) => u * Math.log(u * u + d * d) - 2 * u + 2 * d * Math.atan(u / d);   // ∫ ln(u² + d²) du
// Field [Bx, By] at (x, y), in units of Br.
export function stripsB(strips, x, y) {
  let bx = 0, by = 0;
  for (let i = 0; i < strips.length; i++) {
    const s = strips[i];
    if (s.v) {
      const d = nz(x - s.x), u1 = y - s.y1, u2 = y - s.y2;
      bx += s.K * 0.5 * Math.log((d * d + u2 * u2) / (d * d + u1 * u1));
      by += s.K * (Math.atan(u1 / d) - Math.atan(u2 / d));
    } else {
      const d = nz(y - s.y), u1 = x - s.x1, u2 = x - s.x2;
      bx -= s.K * (Math.atan(u1 / d) - Math.atan(u2 / d));
      by += s.K * 0.5 * Math.log((u1 * u1 + d * d) / (u2 * u2 + d * d));
    }
  }
  return [bx / TAU, by / TAU];
}
// The flux function A_z (units Br·mm). Field lines are its contours, and the flux between two
// lines (per mm of depth) is the difference of their A values, so equally spaced contour levels
// give honest line density: twice the lines means twice the field.
export function stripsA(strips, x, y) {
  let a = 0;
  for (let i = 0; i < strips.length; i++) {
    const s = strips[i];
    if (s.v) { const d = nz(x - s.x); a -= s.K * (Gint(y - s.y1, d) - Gint(y - s.y2, d)); }
    else { const d = nz(y - s.y); a -= s.K * (Gint(x - s.x1, d) - Gint(x - s.x2, d)); }
  }
  return a / (2 * TAU);
}

// Root-mean-square and peak of the field's normal part along a line y = const, over the middle
// period of a sheet. Returns { rms, peak, absMean } in units of Br.
export function scanNormal(sheet, y, extra = null, n = 96) {
  const { lam, cx } = sheet;
  let s2 = 0, pk = 0, am = 0, tot = 0;
  for (let i = 0; i < n; i++) {
    const x = cx - lam / 2 + ((i + 0.5) / n) * lam;
    let [bx, by] = stripsB(sheet.strips, x, y);
    if (extra) { const e = stripsB(extra, x, y); bx += e[0]; by += e[1]; }
    s2 += by * by; pk = Math.max(pk, Math.abs(by)); am += Math.abs(by); tot += Math.hypot(bx, by);
  }
  return { rms: Math.sqrt(s2 / n), peak: pk, absMean: am / n, mag: tot / n };
}

// Pull of a sheet on a flat slab a distance `gap` from its strong face, as a pressure in Pa.
// On a slab of infinite permeability the field at the surface is normal and twice the free field
// (source plus image), and the Maxwell stress there is B² ÷ 2μ0. A slab of finite μr gives f times that.
export function sheetPull({ pattern = 'halbach', pitch = 2, t = 0.76, gap = 0, Br = BR.flex, mu = 1000, real = REAL_SHEET, twist = 1 } = {}) {
  const sheet = sheetStrips({ pattern, pitch, t, periods: 10, back: -1, twist });
  const { rms } = scanNormal(sheet, -t / 2 - Math.max(gap, 1e-3));
  const B = 2 * rms * Br;
  return real * imageFactor(mu) * (B * B) / (2 * MU0);
}
// Peak field of the bare sheet (no steel) at distance d from a face. side −1 = strong (back).
export function sheetSurfaceB({ pattern = 'halbach', pitch = 2, t = 0.76, d = 0.1, side = -1, Br = BR.flex, twist = 1 } = {}) {
  const sheet = sheetStrips({ pattern, pitch, t, periods: 10, back: -1, twist });
  const sc = scanNormal(sheet, side * (t / 2 + d));
  return { peak: sc.peak * Br * Math.sqrt(REAL_SHEET), rms: sc.rms * Br * Math.sqrt(REAL_SHEET), mag: sc.mag * Br * Math.sqrt(REAL_SHEET) };
}

// Force between two sheets lying strong face to strong face, `gap` apart, the upper one slid by
// `shift` across the stripes. Returns { shear, normal } in Pa on the upper sheet (normal < 0 means
// it is pulled towards the lower one). Force on a current strip: dF = K ẑ × B dl.
export function twoSheetForce({ pattern = 'halbach', pitch = 2, t = 0.76, gap = 0.1, shift = 0, Br = BR.flex, real = REAL_SHEET } = {}) {
  const lower = sheetStrips({ pattern, pitch, t, periods: 10, cy: -(t + gap) / 2, back: 1 });
  const upper = sheetStrips({ pattern, pitch, t, periods: 1, cy: (t + gap) / 2, back: -1, shift });
  let fx = 0, fy = 0;
  const N = 10;
  for (const s of upper.strips) {
    for (let i = 0; i < N; i++) {
      const k = (i + 0.5) / N;
      const x = s.v ? s.x : s.x1 + (s.x2 - s.x1) * k, y = s.v ? s.y1 + (s.y2 - s.y1) * k : s.y;
      const len = (s.v ? s.y2 - s.y1 : s.x2 - s.x1) / N;
      const [bx, by] = stripsB(lower.strips, x, y);
      fx += -s.K * by * len; fy += s.K * bx * len;
    }
  }
  // K is in units of Br/μ0 and B in units of Br; lengths in mm cancel against the period (mm).
  const k = (real * Br * Br) / MU0 / upper.lam;
  return { shear: fx * k, normal: fy * k };
}

// ---------------------------------------------------------------- disc magnets
// A disc magnetised through its thickness (a pole on each flat face) is two uniformly "charged"
// discs, and the normal field of a uniformly charged disc is σ × (solid angle it fills) ÷ 4π.
// On the axis that gives the textbook result
//   B(z) = (Br ÷ 2) × [ (z + L) ÷ √((z + L)² + R²) − z ÷ √(z² + R²) ]
// (e.g. Camacho and Sosa, Rev. Mex. Fís. E 59 (2013) 8; K&J Magnetics, supermagnete field formulas).
export function discAxisB(Br, R, L, z) {
  return (Br / 2) * ((z + L) / Math.hypot(z + L, R) - z / Math.hypot(z, R));
}
// Solid angle of a disc of radius R seen from a point at height z above its plane, r from the axis.
export function discSolidAngle(R, r, z, n = 160) {
  let s = 0;
  if (r < R * 0.999999) {
    for (let i = 0; i < n; i++) {
      const ph = ((i + 0.5) / n) * Math.PI, c = Math.cos(ph), sn = Math.sin(ph);
      const rho = -r * c + Math.sqrt(R * R - r * r * sn * sn);
      s += 1 - z / Math.hypot(z, rho);
    }
    return (2 * s * Math.PI) / n;
  }
  const pm = Math.asin(Math.min(1, R / r));
  for (let i = 0; i < n; i++) {
    // Gauss–Chebyshev-like spacing packs points near the tangent directions, where the integrand has a square-root edge.
    const th = ((i + 0.5) / n) * Math.PI, ph = pm * Math.cos(th), w = (pm * Math.sin(th) * Math.PI) / n;
    const c = Math.cos(ph), q = Math.sqrt(Math.max(0, R * R - r * r * Math.sin(ph) ** 2));
    s += w * (z / Math.hypot(z, r * c - q) - z / Math.hypot(z, r * c + q));
  }
  return s;
}
// Normal field (T) of the bare disc on a plane `gap` in front of its face, r from the axis.
export function discPlaneB(Br, R, L, gap, r) {
  return (Br / (4 * Math.PI)) * (discSolidAngle(R, r, gap) - discSolidAngle(R, r, gap + L));
}
// Pull (N) of a disc magnet on a thick steel plate, `gap` mm from its face: Maxwell stress with the
// image field, integrated over the plate. Thick means the steel does not saturate; a thin fridge
// door under a strong neodymium disc does, so real pull on a door is lower.
const pullCache = new Map();
export function discPull(Br, R, L, gap, mu = 1000) {
  const key = [Br, R, L, gap.toFixed(4)].join('|');
  let F = pullCache.get(key);
  if (F === undefined) {
    const g = Math.max(gap, 0.02);
    F = 0;
    const ring = (ra, rb, n) => {
      for (let i = 0; i < n; i++) {
        const r = ra + ((i + 0.5) / n) * (rb - ra), dr = (rb - ra) / n;
        const B = 2 * discPlaneB(Br, R, L, g, r);
        F += ((B * B) / (2 * MU0)) * TAU * r * dr * 1e-6;       // mm² → m²
      }
    };
    const e = Math.min(R * 0.5, Math.max(4 * g, 0.3));          // a fine band around the rim, where the field peaks
    ring(0, R - e, 30); ring(R - e, R + e, 80); ring(R + e, R + 4 * (L + g) + 2 * R, 50);
    if (pullCache.size > 400) pullCache.clear();
    pullCache.set(key, F);
  }
  return F * imageFactor(mu);
}
// Far from any small magnet the field is a dipole's: on the axis B = Br·V ÷ (2π d³).
// The surface where |B| equals B0 is r(θ) = r_axis × ((1 + 3cos²θ) ÷ 4)^(1/6).
export const dipoleAxisRange = (Br, volMM3, B0) => Math.cbrt((Br * volMM3) / (TAU * B0));

// ---------------------------------------------------------------- friction
// What the magnet can hold against sliding: friction ≤ μ × (the pull into the door).
// Returns grams-force.
export const gramsForce = (N) => (N / G0) * 1000;
