import { z } from "zod";

/** A deliberate phrase prevents an accidental one-click account deletion. */
export const accountDeletionSchema = z
  .object({ confirmation: z.literal("DELETE") })
  .strict();

export const accountDeletionResultSchema = z
  .object({ deleted: z.literal(true) })
  .strict();
