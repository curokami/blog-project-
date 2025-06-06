// src/pages/api/search.json.ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export const GET: APIRoute = async ({ url }): Promise<Response> => {
    const posts: CollectionEntry<'posts'>[] = await getCollection('posts');

    const searchData = posts.map(post => ({
        slug: post.slug,
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        image: post.data.image
    }));
    
    return new Response(JSON.stringify(searchData), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
}