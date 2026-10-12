// Enabling the flag during a production build must never expose a draft.
export const isDraftPreview = data => Boolean(data?.draft && process.env.TRAYAGE_PREVIEW_DRAFTS === '1' && process.env.ELEVENTY_RUN_MODE === 'serve');
