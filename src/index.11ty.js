import { home } from './home.mjs';
import { appDescription } from './_lib/seo.js';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/index.html",
  "path": "",
  "title": "Trayage",
  "description": appDescription,
  "kind": "",
  "tags": [
    "sitePages"
  ],
  "order": 0
};

export default function ({ base, site, releases }) {
  return home(base, site, releases);
}
