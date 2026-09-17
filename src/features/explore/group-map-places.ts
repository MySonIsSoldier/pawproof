import type { Place, Status } from "../../domain/policies/types";
export type MapPlace = { place: Place; status: Status };
type Pixel = { x: number; y: number };
/** Group overlapping labels in screen pixels, recalculating at each zoom. */
export function groupMapPlaces(
  places: MapPlace[],
  project: (place: Place) => Pixel,
) {
  const groups: { point: Pixel; items: MapPlace[] }[] = [];
  for (const item of places) {
    const point = project(item.place);
    const group = groups.find(
      (g) =>
        Math.abs(g.point.x - point.x) < 120 &&
        Math.abs(g.point.y - point.y) < 48,
    );
    if (group) group.items.push(item);
    else groups.push({ point, items: [item] });
  }
  return groups.map((g) => g.items);
}
