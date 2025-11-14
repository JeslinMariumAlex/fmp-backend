// src/schemas/plugin.schema.js
import { z } from "zod";

const url = z.string().url({ message: "Must be a valid URL" });

export const createPluginSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    desc: z.string().min(5),
    descText: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().min(2),
    subcategory: z.string().optional().default(""),
    screenshots: z.array(z.object({ url })).optional().default([]),
    video: z.string().url().optional().or(z.literal("")).default(""),
    appLink: z.string().url().optional().or(z.literal("")).default(""),
    likes: z.number().int().min(0).optional().default(0),
    hearts: z.number().int().min(0).optional().default(0),
    oks: z.number().int().min(0).optional().default(0),
    rating: z.number().min(0).max(5).optional().default(0),
    ratingsCount: z.number().int().min(0).optional().default(0)
  })
});

export const updatePluginSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    desc: z.string().min(5).optional(),
    descText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().min(2).optional(),
    subcategory: z.string().optional(),
    screenshots: z.array(z.object({ url })).optional(),
    video: z.string().url().optional().or(z.literal("")),
    appLink: z.string().url().optional().or(z.literal("")),
    likes: z.number().int().min(0).optional(),
    hearts: z.number().int().min(0).optional(),
    oks: z.number().int().min(0).optional(),
    rating: z.number().min(0).max(5).optional(),
    ratingsCount: z.number().int().min(0).optional()
  })
});

export const listQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    tags: z.string().optional(),  // comma-separated
    minRating: z.string().optional(), // parseFloat later
    sortBy: z.enum(["newest","popular","rating"]).optional(),
    order: z.enum(["asc","desc"]).optional(),
    page: z.string().optional(),   // parseInt later
    limit: z.string().optional()   // parseInt later
  })
});
