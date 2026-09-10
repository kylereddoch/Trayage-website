import { refunds } from './pages.mjs';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/refunds/index.html",
  "path": "refunds/",
  "title": "Refund policy",
  "description": "Trayage refund policy: 14 days for initial direct purchases, separate from the seven-day trial. Apple handles App Store refunds.",
  "kind": "document-page",
  "tags": [
    "sitePages"
  ],
  "order": 4
};

export default function ({ base, site }) {
  return refunds(base, site);
}
