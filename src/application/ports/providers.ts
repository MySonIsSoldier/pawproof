import type { Category, Place, Policy } from "../../domain/policies/types.ts";
export type PlaceDocument = {
  place: Place;
  raw: string;
  modifiedAt: string | null;
  fetchedAt: string;
  sourceUrl: string | null;
  sourceLabel: string;
};
export interface PlaceSource {
  search(query: string, category?: Category): Promise<Place[]>;
  get(id: string): Promise<PlaceDocument>;
  nearby(place: Place): Promise<Place[]>;
}
export interface RuleExtractor {
  extract(document: PlaceDocument): Promise<Policy>;
}
export interface RouteTimeProvider {
  basis: "demo" | "kakao" | "unavailable";
  minutes(from: Place, to: Place): Promise<number | null>;
}
export type Providers = {
  places: PlaceSource;
  extractor: RuleExtractor;
  travel: RouteTimeProvider;
};
