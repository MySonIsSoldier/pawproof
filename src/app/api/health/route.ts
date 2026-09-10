export function GET() {
  return Response.json(
    { status: "ok", service: "pawproof" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
