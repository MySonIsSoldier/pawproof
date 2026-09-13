import type { SavedTrip, SaveTripInput } from "../contracts/saved-trip.ts";
export interface TripRepository {
  get(ownerId: string, id: string): Promise<SavedTrip>;
  list(ownerId: string): Promise<SavedTrip[]>;
  save(ownerId: string, id: string, input: SaveTripInput): Promise<SavedTrip>;
  remove(ownerId: string, id: string, expectedRevision: number): Promise<void>;
}
export class AccountError extends Error {
  code:
    | "UNAUTHORIZED"
    | "VERIFY_EMAIL"
    | "UNAVAILABLE"
    | "CONFLICT"
    | "LIMIT"
    | "NOT_FOUND";
  constructor(code: AccountError["code"], message: string) {
    super(message);
    this.code = code;
  }
}
