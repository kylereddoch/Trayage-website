import { home } from './home.mjs';

export const data = {
  "layout": "base.11ty.js",
  "permalink": "/index.html",
  "path": "",
  "title": "Trayage",
  "description": "A native Mac app for a clearer view of Downloads. Review installers, likely duplicates, old and large files locally. Currently in development.",
  "kind": "",
  "tags": [
    "sitePages"
  ],
  "order": 0
};

export default function ({ base, site, releases }) {
  return home(base, site, releases);
}
