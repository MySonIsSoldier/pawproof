import "server-only";

function requiredValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

/** Resolve lazily so the app can build before external providers are connected. */
export function getOpenRouterConfig() {
  return {
    apiKey: requiredValue("OPENROUTER_API_KEY"),
    model: requiredValue("OPENROUTER_MODEL"),
  };
}

export function getKtoConfig() {
  return { serviceKey: requiredValue("KTO_SERVICE_KEY") };
}

export function getLiveConfig() {
  return { enabled: process.env.LIVE_SERVICES_ENABLED === "true", kakaoKey: process.env.KAKAO_MOBILITY_REST_KEY?.trim() || "" };
}

export function getContactDeliveryConfig() {
  return {
    apiKey: requiredValue("RESEND_API_KEY"),
    recipientEmail:
      process.env.CONTACT_RECIPIENT_EMAIL?.trim() || "ohsong656565@gmail.com",
    fromEmail: requiredValue("CONTACT_FROM_EMAIL"),
  };
}

export function getContactProtectionConfig() {
  return {
    required:
      process.env.CONTACT_REQUIRE_TURNSTILE === "true" ||
      (process.env.APP_ENV === "production" &&
        process.env.CONTACT_REQUIRE_TURNSTILE !== "false"),
    secretKey: process.env.TURNSTILE_SECRET_KEY?.trim() || "",
  };
}
