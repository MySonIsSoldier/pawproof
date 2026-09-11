import type { TripInput } from "../../../domain/policies/types.ts";
import { createDemoTrip } from "../../../fixtures/demo-trip.ts";

export function initialTrip(mode: TripInput["mode"], date: string): TripInput {
  const demo = createDemoTrip(date);
  return mode === "demo"
    ? demo
    : {
        ...demo,
        mode,
        pets: [{ name: "", breed: "", weight: 0 }],
        equipment: [],
        visits: [],
      };
}
