import { SiteHeader } from "../../components/site-header";
import { Planner } from "../../features/itinerary/planner";
import { PlannerProvider } from "../../features/itinerary/state/planner-provider";
import { initialTrip } from "../../features/itinerary/state/initial-trip";
import { koreaToday } from "../../domain/itinerary/time";
export const metadata = {
  title: "우리의 여행 노트",
  description: "지도에서 장소를 고르고 반려견 동반 조건을 확인하는 PawProof 여행 노트",
  alternates: { canonical: "/plan" },
  robots: { index: false, follow: false },
};
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; view?: string }>;
}) {
  const { mode, view } = await searchParams;
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
        <Planner
          initialView={view === "note" || mode === "demo" ? "note" : "map"}
        />
      </PlannerProvider>
    </>
  );
}
