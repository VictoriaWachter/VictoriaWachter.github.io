import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import { applyLang, resolveLang, initLangHashListener } from './i18n/index.js';
import { initLangToggle } from './ui/langToggle.js';
import { initPhoto } from './ui/photo.js';
import { createConstellation, peek } from './ui/constellation.js';
import { createNameDust } from './ui/nameDust.js';
import { initQuickJump } from './ui/quickJump.js';
import { clamp, lerp, rnd } from './util.js';
import { reduce, SHAPE_COL, SEC_BG, state } from './state.js';
import { measure, heroProgress, sectionAt } from './scroll.js';
import { initGL, resizeGL, update, gl } from './scene/renderer.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;

/* ---------- translations ---------- */
const lang = resolveLang();
let starBtns = [];
const setLang = l => applyLang(l, { starBtns, measure });
initLangToggle(setLang);

/* ---------- photo ---------- */
initPhoto();

/* ---------- star constellation ---------- */
const getTops = () => state.tops, getHs = () => state.hs;
const sky = createConstellation({ reduce, getTops, getHs });
starBtns = sky.starBtns;

/* ---------- name → dust (top) ---------- */
const { layoutName, drawName } = createNameDust({ reduce, rnd, clamp });

/* ---------- input ---------- */
addEventListener('pointermove', e => { state.tmx = (e.clientX / innerWidth) * 2 - 1; state.tmy = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

const portrait = $('#portrait').style, stage = $('#stage').style;
const mottoLines = [...document.querySelectorAll('#motto span')], mottoSub = $('#mottoSub');
let glOK = false;

const frame = now => {
  const t = now / 1000, vh = innerHeight, y = scrollY, mobile = innerWidth < 760;
  const { tops, hs } = state;

  const heroP = heroProgress(y, vh);
  portrait.setProperty('--po', (1 - clamp((heroP - 0.45) / 0.5)).toFixed(3));
  portrait.setProperty('--ps', (1 + heroP * 0.06).toFixed(3));
  portrait.setProperty('--pb', (Math.max(0, heroP - 0.5) * 16).toFixed(1) + 'px');
  stage.setProperty('--to', clamp(1 - heroP * 3).toFixed(3));
  drawName(heroP, t);

  const { c, s, a, b, target } = sectionAt(y, vh);

  // stars
  sky.update(s, gl.prog, target);

  // motto reveal
  const L = (c - tops[6]) / hs[6];
  mottoLines.forEach((el, k) => el.style.setProperty('--lo', (0.2 + 0.8 * clamp((L - 0.12 - k * 0.1) / 0.12)).toFixed(3)));
  mottoSub.style.setProperty('--lo', (0.2 + 0.8 * clamp((L - 0.45) / 0.12)).toFixed(3));

  let e = 0;
  if (glOK) e = update(t, s, a, b, target, c, heroP, vh, mobile);

  const ca = glOK ? SHAPE_COL[gl.curA] : SHAPE_COL[a], cb = glOK ? SHAPE_COL[gl.curB] : SHAPE_COL[b];
  root.style.setProperty('--glow', [0, 1, 2].map(i => Math.round(lerp(ca[i], cb[i], e) * 255)).join(','));
  const ba = SEC_BG[a], bb = SEC_BG[b], be = s === 0 ? 0 : clamp(target);
  root.style.setProperty('--bg', 'rgb(' + [0, 1, 2].map(i => Math.round(lerp(ba[i], bb[i], be) * 255)).join(',') + ')');
  root.style.setProperty('--gx', (50 + (glOK ? gl.group.position.x : 0) / 5.6 * 50).toFixed(1) + '%');
  root.style.setProperty('--gy', (s === 0 ? 38 : s === 7 ? 32 : 50) + '%');

  requestAnimationFrame(frame);
};

const onResize = () => {
  measure(); layoutName();
  sky.setTrailLen(sky.trail.getTotalLength ? sky.trail.getTotalLength() : 300);
  if (glOK) resizeGL();
};

setLang(lang);
initLangHashListener(setLang);
$('#howto').addEventListener('toggle', () => requestAnimationFrame(measure));
initQuickJump({ reduce, getTops, getHs });
const start = () => {
  glOK = initGL();
  onResize();
  peek(sky.sky);
  addEventListener('resize', onResize);
  requestAnimationFrame(frame);
};
const fontWait = Promise.all([
  document.fonts.load('300 120px "Cormorant Garamond"'),
  document.fonts.load('italic 300 120px "Cormorant Garamond"'),
  document.fonts.load('400 120px "Gowun Batang"', '안녕'),
  document.fonts.load('italic 500 120px "Bodoni Moda"')
]).catch(() => {});
Promise.race([fontWait, new Promise(r => setTimeout(r, 1800))]).then(start);
