import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts');
  return rss({
    title: 'My Blog RSS Feed',
    description: 'Subscribe to get the latest blog posts.',
    site: 'https://nanpasen.mozuc.dev/',
    items: posts
      .filter(post => !post.data.draft)
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .map(post => ({
        link: `/posts/${post.slug}`,
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
      })),
  });
}