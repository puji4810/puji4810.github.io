import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMermaidCode from "./src/markdown/remark-mermaid-code.mjs";
import rehypeTableScroll from "./src/markdown/rehype-table-scroll.mjs";
import remarkMath from "remark-math";

import expressiveCode from "astro-expressive-code";

export default defineConfig({
  site: "https://puji4810.github.io",
  base: "/",
  output: "static",
  integrations: [
    sitemap(),
    expressiveCode({
      themes: ["everforest-light", "everforest-dark"],
      useDarkModeMediaQuery: false,
      defaultProps: {
        wrap: false,
      },
      styleOverrides: {
        borderRadius: "var(--radius-md)",
        borderColor: "var(--color-border)",
        frames: {
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorTabBarBorderBottomColor: "transparent",
        },
      },
    }),
  ],
  markdown: {
    gfm: true,
    smartypants: true,
    remarkPlugins: [remarkGfm, remarkMermaidCode, remarkMath],
    rehypePlugins: [
      rehypeRaw,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["heading-anchor"],
          },
        },
      ],
      rehypeKatex,
      rehypeTableScroll,
    ],
  },
});