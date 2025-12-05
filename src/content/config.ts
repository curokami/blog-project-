// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    author: z.string().default('suihan'),
    description: z.string(), // ← この行を追加
    image: z.string().optional(), 
    tags: z.array(z.string()).optional(),
    body: z.string().optional(), // 本文を追加
    draft: z.boolean().optional(), 
  }),
});

export const collections = {
  'posts': postsCollection,
};