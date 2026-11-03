import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const planet = (n = N) => {
  const R = 1.45, broken = new Float32Array(n * 3), fixed = new Float32Array(n * 3);
  const hsh = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const rotAx = (p, ax, ang) => {
    const c = Math.cos(ang), s = Math.sin(ang), dd = p[0] * ax[0] + p[1] * ax[1] + p[2] * ax[2];
    return [p[0] * c + (ax[1] * p[2] - ax[2] * p[1]) * s + ax[0] * dd * (1 - c), p[1] * c + (ax[2] * p[0] - ax[0] * p[2]) * s + ax[1] * dd * (1 - c), p[2] * c + (ax[0] * p[1] - ax[1] * p[0]) * s + ax[2] * dd * (1 - c)];
  };
  const tiltRing = p => { const c = Math.cos(0.32), s = Math.sin(0.32); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
  for (let i = 0; i < n; i++) {
    const r = rnd(); let f, b;
    if (r < 0.72) {
      let y = rnd() * 2 - 1; if (rnd() < 0.3) y = clamp(Math.round(y * 9) / 9 + gauss() * 0.01, -1, 1);
      const th = rnd() * 6.2832, rr = Math.sqrt(1 - y * y);
      f = [Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R];
      const sec = Math.floor(th / 6.2832 * 7 * 0.99999), band = Math.floor((y + 1) / 2 * 4 * 0.99999), cell = sec + 7 * band;
      const thc = (sec + 0.5) / 7 * 6.2832, yc = ((band + 0.5) / 4) * 2 - 1, rc = Math.sqrt(1 - yc * yc);
      const cen = [Math.cos(thc) * rc * R, yc * R, Math.sin(thc) * rc * R], cn = nrm(cen);
      const h1 = hsh(cell), h2 = hsh(cell + 50), h3 = hsh(cell + 99);
      const off = h1 < 0.3 ? 0.06 + h1 * 0.3 : 0.35 + h2 * 0.95;
      const loc = rotAx([f[0] - cen[0], f[1] - cen[1], f[2] - cen[2]], nrm([h2 - 0.5, h3 - 0.5, h1 - 0.5]), (h3 - 0.5) * 1.1);
      b = [cen[0] + cn[0] * off + loc[0], cen[1] + cn[1] * off + loc[1] + (h2 - 0.5) * 0.3, cen[2] + cn[2] * off + loc[2]];
    } else if (r < 0.95) {
      const th = rnd() * 6.2832, band = rnd() < 0.62 ? 2.0 + rnd() * 0.24 : 2.33 + rnd() * 0.3, y = gauss() * 0.015;
      f = tiltRing([Math.cos(th) * band, y, Math.sin(th) * band]);
      const arc = Math.floor(th / 6.2832 * 6 * 0.99999) + 40, h1 = hsh(arc), h2 = hsh(arc + 7), h3 = hsh(arc + 13);
      const th2 = th + (h3 - 0.5) * 0.35, band2 = band + (h1 - 0.3) * 0.7;
      b = tiltRing([Math.cos(th2) * band2, y + (h2 - 0.5) * 0.8, Math.sin(th2) * band2]);
    } else {
      const th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1), rad = 3 + rnd() * 2;
      f = [Math.sin(ph) * Math.cos(th) * rad, Math.cos(ph) * rad * 0.6, Math.sin(ph) * Math.sin(th) * rad];
      b = [f[0] * 1.3, f[1] * 1.3, f[2] * 1.3];
    }
    broken[i * 3] = b[0]; broken[i * 3 + 1] = b[1]; broken[i * 3 + 2] = b[2];
    fixed[i * 3] = f[0]; fixed[i * 3 + 1] = f[1]; fixed[i * 3 + 2] = f[2];
  }
  return [broken, fixed];
};
