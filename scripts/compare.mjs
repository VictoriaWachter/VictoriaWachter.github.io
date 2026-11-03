// Parity harness: prototype (victoria-preview.html) vs Vite app.
// Usage: node scripts/compare.mjs [--self] [--target dev|preview] [--threshold 0.5] [--quick] [--og]
//   --self      prototype vs prototype (two separate browser runs) to calibrate
//   --target    'dev' (default, spawns `vite`) or 'preview' (spawns `vite preview`, needs a prior build)
//   --threshold pixel-diff % per checkpoint; default max(0.1, 2 x calibrated self-diff max)
//   --quick     only 1440/en (fast iteration)
//   --og        only write public/og-image.png (1200x630 app hero)
// Fonts and the three CDN script are cached in scripts/.font-cache/ (gitignore it).
//
// Buffer capture: hooks WebGL(2)RenderingContext.prototype.bufferData and records every
// Float32Array upload (length + FNV-1a of bytes) in call order into window.__bufs. This works the
// same for the CDN global THREE (prototype) and the bundled ES module (app, dev or preview) with no
// module rewriting, so it is the parity gate. The prototype additionally gets a setAttribute hook
// via a window.THREE setter purely for naming in the report.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.font-cache');
const OUT = path.join(ROOT, 'test-results', 'compare');
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const SELF = flag('--self'), QUICK = flag('--quick'), OG = flag('--og');
const TARGET = opt('--target', 'dev');
const USER_THRESHOLD = opt('--threshold', null);
const CALIB = path.join(OUT, 'calibration.json');
const VIEWPORTS = QUICK ? [{ width: 1440, height: 900 }] : [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const LANGS = QUICK ? ['en'] : ['en', 'ko', 'de'];
const GPU_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
fs.mkdirSync(CACHE, { recursive: true });

/* ---------- servers ---------- */
function protoServer() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = p === '/' ? path.join(ROOT, 'victoria-preview.html') : path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}
async function appServer() {
  const port = TARGET === 'preview' ? 4173 : 5173;
  const cmd = TARGET === 'preview' ? ['vite', 'preview', '--port', port, '--strictPort', '--host', '127.0.0.1'] : ['vite', '--port', port, '--strictPort', '--host', '127.0.0.1'];
  const child = spawn('npx ' + cmd.join(' '), { cwd: ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(url); if (r.ok) return { url, close: () => killTree(child) }; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  killTree(child); throw new Error('vite server did not start:\n' + log);
}
function killTree(child) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

/* ---------- external asset cache (fonts + three CDN) ---------- */
const keyOf = u => u.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
async function cached(url) {
  const f = path.join(CACHE, keyOf(url)), m = f + '.type';
  if (fs.existsSync(f)) return { body: fs.readFileSync(f), type: fs.readFileSync(m, 'utf8') };
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' } });
  if (!r.ok) throw new Error('fetch ' + url + ' ' + r.status);
  const body = Buffer.from(await r.arrayBuffer()), type = r.headers.get('content-type') || 'application/octet-stream';
  fs.writeFileSync(f, body); fs.writeFileSync(m, type);
  return { body, type };
}
async function routeExternal(page) {
  await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\//, async route => {
    try { const { body, type } = await cached(route.request().url()); await route.fulfill({ status: 200, body, headers: { 'content-type': type, 'access-control-allow-origin': '*' } }); }
    catch (e) { await route.abort(); }
  });
}

/* ---------- init script (runs before any page script) ---------- */
const INIT = ({ lang, proto }) => {
  let a = 12345;
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const fnv = u8 => { let h = 0x811c9dc5; for (let i = 0; i < u8.length; i++) { h ^= u8[i]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
  window.__bufs = []; window.__attrs = []; window.__errors = [];
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    const orig = C.prototype.bufferData;
    C.prototype.bufferData = function (target, data, ...rest) {
      if (data instanceof Float32Array) window.__bufs.push({ len: data.length, sum: fnv(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)) });
      return orig.call(this, target, data, ...rest);
    };
  }
  if (proto) {
    try { if (lang) localStorage.setItem('vw-lang', lang); else localStorage.removeItem('vw-lang'); } catch (e) {}
    // three.min.js (UMD) assigns an empty object to window.THREE and fills it afterwards,
    // so patch lazily on the first read once BufferGeometry exists.
    let T, done = false;
    Object.defineProperty(window, 'THREE', {
      configurable: true,
      set(v) { T = v; },
      get() {
        if (!done && T && T.BufferGeometry) {
          done = true;
          const o = T.BufferGeometry.prototype.setAttribute;
          T.BufferGeometry.prototype.setAttribute = function (name, attr) {
            if (attr && attr.array instanceof Float32Array) window.__attrs.push({ name, count: attr.count, sum: fnv(new Uint8Array(attr.array.buffer, attr.array.byteOffset, attr.array.byteLength)) });
            return o.call(this, name, attr);
          };
        }
        return T;
      }
    });
  }
};

/* ---------- checkpoints ---------- */
// geometry measured in-page with the prototype formula: c = y + vh*0.55
async function geometry(page) {
  return page.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section')];
    return { tops: secs.map(s => s.getBoundingClientRect().top + scrollY), hs: secs.map(s => s.offsetHeight), vh: innerHeight, sh: document.documentElement.scrollHeight };
  });
}
function plan(g) {
  const { tops, hs, vh, sh } = g, max = sh - vh, cl = y => Math.max(0, Math.min(max, Math.round(y)));
  const ySec = (s, t) => cl(tops[s] + t * (s === 7 ? vh * 0.95 : hs[s] * 0.32) - vh * 0.55);
  const down = [];
  for (const p of [0, 0.5, 1]) down.push({ name: `hero-${p * 100}`, y: cl(p * Math.max(1, hs[0] - vh)) });
  for (let s = 1; s <= 7; s++) for (const t of [0.5, 1]) {
    down.push({ name: `s${s}-t${t}`, y: ySec(s, t) });
    if (s === 3 && t === 1) down.push({ name: 's3-word', y: ySec(3, 1), word: true });
  }
  // supernova prog follows target in section 7 (prog eases toward target)
  down.push({ name: 's7-nova-0.26', y: ySec(7, 0.26) }, { name: 's7-nova-0.6', y: ySec(7, 0.6) });
  // planet pFix = clamp((c - tops7 - vh*0.95)/(vh*0.55))
  down.push({ name: 'planet-0', y: cl(tops[7] + vh * 0.95 - vh * 0.55) }, { name: 'planet-1', y: cl(tops[7] + vh * 1.5 - vh * 0.55) }, { name: 'contact', y: max });
  const up = down.slice(0, -1).reverse().filter(c => !c.word).map(c => ({ ...c, name: 'up-' + c.name }));
  return [...down, ...up];
}

/* ---------- one run ---------- */
async function run({ url, proto, viewport, lang, outDir, tag, browserArgs = GPU_ARGS, reducedMotion, checkpoints = true, shots = {} }) {
  const browser = await chromium.launch({ args: browserArgs });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await routeExternal(page);
  await page.addInitScript(INIT, { lang, proto });
  // install() alone lets time keep flowing in real time; pause so only runFor() advances it.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(url + (!proto && lang ? '#' + lang : ''), { waitUntil: 'load' });
  // Resolve the page's font race at fake t=0 (same loads the prototype awaits) so start() never
  // depends on real I/O timing relative to the frozen clock.
  await page.evaluate(() => Promise.all([
    document.fonts.load('300 120px "Cormorant Garamond"'), document.fonts.load('italic 300 120px "Cormorant Garamond"'),
    document.fonts.load('400 120px "Gowun Batang"', '안녕'), document.fonts.load('italic 500 120px "Bodoni Moda"')
  ]).catch(() => {}).then(() => document.fonts.ready));
  await page.clock.runFor(2000);
  const result = { errors, shots: [], bufs: null, attrs: null, masks: [] };
  result.masks = await page.evaluate(sels => sels.flatMap(sel => [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return { sel, x: r.left, y: r.top, w: r.width, h: r.height, fixed: (() => { for (let n = e; n; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true; return false; })() }; })).filter(r => r.w > 0 && r.h > 0), proto ? ['.badge', '#photoPh .upload', '#changePhoto', '#portrait'] : ['#portrait']);
  result.noWebgl = await page.evaluate(() => document.documentElement.classList.contains('no-webgl'));
  result.scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (shots.hero) { await page.screenshot({ path: shots.hero }); }
  if (checkpoints) {
    const g = await geometry(page);
    result.geometry = g;
    fs.mkdirSync(outDir, { recursive: true });
    for (const cp of plan(g)) {
      await page.evaluate(y => window.scrollTo(0, y), cp.y);
      await page.clock.runFor(1500);
      if (cp.word) { await page.clock.runFor(3400); await page.clock.runFor(3400); }
      const sy = await page.evaluate(() => scrollY);
      const file = path.join(outDir, `${cp.name}-${tag}.png`);
      await page.screenshot({ path: file });
      result.shots.push({ name: cp.name, y: cp.y, scrollY: sy, file });
    }
    result.overflow = await page.evaluate(() => [...document.querySelectorAll('.card, [class*="card"]')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 0.5 || r.left < -0.5; }).length);
  }
  result.bufs = await page.evaluate(() => window.__bufs);
  result.attrs = await page.evaluate(() => window.__attrs);
  await browser.close();
  return result;
}

/* ---------- diff ---------- */
function paint(png, masks, scrollY) {
  for (const m of masks) {
    const y0 = m.fixed ? m.y : m.y - scrollY;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(png.height, Math.ceil(y0 + m.h)); y++)
      for (let x = Math.max(0, Math.floor(m.x)); x < Math.min(png.width, Math.ceil(m.x + m.w)); x++) { const i = (y * png.width + x) * 4; png.data[i] = 255; png.data[i + 1] = 0; png.data[i + 2] = 255; png.data[i + 3] = 255; }
  }
}
function diff(fa, fb, fd, masks, scrollY) {
  const a = PNG.sync.read(fs.readFileSync(fa)), b = PNG.sync.read(fs.readFileSync(fb));
  if (a.width !== b.width || a.height !== b.height) return 100;
  paint(a, masks, scrollY); paint(b, masks, scrollY);
  const d = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.1 });
  fs.writeFileSync(fd, PNG.sync.write(d));
  return n / (a.width * a.height) * 100;
}
function bufCompare(A, B) {
  const n = Math.max(A.length, B.length);
  for (let i = 0; i < n; i++) if (!A[i] || !B[i] || A[i].len !== B[i].len || A[i].sum !== B[i].sum) return { ok: false, index: i, a: A[i] || null, b: B[i] || null, countA: A.length, countB: B.length };
  return { ok: true, count: n };
}

/* ---------- main ---------- */
const ps = await protoServer();
let as = null;
const summary = { mode: SELF ? 'self' : 'compare', target: TARGET, groups: [], buffers: [], extras: {}, errors: {} };
let fail = false;
try {
  if (OG) {
    as = await appServer();
    const f = path.join(ROOT, 'public', 'og-image.png');
    const r = await run({ url: as.url, proto: false, viewport: { width: 1200, height: 630 }, lang: null, checkpoints: false, shots: { hero: f } });
    console.log('wrote', f, 'errors:', r.errors);
    process.exitCode = r.errors.length ? 1 : 0;
  } else {
    if (!SELF) as = await appServer();
    const bUrl = SELF ? ps.url : as.url;
    const selfMax = fs.existsSync(CALIB) ? JSON.parse(fs.readFileSync(CALIB, 'utf8')).max : 0;
    const threshold = USER_THRESHOLD != null ? +USER_THRESHOLD : SELF ? Infinity : Math.max(0.1, 2 * selfMax);
    let maxDiff = 0;
    const rows = [];
    for (const vp of VIEWPORTS) for (const lang of LANGS) {
      const vpk = `${vp.width}x${vp.height}`, dir = path.join(OUT, vpk, lang);
      const A = await run({ url: ps.url, proto: true, viewport: vp, lang, outDir: dir, tag: 'proto' });
      const B = await run({ url: bUrl, proto: SELF, viewport: vp, lang, outDir: dir, tag: SELF ? 'proto2' : 'app' });
      const bc = bufCompare(A.bufs, B.bufs);
      summary.buffers.push({ vp: vpk, lang, ...bc, protoAttrs: A.attrs.map(x => `${x.name}:${x.count}:${x.sum}`) });
      if (!bc.ok) fail = true;
      summary.errors[`${vpk}/${lang}`] = { proto: A.errors, other: B.errors };
      if (B.errors.length) fail = true;
      if (!SELF && vp.width === 390) {
        const mob = { scrollWidth: B.scrollWidth, scrollOk: B.scrollWidth <= 390, overflowCards: B.overflow, n7000: A.attrs.some(x => x.count === 7000), planet3500: A.attrs.some(x => x.count === 3500), parity: bc.ok };
        summary.extras[`mobile-${lang}`] = mob;
        if (!mob.scrollOk || mob.overflowCards || !mob.parity) fail = true;
      }
      for (let i = 0; i < A.shots.length; i++) {
        const sa = A.shots[i], sb = B.shots[i];
        const name = sa.name, fd = path.join(dir, `${name}-diff.png`);
        const pct = sb ? diff(sa.file, sb.file, fd, [...A.masks, ...B.masks], sa.scrollY) : 100;
        maxDiff = Math.max(maxDiff, pct);
        const pass = pct <= threshold && (!sb || sa.scrollY === sb.scrollY);
        if (!pass) fail = true;
        rows.push({ vp: vpk, lang, cp: name, y: sa.scrollY, yB: sb && sb.scrollY, diff: +pct.toFixed(4), pass });
      }
    }
    summary.groups = rows; summary.threshold = threshold; summary.maxDiff = maxDiff;
    if (SELF) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(CALIB, JSON.stringify({ max: maxDiff, at: new Date().toISOString() })); }

    if (!SELF) {
      const vp = { width: 1440, height: 900 };
      const rm = await run({ url: as.url, proto: false, viewport: vp, lang: null, outDir: path.join(OUT, 'reduced'), tag: 'app', reducedMotion: 'reduce' });
      const rmP = await run({ url: ps.url, proto: true, viewport: vp, lang: null, outDir: path.join(OUT, 'reduced'), tag: 'proto', reducedMotion: 'reduce' });
      const rmDiffs = rm.shots.map((s, i) => diff(rmP.shots[i].file, s.file, path.join(OUT, 'reduced', s.name + '-diff.png'), [...rmP.masks, ...rm.masks], rmP.shots[i].scrollY));
      summary.extras.reducedMotion = { errors: rm.errors, maxDiff: Math.max(...rmDiffs), pass: !rm.errors.length && Math.max(...rmDiffs) <= threshold };
      const nw = await run({ url: as.url, proto: false, viewport: vp, lang: null, outDir: path.join(OUT, 'nowebgl'), tag: 'app', browserArgs: ['--disable-webgl', '--disable-webgl2'] });
      summary.extras.noWebgl = { hasClass: nw.noWebgl, errors: nw.errors, pass: nw.noWebgl && !nw.errors.length };
      if (!summary.extras.reducedMotion.pass || !summary.extras.noWebgl.pass) fail = true;
    }

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, SELF ? 'summary-self.json' : 'summary.json'), JSON.stringify(summary, null, 2));
    console.table(rows.map(r => ({ ...r, pass: r.pass ? 'PASS' : 'FAIL' })));
    console.log('buffers:', summary.buffers.map(b => `${b.vp}/${b.lang}: ${b.ok ? 'OK (' + b.count + ')' : 'MISMATCH @' + b.index}`).join(' | '));
    console.log('extras:', JSON.stringify(summary.extras));
    console.log('errors:', JSON.stringify(summary.errors));
    console.log(`maxDiff ${maxDiff.toFixed(4)}%  threshold ${threshold}%  => ${fail ? 'FAIL' : 'PASS'}`);
    process.exitCode = fail ? 1 : 0;
  }
} finally { ps.close(); if (as) as.close(); }
