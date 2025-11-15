import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');
  return rss({
    title: '難破船ブログ RSS',
    description: '新着ブログ記事をRSSで受け取りたい方向けのフィードです。',
    site: context.site, // Astro設定の site をそのまま利用
    items: posts
      .filter((post) => !post.data.draft) // draft: true はRSSに出さない
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .map((post) => ({
        link: `/posts/${post.slug}`,
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
      })),
  });
}