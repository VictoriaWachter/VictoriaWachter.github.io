import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const knot = () => {
  const tk = t => { const r = Math.cos(3 * t) + 2.3; return [r * Math.cos(2 * t) * 0.68, r * Math.sin(2 * t) * 0.68, -Math.sin(3 * t) * 0.68]; };
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  return make(i => {
    const t = rnd() * 6.2832, j = (i % 5) - 2, p = tk(t), q = tk(t + 0.002);
    const Tn = nrm([q[0] - p[0], q[1] - p[1], q[2] - p[2]]), R = nrm(p);
    const B = nrm([Tn[1] * R[2] - Tn[2] * R[1], Tn[2] * R[0] - Tn[0] * R[2], Tn[0] * R[1] - Tn[1] * R[0]]), o = j * 0.085;
    return [p[0] + B[0] * o + gauss() * 0.01, p[1] + B[1] * o + gauss() * 0.01, p[2] + B[2] * o + gauss() * 0.01];
  });
};
