import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const sheet = () => {
  const C = 10, R = 7, cs = 0.42, data = [0.5, 0.9, 0.75, 1.3, 1.1, 1.7, 1.45, 2.0, 1.8, 2.3];
  return make(() => {
    const r = rnd(); let x, y, z;
    if (r < 0.32) {
      if (rnd() < 0.55) { const k = Math.floor(rnd() * (C + 1)); x = (k - C / 2) * cs; z = (rnd() - 0.5) * R * cs; }
      else { const k = Math.floor(rnd() * (R + 1)); z = (k - R / 2) * cs; x = (rnd() - 0.5) * C * cs; }
      y = 0;
    } else {
      const c = Math.floor(rnd() * C), row = c % 2 ? 2 : 4, h = data[c], hw = cs * 0.34;
      const bx = (c - C / 2 + 0.5) * cs, bz = (row - R / 2 + 0.5) * cs;
      if (rnd() < 0.88) {
        const e = Math.floor(rnd() * 12), t = rnd();
        const sx = e % 2 ? 1 : -1, sz = (e >> 1) % 2 ? 1 : -1;
        if (e < 4) { x = bx + sx * hw; z = bz + sz * hw; y = t * h; }
        else if (e < 8) { x = bx + (t * 2 - 1) * hw; z = bz + sz * hw; y = sx > 0 ? h : 0; }
        else { x = bx + sx * hw; z = bz + (t * 2 - 1) * hw; y = sz > 0 ? h : 0; }
      } else { x = bx + (rnd() * 2 - 1) * hw; z = bz + (rnd() * 2 - 1) * hw; y = h; }
    }
    return [x, y - 1.0, z];
  });
};
