import en from './en.js';
import ko from './ko.js';
import de from './de.js';

// Function declaration (hoisted) so en/ko/de can call ph() despite the circular import.
export function ph(s) { return '<span class="ph">' + s + '</span>'; }

export const T = { en, ko, de };

const HASH_LANG = { '#ko': 'ko', '#de': 'de' };

export const resolveLang = () => {
  const h = HASH_LANG[location.hash];
  if (h) { try { localStorage.setItem('vw-lang', h); } catch (e) {} return h; }
  let lang = 'en';
  try { const s = localStorage.getItem('vw-lang'); if (s && T[s]) lang = s; } catch (e) {}
  return lang;
};

export const applyLang = (l, { starBtns, measure }) => {
  const root = document.documentElement;
  root.lang = l;
  document.querySelectorAll('[data-i]').forEach(el => { const v = T[l][el.dataset.i]; if (v != null) el.innerHTML = v; });
  document.querySelectorAll('.langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  starBtns.forEach((b, i) => { b.setAttribute('aria-label', T[l].nav[i]); b.firstChild.textContent = T[l].nav[i]; });
  try { localStorage.setItem('vw-lang', l); } catch (e) {}
  const hash = l === 'en' ? '' : '#' + l;
  if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
  requestAnimationFrame(measure);
};

export const initLangHashListener = apply => {
  addEventListener('hashchange', () => {
    const h = location.hash;
    if (h === '') apply('en');
    else if (HASH_LANG[h]) apply(HASH_LANG[h]);
  });
};
