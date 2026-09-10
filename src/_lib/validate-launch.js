export function validateLaunch(config, requirePublication = false) {
  if (requirePublication && !config.publicationApproved) {
    throw new Error('Publication is not approved. Enable publication only after checking site configuration and content.');
  }
  if (config.publicationApproved && (!config.policiesApproved || !config.origin)) {
    throw new Error('Publication requires approved policy copy and the real HTTPS site origin.');
  }
  if (config.checkoutEnabled && !(config.publicationApproved && config.policiesApproved && config.releaseReady)) {
    throw new Error('Checkout requires publication approval, approved policies, and a verified public app release.');
  }
  if (config.origin) {
    const url = new URL(config.origin);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
      throw new Error('Site origin must be an HTTPS origin without a path, query, or credentials. Set the project path using --pathprefix.');
    }
  }
}
