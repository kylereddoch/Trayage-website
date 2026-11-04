import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';

// Read expectations from source, independently of the generated listings/feed.
// New published articles then join every route sweep without a second inventory.
const directory = new URL('../../src/blog/posts/', import.meta.url);
const filenames = (await readdir(directory)).filter(name => name.endsWith('.md')).sort();
const posts = await Promise.all(filenames.map(async filename => {
  const { data } = matter(await readFile(new URL(filename, directory), 'utf8'));
  if (data.draft || data.noindex) return null;
  return {
    ...data,
    category: data.category ?? 'Guides',
    path: `blog/${filename.slice(0, -3)}/`,
    modified: new Date(data.updated || data.date).toISOString()
  };
}));

export const publishedPosts = posts.filter(Boolean);
export const postRoutes = publishedPosts.map(post => post.path);
