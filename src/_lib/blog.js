import { escape, arrow, icon } from '../layout.mjs';
import { publicPosts, categoryPath } from './content-index.js';
export { categoryPath };

export const dateLabel = value => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const isoDate = value => new Date(value).toISOString();
export const readingTime = content => Math.max(1, Math.ceil(String(content).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 220));
export const newestPosts = publicPosts;

export function postCard(post, base, featured = false) {
  const { title, description, path, category } = post.data;
  return `<article class="blog-card${featured ? ' blog-featured' : ''}"><div class="blog-card-copy"><p class="eyebrow">${featured ? 'Start here · ' : ''}${escape(category)}</p><h2><a href="${base}${escape(path)}">${escape(title)}</a></h2><p>${escape(description)}</p><div class="blog-meta"><time datetime="${isoDate(post.date)}">${dateLabel(post.date)}</time><span>${readingTime(post.content)} min read</span></div><a class="text-link" href="${base}${escape(path)}">${category === 'Guides' ? 'Read the guide' : 'Read the story'} ${arrow}</a></div>${featured ? `<div class="blog-featured-art"><div class="blog-art-label">A little order for your Downloads.</div><div class="blog-file-stack" aria-hidden="true"><span>${icon('drive')} The installers</span><span>${icon('files')} The familiar copies</span><span>${icon('folder')} The things to keep</span></div><p>Keep what matters.<br><em>Let the rest go.</em></p></div>` : `<span class="blog-card-symbol" aria-hidden="true">${icon(category === 'Guides' ? 'drive' : 'tray')}</span>`}</article>`;
}

export function blogIndex({ base, collections, guides = false, category = guides ? 'Guides' : '' }) {
  const posts = newestPosts(collections.posts).filter(post => !category || post.data.category === category);
  const featured = posts.find(post => post.data.featured) || posts[0];
  return `<section class="wrap blog-header"><p class="eyebrow">${category ? 'From the Trayage Blog' : 'The Trayage Blog'}</p><h1>${category === 'Product news' ? 'Small app.<br><em>Good things ahead.</em>' : guides ? 'A little guidance.<br><em>A little more room.</em>' : 'A little order.<br><em>A few good reads.</em>'}</h1><p class="blog-lede">${category === 'Product news' ? 'Meaningful releases, new features, and a closer look at Trayage.' : guides ? 'Practical, thoughtful ways to review your Downloads and keep the files that matter.' : 'Practical Mac guides, thoughtful file habits, and stories from the makers of Trayage.'}</p></section>
  <div class="wrap blog-toolbar"><nav aria-label="Blog categories">${[['', 'All posts'], ['Guides', 'Guides'], ['Product news', 'Product news']].map(([value, label]) => `<a href="${base}${categoryPath(value)}"${category === value ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><a href="${base}blog/feed.xml">Subscribe via RSS ${arrow}</a></div>
  <section class="wrap blog-list" aria-label="${guides ? 'Guides' : 'Blog posts'}">${featured ? postCard(featured, base, true) + posts.filter(post => post !== featured).map(post => postCard(post, base)).join('') : '<p>New articles will appear here.</p>'}</section>
  <section class="wrap blog-note"><p class="eyebrow">From the person who makes it</p><h2>Small habits.<br>More breathing room.</h2><p>Trayage is made by <a href="${base}about/">Kyle Reddoch</a>. This is a place for useful answers about the files that accumulate on a Mac, and the care that goes into building a small app to help.</p><a class="text-link" href="${base}download/">Meet Trayage ${arrow}</a></section>`;
}
