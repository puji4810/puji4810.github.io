import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");
  posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  return rss({
    title: "Puji's Blog",
    description: "Programming, systems, and design.",
    site: context.site ?? "https://puji4810.github.io",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.publishedAt,
      link: post.data.targetUrl,
    })),
    customData: `<language>en</language>`,
  });
}
