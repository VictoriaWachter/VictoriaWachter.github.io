import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const docs = () => make(i => {
  const which = i % 2, r = rnd(); let x, y;
  if (r < 0.24) { const t = rnd() * 4; if (t < 1) { x = (t - 0.5) * 1.6; y = 1.1; } else if (t < 2) { x = 0.8; y = (t - 1.5) * 2.2; } else if (t < 3) { x = (t - 2.5) * 1.6; y = -1.1; } else { x = -0.8; y = (t - 3.5) * 2.2; } }
  else if (r < 0.34) { x = -0.6 + rnd() * 0.85; y = 0.82 + rnd() * 0.1; }
  else if (r < 0.9) { const k = Math.floor(rnd() * 9), end = 0.15 + ((k * 37 + which * 11) % 10) / 22; x = -0.6 + rnd() * (end + 0.6); y = 0.52 - k * 0.17 + gauss() * 0.008; }
  else { const a = rnd() * 6.2832; x = 0.52 + Math.cos(a) * 0.12; y = 0.86 + Math.sin(a) * 0.12; }
  const z = gauss() * 0.012, rot = which ? 0.16 : -0.12, cx = which ? 0.8 : -0.8, cz = which ? -0.4 : 0.4, cy = which ? -0.15 : 0.15;
  const c = Math.cos(rot), s = Math.sin(rot);
  return [(x * c - y * s) * 1.15 + cx, (x * s + y * c) * 1.15 + cy, z + cz];
});
