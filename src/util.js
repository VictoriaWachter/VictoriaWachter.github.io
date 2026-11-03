export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const rnd = () => Math.random();
export const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185 * v); };
export const makeMaker = N => fn => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const p = fn(i); a[i*3] = p[0]; a[i*3+1] = p[1]; a[i*3+2] = p[2]; } return a; };
