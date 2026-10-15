export const data = { permalink: '/.well-known/security.txt', eleventyExcludeFromCollections: true };

export default function ({ site, base }) {
  return `Contact: mailto:trayage@relaybyte.dev
Expires: 2027-10-01T00:00:00Z
Preferred-Languages: en
Canonical: ${site.origin}${base}.well-known/security.txt
`;
}
