import { privacy } from './pages.mjs';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/privacy/index.html",
  "path": "privacy/",
  "title": "Privacy",
  "description": "Privacy details for Trayage: local file analysis, Stripe purchases, Keylight licensing and device reporting, website hosting, and support.",
  "kind": "document-page",
  "tags": [
    "sitePages"
  ],
  "order": 2
};

export default function ({ base, site }) {
  return privacy(base, site);
}
