import { clamp } from './util.js';
import { secs, state } from './state.js';

export const measure = () => { state.tops = secs.map(s => s.getBoundingClientRect().top + scrollY); state.hs = secs.map(s => s.offsetHeight); };

export const heroProgress = (y, vh) => clamp(y / Math.max(1, state.hs[0] - vh));

// returns { c, s, a, b, target } exactly as computed in the prototype frame()
export const sectionAt = (y, vh) => {
  const { tops, hs } = state;
  const c = y + vh * 0.55;
  let s = 0; for (let k = 0; k < tops.length; k++) if (tops[k] <= c) s = k;
  const a = Math.max(0, s - 1), b = s;
  const target = s === 0 ? 0 : clamp((c - tops[s]) / (s === 7 ? vh * 0.95 : hs[s] * 0.32));
  return { c, s, a, b, target };
};
