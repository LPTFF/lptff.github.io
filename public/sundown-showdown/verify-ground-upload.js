// Browser regression check. Evaluate this file in the running game page, then
// await verifyGroundUpload(). Uses separate textures; never changes the map.
async function verifyGroundUpload(game = window.__game) {
  const renderer = game.pipeline.renderer;
  const gl = renderer.getContext();
  const uploader = game.pipeline.groundUploader;
  if (!uploader) throw new Error('Wait for the first ground update before testing');
  const canvas = document.createElement('canvas');
  canvas.width = 257;
  canvas.height = 129;
  const ctx = canvas.getContext('2d');
  const Texture = game.world.groundMap.constructor;
  const reference = new Texture(canvas);
  const candidate = new Texture(canvas);
  reference.colorSpace = candidate.colorSpace = game.world.groundMap.colorSpace;
  const framebuffer = gl.createFramebuffer();
  const target = renderer.getRenderTarget();
  const face = renderer.getActiveCubeFace();
  const mip = renderer.getActiveMipmapLevel();
  const comparisons = [];
  function read(texture, level) {
    const width = Math.max(1, canvas.width >> level);
    const height = Math.max(1, canvas.height >> level);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
      renderer.properties.get(texture).__webglTexture, level);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error('Regression framebuffer is incomplete');
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }
  function restore() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    renderer.resetState();
    renderer.setRenderTarget(target, face, mip);
  }
  try {
    // Cover all 256 channel values, non-power-of-two dimensions, orientation,
    // repeated updates, and every mip level. The ground is fully opaque.
    for (let phase = 0; phase < 3; phase++) {
      const pixels = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] = (i / 4 + phase * 53) % 256;
        pixels.data[i + 1] = ((i / 4) * 17 + phase * 31) % 256;
        pixels.data[i + 2] = (Math.floor(i / (4 * canvas.width)) * 23 + phase * 79) % 256;
        pixels.data[i + 3] = 255;
      }
      ctx.putImageData(pixels, 0, 0);
      reference.needsUpdate = true;
      renderer.initTexture(reference);
      if (phase === 0) {
        // Allocate candidate, then overwrite with an unrelated clear color.
        renderer.initTexture(candidate);
        read(candidate, 0);
        gl.colorMask(true, true, true, true);
        gl.disable(gl.SCISSOR_TEST);
        gl.clearColor(1, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        restore();
      }
      uploader.upload(candidate, canvas);
      for (let level = 0; level <= Math.floor(Math.log2(canvas.width)); level++) {
        const expected = read(reference, level), actual = read(candidate, level);
        let different = 0, maxDelta = 0;
        for (let i = 0; i < expected.length; i++) {
          const delta = Math.abs(expected[i] - actual[i]);
          if (delta) different++;
          maxDelta = Math.max(maxDelta, delta);
        }
        comparisons.push({ phase, level, different, maxDelta });
        if (different) throw new Error(`Texture mismatch: ${JSON.stringify(comparisons.at(-1))}`);
      }
      restore();
    }
    const error = gl.getError();
    if (error) throw new Error(`WebGL error: ${error}`);
    return { passed: true, comparisons: comparisons.length, maxChannelDifference: 0 };
  } finally {
    restore();
    gl.deleteFramebuffer(framebuffer);
    reference.dispose();
    candidate.dispose();
  }
}
