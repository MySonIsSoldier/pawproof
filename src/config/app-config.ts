import { parseBasePath } from "../lib/urls/path.ts";
import { parseOrigin } from "../lib/urls/origin.ts";

export type Environment = Readonly<Record<string, string | undefined>>;
export type AppEnvironment = "local" | "code-server" | "preview" | "production";
export type RuntimeMode = "development" | "production";

export interface AppConfig {
  readonly appEnv: AppEnvironment;
  readonly basePath: string;
  readonly origin?: string;
  readonly port: number;
  readonly allowedDevOrigins: readonly string[];
}

function parseAppEnvironment(value: string): AppEnvironment {
  switch (value) {
    case "local": case "code-server": case "preview": case "production": return value;
    default: throw new Error("APP_ENV must be local, code-server, preview, or production.");
  }
}

function parsePort(value = "3000"): number {
  if (!/^[0-9]+$/u.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return Number(value);
}

function parseDevHosts(value: string): string[] {
  return [...new Set(value.split(",").map((host) => host.trim()).filter(Boolean))].map((host) => {
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$/u.test(host) || host.includes("..")) {
      throw new Error("DEV_ALLOWED_HOSTS must list hostnames without schemes, ports, paths, or wildcards.");
    }
    return host.toLowerCase();
  });
}

/** Read only the app's allowlisted configuration; never return the source env. */
export function resolveAppConfig(env: Environment, mode: RuntimeMode): AppConfig {
  const platformEnv = env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production" ? env.VERCEL_ENV : undefined;
  const appEnv = parseAppEnvironment(env.APP_ENV || platformEnv || (mode === "development" ? "local" : "production"));
  const port = parsePort(env.PORT || undefined);
  const basePath = parseBasePath(env.APP_BASE_PATH ?? (appEnv === "code-server" ? `/absproxy/${port}` : ""));

  if ((appEnv === "preview" || appEnv === "production") && basePath) {
    throw new Error("Preview and production must be built with an empty APP_BASE_PATH.");
  }
  if (appEnv === "code-server" && !basePath.endsWith(`/absproxy/${port}`)) {
    throw new Error("code-server APP_BASE_PATH must end with /absproxy/PORT and match the server port.");
  }
  if (env.NEXT_PUBLIC_APP_BASE_PATH !== undefined && env.NEXT_PUBLIC_APP_BASE_PATH !== basePath) {
    throw new Error("Do not configure NEXT_PUBLIC_APP_BASE_PATH separately from APP_BASE_PATH.");
  }

  let originValue = env.APP_ORIGIN || undefined;
  if (!originValue && appEnv === "preview" && env.VERCEL_URL) originValue = `https://${env.VERCEL_URL}`;
  if (!originValue && appEnv === "code-server" && env.VSCODE_PROXY_URI) {
    // code-server supplies this trusted process setting; do not infer from request headers.
    try { originValue = new URL(env.VSCODE_PROXY_URI.replaceAll("{{port}}", String(port))).origin; }
    catch { throw new Error("VSCODE_PROXY_URI is invalid; set APP_ORIGIN explicitly."); }
  }
  const origin = originValue ? parseOrigin(originValue) : undefined;
  const allowedDevOrigins = parseDevHosts(env.DEV_ALLOWED_HOSTS || (origin ? new URL(origin).hostname : ""));
  if (appEnv === "code-server" && mode === "development" && allowedDevOrigins.length === 0) {
    throw new Error("Set APP_ORIGIN or DEV_ALLOWED_HOSTS for the code-server host.");
  }
  return { appEnv, port, basePath, origin, allowedDevOrigins: mode === "development" ? allowedDevOrigins : [] };
}
