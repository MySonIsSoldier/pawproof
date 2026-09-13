import type { AccountProfile } from "../contracts/profile";
export interface ProfileRepository {
  get(uid: string): Promise<AccountProfile>;
  save(uid: string, profile: AccountProfile): Promise<AccountProfile>;
}
