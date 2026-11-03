export const createNameDust = ({ reduce, rnd, clamp }) => {
  const nc = document.querySelector('#nameCanvas'), nx = nc.getContext('2d');
  let nOff = null, parts = [], nMin = 0, nMax = 1, nDpr = 1, lastP = -1;
  const layoutName = () => {
    nDpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, Hh = innerHeight, mobile = W < 760;
    nc.width = Math.round(W * nDpr); nc.height = Math.round(Hh * nDpr);
    const size = mobile ? Math.min(W * 0.19, 92) : Math.min(W * 0.105, 168);
    const lines = mobile ? ['Victoria', 'Wachter'] : ['Victoria Wachter'];
    const cy = Hh * (mobile ? 0.66 : 0.68);
    nOff = document.createElement('canvas'); nOff.width = nc.width; nOff.height = nc.height;
    const o = nOff.getContext('2d'); o.scale(nDpr, nDpr);
    o.fillStyle = '#ffffff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = '300 ' + size + 'px "Cormorant Garamond", Georgia, serif';
    o.shadowColor = 'rgba(196,181,253,0.55)'; o.shadowBlur = 26;
    lines.forEach((l, k) => o.fillText(l, W / 2, cy + (k - (lines.length - 1) / 2) * size * 0.95));
    const dt = o.getImageData(0, 0, nOff.width, nOff.height).data, step = Math.max(2, Math.round((mobile ? 2 : 2.4) * nDpr));
    parts = []; nMin = Infinity; nMax = -Infinity;
    for (let y = 0; y < nOff.height; y += step) for (let x = 0; x < nOff.width; x += step)
      if (dt[(y * nOff.width + x) * 4 + 3] > 150) { parts.push({ x, y }); if (x < nMin) nMin = x; if (x > nMax) nMax = x; }
    const span = Math.max(1, nMax - nMin);
    parts.forEach(p => { p.start = ((p.x - nMin) / span) * 0.55 + rnd() * 0.1; p.vx = (40 + rnd() * 220) * nDpr; p.vy = -(40 + rnd() * 200) * nDpr; p.w = rnd() * 6.28; p.s = (1 + rnd() * 0.9) * nDpr; });
    lastP = -1;
  };
  const drawName = (p, t) => {
    if (!nOff) return;
    if (p === lastP && (p <= 0 || p >= 1)) return;
    lastP = p;
    nx.setTransform(1, 0, 0, 1, 0, 0); nx.clearRect(0, 0, nc.width, nc.height);
    if (p >= 0.999) return;
    if (reduce) { nx.globalAlpha = clamp(1 - p * 1.6); nx.drawImage(nOff, 0, 0); nx.globalAlpha = 1; return; }
    const eraseX = nMin + (nMax - nMin) * (p * 1.25 / 0.55);
    nx.drawImage(nOff, 0, 0);
    if (p > 0) {
      nx.globalCompositeOperation = 'destination-out';
      const g = nx.createLinearGradient(eraseX - 40 * nDpr, 0, eraseX + 24 * nDpr, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      nx.fillStyle = g; nx.fillRect(0, 0, nc.width, nc.height);
      nx.globalCompositeOperation = 'source-over'; nx.fillStyle = '#F4EEFF';
      const lim = eraseX + 24 * nDpr;
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i]; if (q.x > lim) continue;
        const l = clamp((p * 1.25 - q.start) / 0.45); if (l >= 1) continue;
        const e = l * l;
        nx.globalAlpha = Math.pow(1 - l, 1.3);
        const s = q.s * (1 - l * 0.35);
        nx.fillRect(q.x + q.vx * e + Math.sin(t * 1.6 + q.w) * 7 * nDpr * l, q.y + q.vy * e + Math.cos(t * 1.3 + q.w) * 5 * nDpr * l, s, s);
      }
      nx.globalAlpha = 1;
    }
  };

  return { layoutName, drawName };
};
