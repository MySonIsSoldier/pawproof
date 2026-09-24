import { z } from "zod";
import { withRequestSignal } from "../../lib/http/request-signal.ts";

const siteverifyResponseSchema = z.object({ success: z.boolean() });

export async function verifyTurnstileToken(
  token: string,
  secret: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await withRequestSignal(5_000, undefined, (signal) =>
      fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        cache: "no-store",
        redirect: "error",
        signal,
      }),
    );
    const parsed = siteverifyResponseSchema.safeParse(await response.json());
    return response.ok && parsed.success && parsed.data.success;
  } catch {
    return false;
  }
}
