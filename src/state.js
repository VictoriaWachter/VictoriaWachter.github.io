import { hex, makeMaker } from './util.js';

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const MOBILE_AT_LOAD = innerWidth < 760;
export const N = MOBILE_AT_LOAD ? 7000 : 15000;
export const make = makeMaker(N);
// shape indices: 0 nebula, 1 docs, 2 helix, 3 (words base marker), 4 sheet, 5 pen, 6 knot, 7 name, 8/9/10 Hello/Hallo/안녕
export const SHAPE_COL = ['#8B5CF6', '#C4B5FD', '#E879F9', '#A5B4FC', '#818CF8', '#F0ABFC', '#A78BFA', '#E9DFFF', '#A5B4FC', '#C4B5FD', '#D8B4FE'].map(hex);
export const SEC_BG = ['#0B0612', '#0D0817', '#130616', '#0A0A1B', '#060A17', '#14061C', '#0B0714', '#08050F'].map(hex);
export const SEC_MODE = [0, 1, 2, 3, 4, 7, 6, 5];
export const WORD0 = 8;

export const secs = [...document.querySelectorAll('main > section')];
export const SEC_SIDE = secs.map(s => s.dataset.side === 'left' ? 1 : s.dataset.side === 'right' ? -1 : 0);

// shared mutable state (prototype closure variables)
export const state = {
  tops: [], hs: [],
  tmx: 0, tmy: 0, mx: 0, my: 0
};
