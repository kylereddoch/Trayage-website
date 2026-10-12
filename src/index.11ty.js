import { home } from './home.mjs';
import { appDescription } from './_lib/seo.js';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/index.html",
  "path": "",
  "title": "Trayage — Downloads Cleanup App for Mac",
  "description": appDescription,
  "kind": "",
  "tags": [
    "sitePages"
  ],
  "order": 0
};

export default function ({ base, site, releases, collections }) {
  return home(base, site, releases, collections);
}
