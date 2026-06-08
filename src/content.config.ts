import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * `blog` collection — Markdown/MDX posts under src/content/blog.
 * Adding a post is just dropping a new `.mdx` file with this frontmatter.
 */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    author: z.string().default("Waev"),
    /** Optional per-post OG image (root-relative). */
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
