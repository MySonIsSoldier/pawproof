import type { SavedTrip, SaveTripInput } from "../contracts/saved-trip.ts";
export interface TripRepository {
  list(ownerId: string): Promise<SavedTrip[]>;
  save(ownerId: string, id: string, input: SaveTripInput): Promise<SavedTrip>;
  remove(ownerId: string, id: string, expectedRevision: number): Promise<void>;
}
export class AccountError extends Error {
  constructor(
    public code:
      | "UNAUTHORIZED"
      | "VERIFY_EMAIL"
      | "UNAVAILABLE"
      | "CONFLICT"
      | "LIMIT"
      | "NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}
