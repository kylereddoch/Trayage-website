import { layout, escape, arrow } from '../layout.mjs';
import { dateLabel, isoDate, readingTime, newestPosts, categoryPath } from '../_lib/blog.js';

export default function (data) {
  const { base, title, description, content, page, category, updated, site } = data;
  const headings = [...content.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
  const related = newestPosts(data.collections.posts).filter(post => post.data.path !== data.path).sort((a, b) => Number(b.data.category === category) - Number(a.data.category === category)).slice(0, 2);
  const body = `<article class="wrap blog-article"><header class="article-header"><a class="eyebrow back-link" href="${base}blog/">← Back to Blog</a><a class="article-category" href="${base}${categoryPath(category)}">${escape(category)}</a><h1>${escape(title)}</h1><p class="blog-lede">${escape(description)}</p><div class="blog-meta"><span>By <a href="${base}about/" rel="author">${escape(site.publisher)}</a></span><time datetime="${isoDate(page.date)}">${dateLabel(page.date)}</time><span>${readingTime(content)} min read</span>${updated ? `<span>Updated <time datetime="${isoDate(updated)}">${dateLabel(updated)}</time></span>` : ''}</div></header>
  <div class="article-layout">${headings.length ? `<nav class="article-toc" aria-label="On this page"><p class="eyebrow">On this page</p>${headings.map(([, id, label]) => `<a href="#${escape(id)}">${label.replace(/<[^>]+>/g, '')}</a>`).join('')}</nav>` : ''}<div class="article-body">${content}<div class="article-cta"><p class="eyebrow">A thoughtful second look</p><h2>Meet your Downloads.<br><em>With a little help.</em></h2><p>Trayage brings installers, likely duplicates, and old or large files together for your review. File analysis stays on your Mac. You choose what moves to Trash.</p><a class="button" href="${base}download/">Get Trayage ${arrow}</a></div></div></div></article>
  ${related.length ? `<section class="wrap article-related" aria-labelledby="related-title"><p class="eyebrow">Keep reading</p><h2 id="related-title">Another useful read.</h2>${related.map(post => `<a class="related-link" href="${base}${escape(post.data.path)}"><span>${escape(post.data.title)}</span>${arrow}</a>`).join('')}</section>` : ''}`;
  return layout({ ...data, body, published: page.date, articleText: content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() });
}
