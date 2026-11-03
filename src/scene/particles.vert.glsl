
    attribute vec3 posA; attribute vec3 posB; attribute float aRand;
    uniform float uProg, uTime, uSize, uPR, uSwirl, uMode, uDelay, uCalm, uCrA, uCrB;
    uniform vec2 uTA, uTB;
    varying float vMix; varying float vA; varying float vBoost; varying float vCr;
    vec3 rY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
    vec3 rX(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, c*p.y-s*p.z, s*p.y+c*p.z); }
    vec3 h3(float r){ return vec3(sin(r*91.3+0.7), cos(r*57.7+1.9), sin(r*33.1+4.1)); }
    void main(){
      vec3 a = rX(rY(posA, uTA.x), uTA.y);
      vec3 b = rX(rY(posB, uTB.x), uTB.y);
      int m = int(uMode + 0.5);
      bool sweep = (m == 4 || m == 7);
      float cellH = fract(sin(dot(floor(posB * 1.3), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float d = sweep ? clamp((b.x + 3.0) / 6.0, 0.0, 1.0) * 0.45 + aRand * 0.05 : (m == 8 ? cellH * 0.55 : aRand * uDelay);
      float span = sweep ? 0.5 : (m == 8 ? 0.45 : 1.0 - uDelay);
      float pp = clamp((uProg - d) / span, 0.0, 1.0);
      float e = pp * pp * (3.0 - 2.0 * pp);
      float k = sin(pp * 3.14159);
      vec3 p = mix(a, b, e); float boost = 1.0;
      if (m == 1) { p *= 1.0 - 0.8 * k; p = rY(p, k * 5.0 * (0.4 + aRand)); boost = 1.0 + 0.5 * k; }
      else if (m == 2) { p.y -= k * (3.5 + aRand * 3.0); p.x += k * (aRand - 0.5) * 1.6; }
      else if (m == 3) { vec3 dir = normalize(mix(a, b, 0.5) + h3(aRand) * 0.9 + vec3(0.001)); p += dir * k * 4.0; }
      else if (m == 4) { float q = floor(pp * 5.0) / 5.0; p = mix(a, b, mix(q, e, 0.2)); vec3 g = floor(p * 3.0 + 0.5) / 3.0; p = mix(p, g, k * 0.85); boost = 1.0 + 0.6 * k; }
      else if (m == 5) {
        vec3 dir = normalize(b + h3(aRand) * 0.7 + vec3(0.001));
        vec3 core = h3(aRand * 3.1) * 0.06;
        vec3 blast = dir * (5.5 + aRand * 5.0);
        if (pp < 0.25) { float t = pp / 0.25; t = t * t; p = mix(a, core, t); boost = 1.0 + 2.2 * t; }
        else if (pp < 0.55) { float t = (pp - 0.25) / 0.3; t = 1.0 - pow(1.0 - t, 3.0); p = mix(core, blast, t); boost = 3.2 - 2.0 * t; }
        else { float t = (pp - 0.55) / 0.45; t = t * t * (3.0 - 2.0 * t); p = mix(blast, b, t); boost = 1.2 - 0.2 * t; }
      }
      else if (m == 6) { p = rY(p, k * p.y * 2.4); p += h3(aRand) * k * 0.25; }
      else if (m == 8) { boost = 1.0 + 1.4 * k; }
      else if (m == 7) { p += vec3(3.0 + aRand * 3.0, 1.6 + aRand * 2.4, (aRand - 0.5) * 2.0) * k; }
      else { p = rY(p, k * 2.4 * (aRand - 0.5)); p += vec3(sin(aRand*41.0+uTime*0.7+p.y*1.7), cos(aRand*29.0+uTime*0.6+p.x*1.3), sin(aRand*17.0+uTime*0.5+p.z*1.5)) * k * 0.8; }
      if (uSwirl < 0.5) { p = mix(a, b, e); boost = 1.0; }
      float cr = max(mix(uCrA, uCrB, pp), uCalm);
      p += vec3(sin(uTime*0.9+aRand*61.0), cos(uTime*0.8+aRand*47.0), sin(uTime*0.7+aRand*73.0)) * 0.025 * uSwirl * (1.0 - 0.9 * cr);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * uPR * (0.55 + aRand * 0.9) * (1.0 - 0.25 * cr) / -mv.z;
      vMix = pp; vBoost = boost; vCr = cr;
      vA = (0.35 + 0.55 * aRand) * (0.8 + 0.2 * sin(uTime * 2.3 + aRand * 90.0));
    }