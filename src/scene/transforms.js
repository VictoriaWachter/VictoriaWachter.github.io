import { MOBILE_AT_LOAD } from '../state.js';

export const osc = (sp, amp, base = 0) => t => base + Math.sin(t * sp) * amp;
export const XF = [
  { yaw: t => t * 0.05, tilt: 1.15, y: 0.95, sc: 1 },
  { yaw: osc(0.4, 0.35), tilt: 0.06, y: 0, sc: 1 },
  { yaw: t => t * 0.35, tilt: 0.1, y: 0, sc: 1 },
  { yaw: osc(0.5, 0.25), tilt: 0, y: 0, sc: 1 },
  { yaw: osc(0.3, 0.45, 0.35), tilt: 0.55, y: -0.1, sc: 1 },
  { yaw: osc(0.35, 0.3), tilt: 0.05, y: 0, sc: 1 },
  { yaw: t => t * 0.12, tilt: 0.5, y: 0, sc: 1 },
  { yaw: osc(0.3, 0.06), tilt: 0, y: MOBILE_AT_LOAD ? 1.9 : 1.65, sc: 1 },
  { yaw: osc(0.5, 0.25), tilt: 0, y: 0, sc: 1 },
  { yaw: osc(0.5, 0.25), tilt: 0, y: 0, sc: 1 },
  { yaw: osc(0.5, 0.25), tilt: 0, y: 0, sc: 1 }
];
