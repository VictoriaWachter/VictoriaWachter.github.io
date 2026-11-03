const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const createConstellation = ({ reduce, getTops, getHs }) => {
  const SX = [24, 12, 29, 15, 31, 9, 25, 17], GAP = 40;
  const SY = SX.map((_, i) => 12 + i * GAP);
  const H = SY[SY.length - 1] + 12;
  const sky = document.querySelector('#sky');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 40 ' + H); svg.setAttribute('width', '40'); svg.setAttribute('height', H); svg.setAttribute('aria-hidden', 'true');
  const d = SX.map((x, i) => (i ? 'L' : 'M') + x + ' ' + SY[i]).join(' ');
  const ghost = document.createElementNS(ns, 'path'); ghost.setAttribute('d', d); ghost.setAttribute('class', 'ghost'); svg.appendChild(ghost);
  const trail = document.createElementNS(ns, 'path'); trail.setAttribute('d', d); trail.setAttribute('class', 'trail'); svg.appendChild(trail);
  const STAR = 'M0,-7 L1.5,-1.5 L7,0 L1.5,1.5 L0,7 L-1.5,1.5 L-7,0 L-1.5,-1.5Z';
  const stars = SX.map((x, i) => {
    const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'st'); g.setAttribute('transform', 'translate(' + x + ' ' + SY[i] + ')');
    const ring = document.createElementNS(ns, 'circle'); ring.setAttribute('r', '4'); ring.setAttribute('class', 'ring');
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', STAR);
    g.appendChild(ring); g.appendChild(p); svg.appendChild(g); return g;
  });
  sky.appendChild(svg);
  sky.style.height = H + 'px';
  let trailLen = 1;
  const starBtns = SX.map((x, i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.style.left = x + 'px'; b.style.top = SY[i] + 'px';
    const sp = document.createElement('span'); b.appendChild(sp);
    b.addEventListener('click', () => {
      const tops = getTops(), hs = getHs();
      const vh = innerHeight;
      const top = i === 0 ? 0 : tops[i] + hs[i] * 0.4 - vh * 0.55;
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
    sky.appendChild(b); return b;
  });

  let activeStar = -1, novaOn = false;
  const update = (s, prog, target) => {
    if (s !== activeStar) { stars.forEach((g, i) => { g.classList.toggle('on', i === s); g.classList.toggle('seen', i < s); }); starBtns.forEach((bt, i) => bt.classList.toggle('on', i === s)); activeStar = s; }
    const wantNova = s === 7 && prog > 0.22;
    if (wantNova !== novaOn) { stars[6].classList.toggle('nova', wantNova); novaOn = wantNova; }
    const cont = clamp((s + (s === 0 ? 0 : target)) / (stars.length - 1));
    trail.style.strokeDasharray = trailLen; trail.style.strokeDashoffset = (trailLen * (1 - cont)).toFixed(1);
  };

  return { stars, starBtns, trail, sky, getTrailLen: () => trailLen, setTrailLen: v => { trailLen = v; }, update };
};

export const peek = sky => {
  setTimeout(() => { sky.classList.add('peek'); setTimeout(() => sky.classList.remove('peek'), 2600); }, 900);
};
