import { z } from "zod";

export const contactCategoryValues = [
  "service",
  "data",
  "bug",
  "other",
] as const;

export const contactCategoryLabels: Record<
  (typeof contactCategoryValues)[number],
  string
> = {
  service: "서비스 이용",
  data: "장소·동반 정보",
  bug: "오류 제보",
  other: "그 외 문의",
};

export const contactInputSchema = z.object({
  email: z.string().trim().email().max(254),
  category: z.enum(contactCategoryValues),
  message: z.string().trim().min(10).max(2_000),
  website: z.string().max(200).optional().default(""),
  turnstileToken: z.string().max(2_048).optional(),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
