import type { ContactInput } from "../contracts/contact.ts";

export interface ContactDelivery {
  send(input: ContactInput): Promise<void>;
}

export class ContactDeliveryError extends Error {
  readonly code: "setup" | "unavailable" | "limit";

  constructor(code: "setup" | "unavailable" | "limit") {
    super(`Contact delivery ${code}`);
    this.name = "ContactDeliveryError";
    this.code = code;
  }
}
