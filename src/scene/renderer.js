import * as THREE from 'three';
import VERT from './particles.vert.glsl?raw';
import FRAG from './particles.frag.glsl?raw';
import { clamp, lerp, hex, rnd } from '../util.js';
import { reduce, MOBILE_AT_LOAD, N, SHAPE_COL, SEC_MODE, SEC_SIDE, WORD0, CRISP, state } from '../state.js';
import { XF } from './transforms.js';
import { nebula } from './shapes/nebula.js';
import { docs } from './shapes/documents.js';
import { helix } from './shapes/helix.js';
import { sheet } from './shapes/sheet.js';
import { pen } from './shapes/pen.js';
import { knot } from './shapes/knot.js';
import { planet } from './shapes/planet.js';
import { name } from './shapes/name.js';
import { hello, hallo, annyeong } from './shapes/words.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;

let renderer, scene, camera, group, geo, mat, SH = [], pGeo, pMat, pGroup, pFix = 0;
// curA/curB/prog/group are read by frame() in main.js
export const gl = { curA: -1, curB: -1, curMode: -1, prog: 0, group: null };

export const initGL = () => {
  try { renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { root.classList.add('no-webgl'); return false; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100); camera.position.set(0, 0, 7);
  group = new THREE.Group(); scene.add(group); gl.group = group;

  const neb = nebula(), PL = planet(MOBILE_AT_LOAD ? 3500 : 7000);
  SH = [
    neb, docs(), helix(), null, sheet(), pen(), knot(),
    name(),
    hello(),
    hallo(),
    annyeong()
  ];
  SH[3] = SH[WORD0];

  geo = new THREE.BufferGeometry();
  const rands = new Float32Array(N); for (let i = 0; i < N; i++) rands[i] = rnd();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('posA', new THREE.BufferAttribute(new Float32Array(neb), 3));
  geo.setAttribute('posB', new THREE.BufferAttribute(new Float32Array(neb), 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uProg: { value: 0 }, uTime: { value: 0 }, uSize: { value: MOBILE_AT_LOAD ? 30 : 26 },
      uPR: { value: renderer.getPixelRatio() }, uSwirl: { value: reduce ? 0 : 1 }, uMode: { value: 0 }, uDelay: { value: 0.3 }, uCalm: { value: 0 }, uCrA: { value: 0 }, uCrB: { value: 0 },
      uTA: { value: new THREE.Vector2() }, uTB: { value: new THREE.Vector2() },
      uColA: { value: new THREE.Vector3(...SHAPE_COL[0]) }, uColB: { value: new THREE.Vector3(...SHAPE_COL[0]) }, uDim: { value: 1 }
    }
  });
  group.add(new THREE.Points(geo, mat));
  const n2 = PL[0].length / 3, r2 = new Float32Array(n2); for (let i = 0; i < n2; i++) r2[i] = rnd();
  pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n2 * 3), 3));
  pGeo.setAttribute('posA', new THREE.BufferAttribute(PL[0], 3));
  pGeo.setAttribute('posB', new THREE.BufferAttribute(PL[1], 3));
  pGeo.setAttribute('aRand', new THREE.BufferAttribute(r2, 1));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  pMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uProg: { value: 0 }, uTime: { value: 0 }, uSize: { value: MOBILE_AT_LOAD ? 28 : 24 }, uPR: { value: renderer.getPixelRatio() },
      uSwirl: { value: reduce ? 0 : 1 }, uMode: { value: 8 }, uDelay: { value: 0.3 }, uCalm: { value: 0.5 }, uCrA: { value: 0 }, uCrB: { value: 0 },
      uTA: { value: new THREE.Vector2(0, 0.38) }, uTB: { value: new THREE.Vector2(0, 0.38) },
      uColA: { value: new THREE.Vector3(...hex('#F0ABFC')) }, uColB: { value: new THREE.Vector3(...hex('#B9A4FF')) }, uDim: { value: 0 }
    }
  });
  pGroup = new THREE.Group(); pGroup.add(new THREE.Points(pGeo, pMat)); pGroup.visible = false; scene.add(pGroup);
  return true;
};

export const setPair = (A, B, mode) => {
  gl.curA = A; gl.curB = B; gl.curMode = mode;
  geo.attributes.posA.array.set(SH[A]); geo.attributes.posA.needsUpdate = true;
  geo.attributes.posB.array.set(SH[B]); geo.attributes.posB.needsUpdate = true;
  mat.uniforms.uColA.value.set(...SHAPE_COL[A]); mat.uniforms.uColB.value.set(...SHAPE_COL[B]);
  mat.uniforms.uCrA.value = CRISP[A]; mat.uniforms.uCrB.value = CRISP[B];
  mat.uniforms.uMode.value = mode; mat.uniforms.uDelay.value = mode === 5 ? 0.06 : 0.3;
};

// GL half of the prototype onResize()
export const resizeGL = () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  mat.uniforms.uPR.value = renderer.getPixelRatio();
  if (pMat) pMat.uniforms.uPR.value = renderer.getPixelRatio();
};

let wordSettled = false, wordStart = 0, baseWord = 0, lastWord = 0;
const shapeOfSec = s => s === 3 ? WORD0 + baseWord : s;
let flash, shock, contactInner;

// GL half of the prototype frame() (the `if (glOK) { ... }` block); returns e
export const update = (t, s, a, b, target, c, heroP, vh, mobile) => {
  if (!flash) { flash = $('#flash').style; shock = $('#shock').style; contactInner = $('.contact .inner').style; }
  const tops = state.tops;
  let mode, p, manual = false, A, B;
  if (s === 0) { A = 0; B = 0; mode = 0; p = 0; }
  else if (s === 3 && target >= 1 && gl.prog > 0.985 && gl.curB >= WORD0 - 5) {
    if (!wordSettled) { wordSettled = true; wordStart = t; }
    const el = t - wordStart, k = Math.floor(el / 3.4), loc = el - k * 3.4, w = (baseWord + k) % 3;
    if (k === 0) { A = WORD0 + w; B = A; p = 1; }
    else { A = WORD0 + (baseWord + k - 1) % 3; B = WORD0 + w; p = clamp(loc / 1.4); }
    lastWord = w; mode = 0; manual = true;
  } else {
    if (wordSettled) { wordSettled = false; baseWord = lastWord; }
    A = shapeOfSec(a); B = shapeOfSec(b); mode = SEC_MODE[b]; p = target;
  }
  if (A !== gl.curA || B !== gl.curB || mode !== gl.curMode) { setPair(A, B, mode); gl.prog = p; }
  else gl.prog = manual ? p : gl.prog + (p - gl.prog) * 0.14;
  const prog = gl.prog, curB = gl.curB, curMode = gl.curMode;
  const e = prog * prog * (3 - 2 * prog);

  const u = mat.uniforms;
  u.uProg.value = prog; u.uTime.value = t;
  u.uCalm.value = curB === 7 ? e : 0;
  const TA = XF[A], TB = XF[B];
  u.uTA.value.set(reduce ? 0 : TA.yaw(t), TA.tilt); u.uTB.value.set(reduce ? 0 : TB.yaw(t), TB.tilt);
  const off = k => mobile ? 0 : SEC_SIDE[k] * 1.75;
  const dim = k => (mobile && k > 0 && k < 6) ? 0.45 : (k === 6 ? 0.62 : 1);
  const ea = s === 0 ? 0 : e;
  if (curMode === 5) {
    const sm = v => v * v * (3 - 2 * v);
    group.position.x = prog < 0.55 ? lerp(off(a), 0, sm(clamp(prog / 0.25))) : lerp(0, off(b), sm(clamp((prog - 0.55) / 0.45)));
  } else group.position.x = lerp(off(a), off(b), ea);
  group.position.y = lerp(TA.y, TB.y, e) * (mobile && (A === 0 || B === 0) ? 1.15 : 1);
  group.scale.setScalar(lerp(TA.sc, TB.sc, e) * (mobile ? 0.82 : 1));
  u.uDim.value = lerp(dim(a), dim(b), ea);
  state.mx += (state.tmx - state.mx) * 0.05; state.my += (state.tmy - state.my) * 0.05;
  group.rotation.y = reduce ? 0 : state.mx * 0.18; group.rotation.x = reduce ? 0 : state.my * 0.12;
  camera.position.z = 7 - heroP * 0.7;
  const nova = curMode === 5 && !reduce;
  flash.opacity = nova ? Math.exp(-Math.pow((prog - 0.26) * 7, 2)).toFixed(3) : 0;
  const su = clamp((prog - 0.24) / 0.4);
  shock.opacity = nova && su > 0 && su < 1 ? ((1 - su) * 0.9).toFixed(3) : 0;
  shock.transform = 'translate(-50%, -50%) scale(' + (0.2 + su * 6).toFixed(3) + ')';
  const shake = nova ? Math.exp(-Math.pow((prog - 0.3) * 9, 2)) * 0.06 : 0;
  camera.position.x = Math.sin(t * 57) * shake; camera.position.y = Math.cos(t * 43) * shake;
  const co = (reduce || s < 7 || curMode !== 5) ? 1 : clamp((prog - 0.62) / 0.3);
  contactInner.setProperty('--co', co.toFixed(3));
  const pv = s < 7 ? 0 : (reduce || curMode !== 5) ? 1 : clamp((prog - 0.55) / 0.25);
  pFix += (clamp((c - tops[7] - vh * 0.95) / (vh * 0.55)) - pFix) * 0.1;
  const pu = pMat.uniforms, pyaw = reduce ? 0 : t * 0.1;
  pu.uProg.value = pFix; pu.uTime.value = t; pu.uDim.value = pv * 0.9;
  pu.uTA.value.x = pyaw; pu.uTB.value.x = pyaw;
  pGroup.visible = pv > 0.001;
  pGroup.position.set(0, mobile ? -0.15 : -0.12, 0); pGroup.scale.setScalar(mobile ? 0.5 : 0.62);
  pGroup.rotation.x = group.rotation.x; pGroup.rotation.y = group.rotation.y;
  renderer.render(scene, camera);
  return e;
};
