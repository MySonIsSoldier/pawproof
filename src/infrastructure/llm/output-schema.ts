import { z } from "zod";
import { extractionSchema } from "../../application/contracts/policy.ts";

/** Keep generation constraints small; validate all bounds and evidence on the server. */
export const policyOutputSchema = z.toJSONSchema(extractionSchema, {
  override: ({ jsonSchema }) => {
    delete jsonSchema.minItems;
    delete jsonSchema.maxItems;
    delete jsonSchema.minLength;
    delete jsonSchema.maxLength;
    delete jsonSchema.minimum;
    delete jsonSchema.maximum;
  },
});
