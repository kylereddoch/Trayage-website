export function normalizeBase(value = '/') {
  const base = value || '/';
  if (!/^\/[A-Za-z0-9_\/-]*$/.test(base) || base.includes('//')) {
    throw new Error('Base must be a site path, for example / or /Trayage-website/.');
  }
  return base.endsWith('/') ? base : `${base}/`;
}
