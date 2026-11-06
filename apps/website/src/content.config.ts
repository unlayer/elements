import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

/** One page per component, split from the package's own REFERENCE.md by scripts/generate.mjs. */
const reference = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/generated/reference" }),
  schema: z.object({
    title: z.string(),
    group: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

export const collections = { docs, reference };
