import { SiteHeader } from "../../components/site-header";
import { Planner } from "../../features/itinerary/planner";
export const metadata = { title: "우리의 여행 노트" };
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return (
    <>
      <SiteHeader compact />
      <Planner initialMode={mode === "demo" ? "demo" : "live"} />
    </>
  );
}
