import { support } from './pages.mjs';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/support/index.html",
  "path": "support/",
  "title": "Support",
  "seoTitle": "Support, Trials & License Help — Trayage for Mac",
  "description": "Get RelayByte support from Kyle Reddoch for your Trayage trial, one-time purchase, license, and devices.",
  "kind": "",
  "tags": [
    "sitePages"
  ],
  "order": 1
};

export default function ({ base, site, releases }) {
  return support(base, site, releases);
}
