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
