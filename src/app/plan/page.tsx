import { SiteHeader } from "../../components/site-header";
import { Planner } from "../../features/itinerary/planner";
import { PlannerProvider } from "../../features/itinerary/state/planner-provider";
import { initialTrip } from "../../features/itinerary/state/initial-trip";
import { koreaToday } from "../../domain/itinerary/time";
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
      <PlannerProvider
        key={mode === "demo" ? "demo" : "live"}
        initialTrip={initialTrip(
          mode === "demo" ? "demo" : "live",
          koreaToday(new Date()),
        )}
      >
        <Planner />
      </PlannerProvider>
    </>
  );
}
