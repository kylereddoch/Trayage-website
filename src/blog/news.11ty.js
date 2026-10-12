import { blogIndex } from '../_lib/blog.js';
export const data = { layout: 'base.11ty.js', permalink: '/blog/product-news/index.html', path: 'blog/product-news/', title: 'Product News', description: 'Trayage release news from developer Kyle Reddoch. See what is available, what changed, and how to review your Mac Downloads before cleanup.', tags: ['sitePages'], order: 11 };
export default function (data) { return blogIndex({ ...data, category: 'Product news' }); }
