import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contactCategoryLabels,
  contactInputSchema,
} from "../../src/application/contracts/contact.ts";
import { resendContactDelivery } from "../../src/infrastructure/email/resend-contact.ts";
import { verifyTurnstileToken } from "../../src/infrastructure/turnstile/siteverify.ts";

const validInput = {
  email: "traveler@example.com",
  category: "data" as const,
  message: "파주 장소 정보의 운영 조건을 확인하고 싶어요.",
  website: "",
  turnstileToken: "turnstile-token",
};

test("contact input keeps bounded, user-facing fields", () => {
  const parsed = contactInputSchema.parse(validInput);
  assert.equal(parsed.email, validInput.email);
  assert.equal(contactCategoryLabels[parsed.category], "장소·동반 정보");
  assert.throws(() =>
    contactInputSchema.parse({ ...validInput, message: "짧은 글" }),
  );
  assert.throws(() =>
    contactInputSchema.parse({ ...validInput, email: "not-an-email" }),
  );
});

test("Resend contact delivery fixes the sender and uses Reply-To", async () => {
  let request: RequestInit | undefined;
  await resendContactDelivery(
    {
      apiKey: "resend-test-key",
      recipientEmail: "ohsong656565@gmail.com",
      fromEmail: "contact@pawproof.kr",
    },
    async (_url, init) => {
      request = init;
      return Response.json({ id: "email-test-id" });
    },
  ).send(validInput);

  assert.equal(request?.method, "POST");
  assert.equal(
    (request?.headers as Record<string, string>).Authorization,
    "Bearer resend-test-key",
  );
  const body = JSON.parse(String(request?.body));
  assert.deepEqual(body.to, ["ohsong656565@gmail.com"]);
  assert.deepEqual(body.reply_to, ["traveler@example.com"]);
  assert.equal(body.from, "PawProof <contact@pawproof.kr>");
  assert.match(body.text, /파주 장소 정보/u);
  assert.doesNotMatch(body.html, /<script/iu);
});

test("Turnstile server verification fails closed and accepts success", async () => {
  const calls: RequestInit[] = [];
  const success = await verifyTurnstileToken(
    "token",
    "secret",
    async (_url, init) => {
      calls.push(init ?? {});
      return Response.json({ success: true });
    },
  );
  const rejected = await verifyTurnstileToken(
    "token",
    "secret",
    async () => Response.json({ success: false }),
  );
  const malformed = await verifyTurnstileToken(
    "token",
    "secret",
    async () => Response.json({ success: "yes" }),
  );

  assert.equal(success, true);
  assert.equal(rejected, false);
  assert.equal(malformed, false);
  assert.equal(calls.length, 1);
  assert.match(String(calls[0].body), /"secret":"secret"/u);
});
