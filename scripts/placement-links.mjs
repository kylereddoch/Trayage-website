import { pathToFileURL } from 'node:url';
import placements from '../src/_data/placements.json' with {type:'json'};
import site from '../src/_data/site.json' with {type:'json'};

export function placementLinks(id) {
  if (!Object.hasOwn(placements, id) || !/^[a-z0-9_-]{1,80}$/.test(id)) throw new Error(`Unknown placement: ${id}`);
  const placement = placements[id];
  const website = new URL(placement.path, `${site.origin}/`);
  website.searchParams.set('via', id);
  for (const field of ['source', 'medium', 'campaign', 'content']) {
    if (!/^[a-z0-9_-]{1,80}$/.test(placement[field])) throw new Error(`Invalid ${field} for ${id}`);
    website.searchParams.set(`utm_${field}`, placement[field]);
  }
  const stripe = new URL(site.links.oneTime);
  stripe.searchParams.set('client_reference_id', id);
  return {id, label:placement.label, website:website.href, stripe:stripe.href};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const markdown = process.argv.includes('--markdown');
  const ids = process.argv.slice(2).filter(arg => arg !== '--markdown');
  const links = (ids.length ? ids : Object.keys(placements)).map(placementLinks);
  if (markdown) {
    console.log('# Trayage placement links\n\nGenerated from `src/_data/placements.json`. Deploy the placement-tracking website update before using website links. These links have not been posted or submitted. Give each separate post its own registered placement; do not reuse a reminder label for multiple posts.\n\n[Setup, verification and reporting](PLACEMENT-TRACKING.md)\n\n| Placement | Website link | Direct checkout link |\n| --- | --- | --- |');
    for (const link of links) console.log(`| ${link.label} — \`${link.id}\` | [Website](${link.website}) | [Stripe](${link.stripe}) |`);
  } else {
    for (const link of links) console.log(JSON.stringify(link));
  }
}
