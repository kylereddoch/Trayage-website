import { escape, arrow, icon } from '../layout.mjs';
import { publicPosts, categoryPath } from './content-index.js';
export { categoryPath };

export const dateLabel = value => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const isoDate = value => new Date(value).toISOString();
export const readingTime = content => Math.max(1, Math.ceil(String(content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 220));
export const newestPosts = publicPosts;

export function postCard(post, base, featured = false) {
  const { title, description, path, category } = post.data;
  return `<article class="blog-card${featured ? ' blog-featured' : ''}"><div class="blog-card-copy"><p class="eyebrow">${featured ? 'Start here · ' : ''}${escape(category)}</p><h2><a href="${base}${escape(path)}">${escape(title)}</a></h2><p>${escape(description)}</p><div class="blog-meta"><time datetime="${isoDate(post.date)}">${dateLabel(post.date)}</time><span>${readingTime(post.content)} min read</span></div><a class="text-link" href="${base}${escape(path)}">${category === 'Guides' ? 'Read the guide' : 'Read the story'} ${arrow}</a></div>${postArtwork(post, base)}</article>`;
}

export function blogIndex({ base, collections, guides = false, category = guides ? 'Guides' : '' }) {
  const posts = newestPosts(collections.posts).filter(post => !category || post.data.category === category);
  const featured = posts.find(post => post.data.featured) || posts[0];
  return `<section class="wrap blog-header"><h1>${category === 'Product news' ? 'Trayage releases<br>and <em>product news.</em>' : guides ? 'How to review<br>and <em>clean up Downloads.</em>' : 'Downloads cleanup guides<br>and <em>Trayage news.</em>'}</h1><p class="blog-lede">${category === 'Product news' ? 'See what is available in Trayage, what changed, and how to use each release.' : guides ? 'Learn how to check installers, compare possible copies, and decide what to keep on your Mac.' : 'Learn which downloads to check before removing them, follow a first Trayage review, and read release news from Kyle Reddoch, the developer.'}</p></section>
  <div class="wrap blog-toolbar"><nav aria-label="Blog categories">${[['', 'All posts'], ['Guides', 'Guides'], ['Product news', 'Product news']].map(([value, label]) => `<a href="${base}${categoryPath(value)}"${category === value ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><a href="${base}blog/feed.xml">Subscribe via RSS ${arrow}</a></div>
  <section class="wrap blog-list" aria-label="${guides ? 'Guides' : 'Blog posts'}">${featured ? postCard(featured, base, true) + posts.filter(post => post !== featured).map(post => postCard(post, base)).join('') : '<p>New articles will appear here.</p>'}</section>
  <section class="wrap blog-note"><h2>Mac file advice from Trayage’s developer</h2><p>Trayage is made by <a href="${base}about/">Kyle Reddoch</a>. This is a place for useful answers about the files that accumulate on a Mac, and the care that goes into building a small app to help.</p><a class="text-link" href="${base}download/">Try a free file review ${arrow}</a></section>`;
}

export function postArtwork(post, base) {
  const slug = post.data.path || '';
  const news = post.data.category === 'Product news';
  const artwork = news ? 'news' : /duplicate/.test(slug) ? 'copies' : /dmg/.test(slug) ? 'installer' : /review/.test(slug) ? 'review' : 'folder';
  return `<div class="post-illustration art-${artwork}" aria-hidden="true">${news ? `<img src="${base}assets/brand-violet/trayage-app-icon.png" width="124" height="124" alt="" loading="lazy" decoding="async">` : `${artwork === 'copies' ? '<span class="paper-file"></span>' : ''}<span class="paper-file">${icon(artwork === 'installer' ? 'drive' : artwork === 'review' ? 'check' : artwork === 'copies' ? 'files' : 'folder')}</span>`}</div>`;
}
