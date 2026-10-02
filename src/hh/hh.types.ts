import { z } from "zod";

const idNameSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const hhSalarySchema = z
  .object({
    from: z.number().nullable(),
    to: z.number().nullable(),
    currency: z.string(),
    gross: z.boolean().nullable(),
  })
  .nullable();

export const hhVacancyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  alternate_url: z.string().url(),
  published_at: z.string(),
  created_at: z.string(),
  employer: z
    .object({
      id: z.string().nullable().optional(),
      name: z.string(),
    })
    .nullable(),
  salary: hhSalarySchema,
  schedule: idNameSchema.nullable(),
  employment: idNameSchema.nullable(),
  experience: idNameSchema.nullable(),
  area: idNameSchema,
});

export const hhVacancySearchResponseSchema = z.object({
  items: z.array(hhVacancyListItemSchema),
  found: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  per_page: z.number().int().positive(),
});

export const hhVacancyDetailsSchema = hhVacancyListItemSchema.extend({
  description: z.string(),
  key_skills: z.array(z.object({ name: z.string() })).default([]),
  professional_roles: z.array(idNameSchema).default([]),
  relations: z.array(z.unknown()).default([]),
  response_url: z.string().url().nullable().optional(),
});

export type HhVacancyListItem = z.infer<typeof hhVacancyListItemSchema>;
export type HhVacancySearchResponse = z.infer<typeof hhVacancySearchResponseSchema>;
export type HhVacancyDetails = z.infer<typeof hhVacancyDetailsSchema>;
