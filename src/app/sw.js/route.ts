import { workerSource } from "../../infrastructure/pwa/worker-source";
import { appPath } from "../../config/public";

export const dynamic = "force-static";
export function GET() {
  return new Response(
    workerSource(process.env.NEXT_PUBLIC_PWA_RELEASE || "development"),
    {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Service-Worker-Allowed": appPath("/"),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; connect-src 'self'",
      },
    },
  );
}
