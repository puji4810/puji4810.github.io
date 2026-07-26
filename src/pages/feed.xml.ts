import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdown = new MarkdownIt({ html: true, linkify: true });

/**
 * Renders a post to feed-safe HTML. This is a plain markdown pass, so the
 * site's KaTeX, Mermaid and Expressive Code treatments are not applied —
 * readers get the source of those blocks, which is what feed clients can
 * actually display.
 */
function toFeedHtml(body: string, postUrl: URL): string {
  return sanitizeHtml(markdown.render(body), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
    },
    // Feed readers resolve relative paths against their own origin, not ours.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href
          ? { ...attribs, href: new URL(attribs.href, postUrl).href }
          : attribs,
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: attribs.src
          ? { ...attribs, src: new URL(attribs.src, postUrl).href }
          : attribs,
      }),
    },
  });
}

export async function GET(context: APIContext) {
  const posts = await getCollection("posts");
  posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const site = context.site ?? new URL("https://puji4810.github.io");

  return rss({
    title: "Puji's Blog",
    description: "Programming, systems, and design.",
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.publishedAt,
      link: post.data.targetUrl,
      categories: post.data.tags,
      content: toFeedHtml(post.body ?? "", new URL(post.data.targetUrl, site)),
    })),
    customData: `<language>en</language>`,
  });
}
