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
    /** Optional FAQ — rendered as a visible section AND emitted as FAQPage
     *  JSON-LD for answer-engine (AEO) extraction. Single source of truth. */
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
    /** Optional whimsical hero illustration (root-relative src + alt).
     *  Rendered at the top of the post and used as the OG/social image. */
    hero: z.object({ src: z.string(), alt: z.string() }).optional(),
  }),
});

export const collections = { blog };
