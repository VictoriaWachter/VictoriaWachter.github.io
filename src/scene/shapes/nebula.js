import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const nebula = () => make(i => {
  if (rnd() < 0.2) { const r = 1.3 + Math.pow(rnd(), 0.8) * 4.3, th = rnd() * 6.2832; return [Math.cos(th) * r, gauss() * 0.35, Math.sin(th) * r]; }
  const arm = i % 3, r = 1.2 + Math.pow(rnd(), 0.75) * 3.1, a = arm * 2.0944 + r * 1.25 + gauss() * 0.2;
  return [Math.cos(a) * r + gauss() * 0.1, gauss() * 0.09 * (2.6 / r + 0.4), Math.sin(a) * r + gauss() * 0.1];
});
