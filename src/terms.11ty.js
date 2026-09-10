import { terms } from './pages.mjs';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/terms/index.html",
  "path": "terms/",
  "title": "Purchase terms",
  "description": "Terms for a one-time Trayage purchase, seven-day trial, and optional discounted major upgrades.",
  "kind": "document-page",
  "tags": [
    "sitePages"
  ],
  "order": 3
};

export default function ({ base, site }) {
  return terms(base, site);
}
