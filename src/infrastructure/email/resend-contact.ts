import { contactCategoryLabels } from "../../application/contracts/contact.ts";
import type { ContactDelivery } from "../../application/ports/contact-delivery.ts";
import { ContactDeliveryError } from "../../application/ports/contact-delivery.ts";
import { withRequestSignal } from "../../lib/http/request-signal.ts";

export interface ResendContactConfig {
  readonly apiKey: string;
  readonly recipientEmail: string;
  readonly fromEmail: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/gu,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function formatMessage(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

export function resendContactDelivery(
  config: ResendContactConfig,
  fetcher: typeof fetch = fetch,
): ContactDelivery {
  return {
    async send(input) {
      const category = contactCategoryLabels[input.category];
      const subject = `[PawProof 문의] ${category}`;
      const text = [
        `문의 유형: ${category}`,
        `답변받을 이메일: ${input.email}`,
        "",
        input.message,
      ].join("\n");
      const html = [
        `<p><strong>문의 유형</strong>: ${escapeHtml(category)}</p>`,
        `<p><strong>답변받을 이메일</strong>: ${escapeHtml(input.email)}</p>`,
        "<hr />",
        `<p>${formatMessage(input.message)}</p>`,
      ].join("");

      try {
        const response = await withRequestSignal(8_000, undefined, (signal) =>
          fetcher("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `PawProof <${config.fromEmail}>`,
              to: [config.recipientEmail],
              reply_to: [input.email],
              subject,
              text,
              html,
            }),
            cache: "no-store",
            redirect: "error",
            signal,
          }),
        );

        if (!response.ok) {
          await response.body?.cancel();
          throw new ContactDeliveryError(
            response.status === 429 ? "limit" : "unavailable",
          );
        }
        await response.body?.cancel();
      } catch (error) {
        if (error instanceof ContactDeliveryError) throw error;
        throw new ContactDeliveryError("unavailable");
      }
    },
  };
}
