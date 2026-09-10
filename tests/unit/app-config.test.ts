import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAppConfig } from "../../src/config/app-config.ts";
import { assertBuildProfile, createBuildProfile } from "../../scripts/build-profile.ts";

test("root defaults work without any provider credentials", () => {
  assert.equal(resolveAppConfig({}, "development").appEnv, "local");
  const config = resolveAppConfig({}, "production");
  assert.equal(config.appEnv, "production");
  assert.equal(config.basePath, "");
  assert.equal(config.port, 3000);
});

test("code-server derives port path and origin from trusted IDE settings", () => {
  const config = resolveAppConfig({ APP_ENV: "code-server", PORT: "3200", VSCODE_PROXY_URI: "https://ide.example.com/proxy/{{port}}/" }, "development");
  assert.equal(config.basePath, "/absproxy/3200");
  assert.equal(config.origin, "https://ide.example.com");
  assert.deepEqual(config.allowedDevOrigins, ["ide.example.com"]);
});

test("explicit settings support a nested code-server path", () => {
  const config = resolveAppConfig({ APP_ENV: "code-server", APP_BASE_PATH: "/workspace/absproxy/3000/", APP_ORIGIN: "https://ide.example.com", DEV_ALLOWED_HOSTS: "ide.example.com, localhost,ide.example.com" }, "development");
  assert.equal(config.basePath, "/workspace/absproxy/3000");
  assert.deepEqual(config.allowedDevOrigins, ["ide.example.com", "localhost"]);
});

test("preview origin comes from the platform, with no proxy or secrets", () => {
  const config = resolveAppConfig({ VERCEL_ENV: "preview", VERCEL_URL: "pawproof-branch.example.com", OPENROUTER_API_KEY: "unit-test-sentinel", KTO_SERVICE_KEY: "unit-test-sentinel", DEV_ALLOWED_HOSTS: "ide.example.com" }, "production");
  assert.equal(config.origin, "https://pawproof-branch.example.com");
  assert.equal(config.basePath, "");
  assert.deepEqual(config.allowedDevOrigins, []);
  assert.ok(!JSON.stringify(config).includes("unit-test-sentinel"));
});

for (const env of [
  { APP_ENV: "unknown" },
  { PORT: "3000x" }, { PORT: "0" }, { PORT: "65536" }, { PORT: "3.5" },
  { APP_ENV: "production", APP_BASE_PATH: "/absproxy/3000" },
  { APP_ENV: "preview", APP_BASE_PATH: "/app" },
  { APP_ENV: "code-server", APP_BASE_PATH: "/proxy/3000", APP_ORIGIN: "https://ide.example.com" },
  { APP_ENV: "code-server", APP_BASE_PATH: "/absproxy/3001", PORT: "3000" },
  { APP_ENV: "code-server" },
  { NEXT_PUBLIC_APP_BASE_PATH: "/unexpected" },
  { DEV_ALLOWED_HOSTS: "https://ide.example.com" },
  { DEV_ALLOWED_HOSTS: "ide.example.com:3000" },
  { DEV_ALLOWED_HOSTS: "*.example.com" },
  { APP_ORIGIN: "https://example.com/path" },
]) {
  test(`invalid configuration fails early: ${Object.keys(env).join(",")}`, () => {
    assert.throws(() => resolveAppConfig(env, "development"));
  });
}

test("a different build profile cannot be served by changing runtime env", () => {
  const root = resolveAppConfig({}, "production");
  const proxy = resolveAppConfig({ APP_ENV: "code-server", APP_ORIGIN: "https://ide.example.com" }, "production");
  assert.doesNotThrow(() => assertBuildProfile(createBuildProfile(root), root));
  assert.throws(() => assertBuildProfile(createBuildProfile(proxy), root));
  assert.throws(() => assertBuildProfile(createBuildProfile(root), proxy));
  assert.throws(() => assertBuildProfile(null, root));
  assert.throws(() => assertBuildProfile({ version: 999 }, root));
});
