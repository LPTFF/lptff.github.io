// Run with: node public/sundown-showdown/verify-performance.cjs
// CPU-side regression checks for the embedded particle pool; browser validation
// is still required for shaders, transparency, input and actual frame times.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

class Attribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
    this.version = 0;
    this.updateRanges = [];
  }
  setUsage() { return this; }
  set needsUpdate(value) { if (value) this.version++; }
  clearUpdateRanges() { this.updateRanges.length = 0; }
  addUpdateRange(start, count) { this.updateRanges.push({ start, count }); }
}
class Geometry {
  constructor() { this.attributes = {}; }
  setAttribute(name, value) { this.attributes[name] = value; }
  setIndex(value) { this.index = value; }
  setDrawRange(start, count) { this.drawRange = { start, count }; }
}
const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
const start = html.indexOf('ju = class {') + 'ju = '.length;
const end = html.indexOf('\n      function Mu()', start);
assert(start > 0 && end > start, 'Particle class must be found');
const source = html.slice(start, end).trim().replace(/;$/, '');
const ParticlePool = vm.runInNewContext(`(${source})`, {
  pn: Geometry, Zt: Attribute, N: 0, ku: '', Au: '',
  jr: class { constructor(options) { Object.assign(this, options); } },
  ar: class { constructor(geometry, material) { Object.assign(this, { geometry, material }); } },
});
const pool = new ParticlePool({ add() {} }, 65, false);
function emit(life = 1) {
  pool.emit(0, 1, 0, 2, 0, 0, life, 1, 1, 1, 1, 1, 1, 0, 0);
}
function checkOrder() {
  const expected = Array.from(pool.life, (life, index) => life > 0 ? index : -1).filter(i => i >= 0);
  assert.deepEqual(Array.from(pool.drawIndices.slice(0, pool.points.geometry.drawRange.count)), expected);
}
pool.update(1 / 60);
assert.equal(pool.points.geometry.drawRange.count, 0);
assert.equal(pool.points.geometry.attributes.position.version, 0, 'Idle pools must not upload');
emit();
pool.update(0.25);
assert.equal(pool.pos[0], 0.5, 'Particle motion is unchanged');
assert.equal(pool.life[0], 0.75);
checkOrder();
for (let frame = 0; frame < 300; frame++) {
  // Cross sign-bit / word boundaries (31, 32, 63, 64) and wrap the ring.
  for (let n = 0; n < frame % 17; n++) emit(0.01 + (frame % 11) / 20);
  pool.update(1 / 60);
  checkOrder();
}
pool.update(2);
checkOrder();
assert.equal(pool.points.geometry.drawRange.count, 0);
const version = pool.points.geometry.attributes.position.version;
pool.update(1 / 60);
assert.equal(pool.points.geometry.attributes.position.version, version);
emit();
pool.update(1 / 60);
checkOrder();
assert.equal(pool.points.geometry.drawRange.count, 1, 'An exhausted pool can emit again');
console.log('Particle lifetime, ring wrap, draw order, idle uploads and reactivation passed.');

// Lock the original A* route choices, including weighted routes and tie breaks.
const pathStart = html.indexOf('          findPath(e, t, n, r, i) {');
const pathEnd = html.indexOf('          nearestOpen(', pathStart);
assert(pathStart >= 0 && pathEnd > pathStart);
const findPath = vm.runInNewContext(`({${html.slice(pathStart, pathEnd)}}).findPath`, {
  Il: (x, y) => x >= 0 && y >= 0 && x < 44 && y < 44,
  Fl: (x, y) => y * 44 + x,
});
const world = {
  _tick: 0, _g: new Float64Array(1936), _from: new Int32Array(1936),
  _stamp: new Int32Array(1936), _closed: new Int32Array(1936),
  isWalkable: (x, y) => (x * 17 + y * 31) % 13 !== 0,
};
let seed = 7;
function randomTile() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return (seed >>> 8) % 44;
}
const routes = [];
for (let i = 0; i < 1000; i++) {
  routes.push(findPath.call(world, randomTile(), randomTile(), randomTile(), randomTile(),
    i % 2 ? (x, y) => (x + y) % 3 * 0.2 : undefined));
}
// Captured from the original implementation before introducing node reuse.
assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(routes)).digest('hex'),
  'edf1b22d3b8f3336885c3e2d3330b1f374b9956547b3bbfbdc784ab27665758e');
assert.equal(findPath.call(world, -1, 0, 4, 4), null);
console.log('1000 original weighted/unweighted A* routes and tie breaks preserved.');
