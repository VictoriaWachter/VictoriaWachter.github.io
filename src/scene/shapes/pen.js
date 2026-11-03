import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const pen = () => {
  const A0 = [-2.4, -1.0], A1 = [0, 0.25], A2 = [2.4, -0.15], C0 = [-1.7, 1.15], H1 = [1.15, 0], C3 = [1.75, -1.75];
  const cub = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
  const lin = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const hIn = [A1[0] - H1[0], A1[1] - H1[1]], hOut = [A1[0] + H1[0], A1[1] + H1[1]];
  return make(() => {
    const r = rnd(); let p;
    if (r < 0.55) { const t = rnd(); p = rnd() < 0.5 ? cub(A0, C0, hIn, A1, t) : cub(A1, hOut, C3, A2, t); p = [p[0] + gauss() * 0.018, p[1] + gauss() * 0.018]; }
    else if (r < 0.7) { const k = Math.floor(rnd() * 3), t = rnd(); p = k === 0 ? lin(A0, C0, t) : k === 1 ? lin(hIn, hOut, t) : lin(A2, C3, t); }
    else if (r < 0.86) { const A = [A0, A1, A2][Math.floor(rnd() * 3)], s = 0.11, t = rnd() * 4, e = Math.floor(t), f = t - e; const pts = [[-s, -s], [s, -s], [s, s], [-s, s], [-s, -s]]; const q = lin(pts[e], pts[e + 1], f); p = [A[0] + q[0], A[1] + q[1]]; }
    else if (r < 0.95) { const E = [C0, hIn, hOut, C3][Math.floor(rnd() * 4)], a = rnd() * 6.2832; p = [E[0] + Math.cos(a) * 0.065, E[1] + Math.sin(a) * 0.065]; }
    else { p = [gauss() * 2.4, gauss() * 1.4]; }
    return [p[0], p[1], Math.sin(p[0] * 1.2) * 0.35 + gauss() * 0.03];
  });
};
