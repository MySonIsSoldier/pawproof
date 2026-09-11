import "server-only";
import type { Providers } from "../application/ports/providers.ts";
import { demoProviders } from "../infrastructure/demo/catalog.ts";
import { ktoSource } from "../infrastructure/kto/source.ts";
import { openRouterExtractor } from "../infrastructure/llm/extractor.ts";
import { kakaoTravel } from "../infrastructure/kakao/travel.ts";
import { getKtoConfig, getOpenRouterConfig, getLiveConfig } from "../config/server.ts";
export class SetupRequired extends Error {}
export function createProviders(mode: "demo" | "live", searchOnly = false): Providers {
  if (mode === "demo") return demoProviders();
  try {
    const config = getLiveConfig();
    if (!config.enabled) throw new Error("disabled");
    return { places: ktoSource(getKtoConfig().serviceKey), extractor: searchOnly ? { extract: async () => { throw new Error("Search only"); } } : openRouterExtractor(getOpenRouterConfig()), travel: config.kakaoKey ? kakaoTravel(config.kakaoKey) : { basis: "unavailable", minutes: async () => null } };
  } catch { throw new SetupRequired("실제 장소 연결을 준비 중이에요. 지금은 가상 체험 코스로 검사 과정을 살펴볼 수 있어요."); }
}
