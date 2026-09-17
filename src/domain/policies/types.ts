export type Status = "available" | "prepare" | "confirm" | "blocked";
export type Zone = "indoor" | "outdoor";
export type Category = "관광지" | "식당" | "카페";
export type RuleKind =
  | "entry"
  | "weight"
  | "count"
  | "breed"
  | "equipment"
  | "vaccination"
  | "hours"
  | "closedDays";
export type Rule = {
  kind: RuleKind;
  scope: "all" | Zone;
  operator: "allow" | "deny" | "lte" | "lt" | "all" | "any" | "unknown";
  value: number | null;
  items: string[];
  quote: string;
  conflict?: boolean;
};
export type Pet = { name: string; breed: string; weight: number };
export type Place = {
  id: string;
  name: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  source: "demo" | "kto" | "mfds";
};
export type Policy = {
  rules: Rule[];
  unresolved: string[];
  raw: string;
  sourceLabel: string;
  sourceUrl: string | null;
  fetchedAt: string;
  modifiedAt: string | null;
  sources?: PolicySource[];
  notices?: PolicyNotice[];
};
export type PolicySource = {
  label: string;
  url: string | null;
  publishedAt: string | null;
  accessedAt: string;
  phone: string | null;
  raw: string;
};
export type PolicyNotice = {
  startDate: string;
  endDate: string;
  message: string;
  quote: string;
  sourceUrl: string;
  sourceLabel: string;
  checkedAt: string;
};
export type Finding = {
  status: Status;
  kind: RuleKind | "source" | "travel";
  message: string;
  quote: string | null;
  needs: string[];
};
export type Visit = {
  placeId: string;
  duration: number;
  zone: Zone;
  locked: boolean;
};
export type TripInput = {
  mode: "demo" | "live";
  pets: Pet[];
  date: string;
  startTime: string;
  equipment: string[];
  visits: Visit[];
};
export type VisitResult = {
  visit: Visit;
  place: Place;
  policy: Policy;
  status: Status;
  findings: Finding[];
  arrival: number | null;
  departure: number | null;
  travelMinutes: number | null;
  walkingMinutes: number | null;
};
export type TripResult = {
  mode: TripInput["mode"];
  verifiedAt: string;
  rulesVersion: string;
  visits: VisitResult[];
  totalTravel: number | null;
  totalWalking: number | null;
  travelBasis: "demo" | "kakao" | "unavailable";
};
export const statusLabels: Record<Status, string> = {
  available: "이용 가능",
  prepare: "준비 필요",
  confirm: "확인 필요",
  blocked: "이용 불가",
};
export const equipmentOptions = [
  "목줄",
  "배변봉투",
  "이동장",
  "유모차",
  "입마개",
  "예약",
  "추가요금",
];
