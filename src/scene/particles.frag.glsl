
    uniform vec3 uColA, uColB; uniform float uDim;
    varying float vMix; varying float vA; varying float vBoost; varying float vCr;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float a = pow(1.0 - d * 2.0, mix(1.8, 3.2, vCr));
      vec3 col = mix(uColA, uColB, vMix);
      col = mix(col, vec3(1.0), clamp(a * 0.35 * vA + (vBoost - 1.0) * 0.3, 0.0, 0.85));
      gl_FragColor = vec4(col, a * vA * uDim * min(vBoost, 2.6) * (1.0 + 0.45 * vCr));
    }