let cachedSupport = null;

export const supportsWebGL = () => {
  if (cachedSupport !== null) return cachedSupport;
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cachedSupport = Boolean(context);
    if (context) {
      const extension = context.getExtension('WEBGL_lose_context');
      extension?.loseContext();
    }
  } catch {
    cachedSupport = false;
  }
  return cachedSupport;
};

export const webglFallback = ({ title = '3D view unavailable', message = '', compact = false } = {}) => `
  <div class="webgl-fallback ${compact ? 'webgl-fallback--compact' : ''}" role="status">
    <div class="fallback-orbit" aria-hidden="true">
      <span class="fallback-orbit__sun"></span>
      <span class="fallback-orbit__ring fallback-orbit__ring--one"></span>
      <span class="fallback-orbit__ring fallback-orbit__ring--two"></span>
      <span class="fallback-orbit__planet"></span>
    </div>
    <div>
      <p class="eyebrow">FALLBACK VISUALIZATION</p>
      <h3>${title}</h3>
      <p>${message || 'Your browser or device could not start WebGL. Scientific data and controls remain fully available in this 2D mode.'}</p>
    </div>
  </div>
`;
