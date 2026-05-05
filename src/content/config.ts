import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    publishedAt: z.date(),
    author: z.string(),
    heroImage: z.string().optional(),
    showToc: z.boolean(),
    tags: z.array(z.string()),
    summary: z.string(),
    featured: z.boolean(),
    legacyUrl: z.string(),
    targetUrl: z.string(),
    routeSlug: z.string(),
  }),
});

export const collections = { posts };
