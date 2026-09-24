import { contactInputSchema } from "../../../application/contracts/contact.ts";
import { ContactDeliveryError } from "../../../application/ports/contact-delivery.ts";
import { resendContactDelivery } from "../../../infrastructure/email/resend-contact.ts";
import { verifyTurnstileToken } from "../../../infrastructure/turnstile/siteverify.ts";
import {
  getContactDeliveryConfig,
  getContactProtectionConfig,
} from "../../../config/server.ts";
import { errorResponse, inputJson, json } from "../../../server/http.ts";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const input = contactInputSchema.parse(await inputJson(request, 12_000));

    // Quietly absorb obvious bot submissions without spending email quota.
    if (input.website) return json({ ok: true }, 202);

    const protection = getContactProtectionConfig();
    if (protection.required) {
      if (!protection.secretKey) {
        return json(
          {
            error: "문의 보호 설정이 아직 준비되지 않았어요.",
            code: "SETUP_REQUIRED",
          },
          503,
        );
      }
      if (
        !input.turnstileToken ||
        !(await verifyTurnstileToken(input.turnstileToken, protection.secretKey))
      ) {
        return json(
          {
            error: "사람 확인을 완료한 뒤 다시 시도해 주세요.",
            code: "BOT_CHECK_FAILED",
          },
          400,
        );
      }
    }

    let deliveryConfig;
    try {
      deliveryConfig = getContactDeliveryConfig();
    } catch {
      throw new ContactDeliveryError("setup");
    }
    await resendContactDelivery(deliveryConfig).send(input);
    return json({ ok: true }, 202);
  } catch (error) {
    if (error instanceof ContactDeliveryError) {
      if (error.code === "setup")
        return json(
          {
            error: "문의 발송 설정이 아직 준비되지 않았어요.",
            code: "SETUP_REQUIRED",
          },
          503,
        );
      if (error.code === "limit")
        return json(
          {
            error: "문의가 잠시 몰리고 있어요. 잠시 후 다시 시도해 주세요.",
            code: "CONTACT_LIMIT",
          },
          429,
        );
      return json(
        {
          error: "문의가 전송되지 않았어요. 잠시 후 다시 시도해 주세요.",
          code: "CONTACT_UNAVAILABLE",
        },
        502,
      );
    }
    if (error instanceof z.ZodError)
      return json(
        {
          error: "이메일과 문의 내용을 확인해 주세요.",
          code: "INVALID_INPUT",
        },
        400,
      );
    return errorResponse(error);
  }
}
