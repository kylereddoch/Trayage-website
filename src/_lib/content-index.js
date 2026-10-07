export const categoryPath = category => category === 'Guides' ? 'blog/guides/' : category === 'Product news' ? 'blog/product-news/' : 'blog/';
export function publicPosts(posts = [], category = '') {
  return [...posts].filter(post => !post.data.draft && !post.data.noindex && (!category || post.data.category === category))
    .sort((a, b) => b.date - a.date || a.data.title.localeCompare(b.data.title));
}
export function listedPosts(posts, category = '') {
  const sorted = publicPosts(posts, category);
  const featured = sorted.find(post => post.data.featured) || sorted[0];
  return featured ? [featured, ...sorted.filter(post => post !== featured)] : [];
}
export function breadcrumbItems(path, title, category) {
  const items = [{ name: 'Trayage', path: '' }];
  if (path.startsWith('blog/') && path !== 'blog/') items.push({ name: 'Blog', path: 'blog/' });
  const parent = categoryPath(category);
  if (category && path !== parent && parent !== 'blog/') items.push({ name: category, path: parent });
  if (path) items.push({ name: title, path });
  return items;
}
export function contentDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid content date: ${value}`);
  return parsed.toISOString();
}
