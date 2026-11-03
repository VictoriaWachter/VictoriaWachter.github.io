import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const helix = () => make(() => {
  const y = (rnd() - 0.5) * 5.0, r = rnd(); let p;
  if (r < 0.7) { const a = y * 1.5 + (rnd() < 0.5 ? 0 : Math.PI); p = [Math.cos(a) * 0.9 + gauss() * 0.04, y + gauss() * 0.04, Math.sin(a) * 0.9 + gauss() * 0.04]; }
  else { const yy = Math.round(y / 0.3) * 0.3, a = yy * 1.5, t = rnd() * 2 - 1; p = [Math.cos(a) * 0.9 * t, yy + gauss() * 0.015, Math.sin(a) * 0.9 * t]; }
  const c = Math.cos(0.38), s = Math.sin(0.38); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
});
