import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    example: z.boolean().default(false),
  }),
});
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    category: z.enum(['AI', '游戏开发', 'Web', '开发工具', '其他']),
    status: z.enum(['构思中', '开发中', '已完成', '暂停维护']),
    stack: z.array(z.string()),
    cover: z.string(),
    screenshots: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    github: z.url().optional(),
    demo: z.string().optional(),
    featured: z.boolean().default(false),
    example: z.boolean().default(true),
    hidden: z.boolean().default(false),
    order: z.number().default(0),
  }),
});
const skills = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/skills' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    version: z.string(),
    updatedDate: z.coerce.date(),
    tags: z.array(z.string()),
    requirements: z.array(z.string()),
    download: z.string().regex(/^\/downloads\/skills\/[a-z0-9-]+\.zip$/),
    draft: z.boolean().default(true),
  }),
});
export const collections = { blog, projects, skills };
