import { blogIndex } from '../_lib/blog.js';
export const data = { layout: 'base.11ty.js', permalink: '/blog/guides/index.html', path: 'blog/guides/', title: 'Mac Cleanup Guides', description: 'Practical guides to reviewing your Mac Downloads folder, checking old installers, and keeping the files that matter. From the Trayage Blog.', tags: ['sitePages'], order: 10 };
export default function (data) { return blogIndex({ ...data, guides: true }); }
