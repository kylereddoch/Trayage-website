import { blogIndex } from '../_lib/blog.js';
export const data = { layout: 'base.11ty.js', permalink: '/blog/product-news/index.html', path: 'blog/product-news/', title: 'Product News', description: 'News from Trayage: meaningful releases, new features, and a closer look at the Mac app that helps you review your Downloads before cleanup.', tags: ['sitePages'], order: 11 };
export default function (data) { return blogIndex({ ...data, category: 'Product news' }); }
