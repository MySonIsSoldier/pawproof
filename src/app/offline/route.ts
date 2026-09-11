import { offlineDocument } from "../../infrastructure/pwa/offline-document";
import { appPath } from "../../config/public";

export const dynamic = "force-static";
export function GET() {
  return new Response(offlineDocument(appPath("/plan")), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    },
  });
}
