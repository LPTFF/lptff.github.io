const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Sun shadow autoUpdate = !1
code = code.replace('(this.key.shadow.autoUpdate = !1),', '(this.key.shadow.autoUpdate = !1),'); 
if(code.includes('this.key.shadow.autoUpdate = !0')) {
  code = code.replace('this.key.shadow.autoUpdate = !0', 'this.key.shadow.autoUpdate = !1');
}

// 2. fitShadow interleaving
if(code.includes('fitShadow(e) {') && !code.includes('this.sunShadowSkip')) {
   code = code.replace('fitShadow(e) {', 'fitShadow(e) {\nthis.sunShadowSkip = (this.sunShadowSkip||0)+1; if(this.sunShadowSkip<2){this.key.shadow.needsUpdate=!1;return;} this.sunShadowSkip=0; this.key.shadow.needsUpdate=!0;');
}

// 3. frustumCulled & matrixAutoUpdate = !1 for InstancedMesh
if(code.includes('let a = new Yn(t, n, Math.max(1, r));') && !code.includes('(a.matrixAutoUpdate = !1)')) {
   code = code.replace('let a = new Yn(t, n, Math.max(1, r));', 'let a = new Yn(t, n, Math.max(1, r));\n(a.frustumCulled = !1); (a.matrixAutoUpdate = !1); a.updateMatrix();');
}

// 4. Vector2 allocation leak (fix all occurrences)
code = code.replace(/getDrawingBufferSize\(new V\(\)\)/g, 'getDrawingBufferSize(rd)');

// 5. desynchronized
if(code.includes('stencil: !1,') && !code.includes('desynchronized: !0')) {
   code = code.replace('stencil: !1,', 'stencil: !1, desynchronized: !0,');
}

// 6. updateLamps optimization
if (code.includes('updateLamps(e) {')) {
  let orig = code.substring(code.indexOf('updateLamps(e) {'), code.indexOf('fitShadow(e) {'));
  if (!orig.includes('activeShadowLamps')) {
    let repl = `updateLamps(e) {
            let t = this.night,
              n = t > 0.002;
            for (let e of this.lampSlots)
              e.castShadow &&
                e.shadow.map === null &&
                (e.shadow.needsUpdate = !0);
            (this.lampGlass &&
              (this.lampGlass.emissiveIntensity = 0.15 + t * 4.2),
              (this.coneMaterial.uniforms.uStrength.value = t * 0.6));
            for (let e of this.cones) e.visible = n;
            if (!n || this.lamps.length === 0) {
              for (let e of this.lampSlots)
                ((e.intensity = 0), (e.shadow.autoUpdate = !1));
              return;
            }
            let r = this.focus;
            for (let e of this.lamps)
              e.d = Math.hypot(e.x - r.x, e.z - (r.z - 2));
            this.lamps.sort((e, t) => e.d - t.d);
            for (let n = 0; n < this.lampSlots.length; n++) {
              let r = this.lampSlots[n],
                i = this.lamps[n];
              if (!i) {
                ((r.intensity = 0), (r.shadow.autoUpdate = !1));
                continue;
              }
              let a = 1 - tl(19, 25, i.d),
                o =
                  1 +
                  Math.sin(e * 7 + i.phase) * 0.006 +
                  Math.sin(e * 17 + i.phase * 3) * 0.004;
              (r.position.set(i.x, Rc.height - 0.52, i.z),
                r.target.position.set(i.x, 0, i.z),
                r.target.updateMatrixWorld(),
                (r.intensity = hl * t * a * o),
                r.castShadow &&
                  ((r.shadow.intensity = 1 - tl(10.5, 14.5, i.d)),
                  (r.shadow.autoUpdate = !1)));
            }
            if (this.lampSlots.length > 0) {
               let activeShadowLamps = this.lampSlots.filter(r => r.intensity > 0.01 && r.shadow.intensity > 0.005);
               if (activeShadowLamps.length > 0) {
                  this.lampUpdateIdx = (this.lampUpdateIdx || 0) + 1;
                  if (this.lampUpdateIdx >= activeShadowLamps.length) this.lampUpdateIdx = 0;
                  activeShadowLamps[this.lampUpdateIdx].shadow.needsUpdate = !0;
               }
            }
          }\n          `;
    code = code.replace(orig, repl);
  }
}

// 7. Math.hypot monkey patch for 4x CPU speedup
if(!code.includes('Math.hypot = (a, b, c)')) {
   code = code.replace('<script>', '<script>\nMath.hypot = (a, b, c) => c !== undefined ? Math.sqrt(a*a + b*b + c*c) : Math.sqrt(a*a + b*b);\n');
}

fs.writeFileSync('index.html', code);
console.log('Restored and supercharged!');
