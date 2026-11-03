import { rnd, gauss, clamp } from '../../util.js';
import { N, make } from '../../state.js';

export const textShape = (lines, font, width, opt = {}) => {
  const scatter = opt.scatter ?? 0.08, depth = opt.depth ?? 0.3;
  const W = 1400, Hh = 300 * lines.length, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font;
  if (opt.stroke) { x.strokeStyle = '#fff'; x.lineWidth = opt.stroke; x.lineJoin = 'round'; }
  lines.forEach((l, k) => { const ly = 150 + k * 260; x.fillText(l, W / 2, ly); if (opt.stroke) x.strokeText(l, W / 2, ly); });
  const dt = x.getImageData(0, 0, W, Hh).data, pts = []; let minX = W, maxX = 0, minY = Hh, maxY = 0;
  for (let yy = 0; yy < Hh; yy += 2) for (let xx = 0; xx < W; xx += 2) if (dt[(yy * W + xx) * 4 + 3] > 128) { pts.push([xx, yy]); if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
  const cxp = (minX + maxX) / 2, cyp = (minY + maxY) / 2, sc = width / Math.max(1, maxX - minX);
  return make(() => {
    if (rnd() < scatter || !pts.length) return [gauss() * width * 0.45, gauss() * 1.0, gauss() * 0.7];
    const p = pts[Math.floor(rnd() * pts.length)];
    return [(p[0] - cxp + rnd() * 2) * sc, -(p[1] - cyp + rnd() * 2) * sc, (rnd() - 0.5) * depth];
  });
};

const serif = '"Cormorant Garamond", Georgia, serif';
export const hello = () => textShape(['Hello'], 'italic 300 230px ' + serif, 3.6);
export const hallo = () => textShape(['Hallo'], 'italic 300 230px ' + serif, 3.6);
export const annyeong = () => textShape(['안녕'], '400 220px "Gowun Batang", serif', 3.0);
