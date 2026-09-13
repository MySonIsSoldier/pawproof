import { z } from "zod";
export const petSchema = z
  .object({
    name: z.string().trim().min(1).max(20),
    breed: z.string().trim().min(1).max(40),
    weight: z.number().min(0.1).max(120),
  })
  .strict();
export const profileInputSchema = z
  .object({
    pets: z.array(petSchema.extend({ id: z.string().uuid() })).max(5),
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (value) => new Set(value.pets.map((p) => p.id)).size === value.pets.length,
    "반려견 ID가 중복되었어요.",
  );
export const profileSchema = z
  .object({
    pets: profileInputSchema.shape.pets,
    revision: z.number().int().nonnegative(),
  })
  .strict();
export type AccountProfile = z.infer<typeof profileSchema>;
