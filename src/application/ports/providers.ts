import type {
  Category,
  Place,
  Policy,
  PolicySource,
  PolicyNotice,
} from "../../domain/policies/types.ts";
export type PlaceDocument = {
  place: Place;
  raw: string;
  modifiedAt: string | null;
  fetchedAt: string;
  sourceUrl: string | null;
  sourceLabel: string;
  phone?: string | null;
};
export interface PlaceSource {
  around?(
    center: { lat: number; lng: number },
    radius: number,
    category?: Category,
  ): Promise<Place[]>;
  search(query: string, category?: Category): Promise<Place[]>;
  get(id: string): Promise<PlaceDocument>;
  nearby(place: Place): Promise<Place[]>;
}
export interface RuleExtractor {
  extract(document: PlaceDocument): Promise<Policy>;
}
export type SupplementalDocument = PlaceDocument & { evidence: PolicySource };
export interface PolicySupplementSource {
  find(place: Place): {
    documents: SupplementalDocument[];
    notices: PolicyNotice[];
    warnings: string[];
  };
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
