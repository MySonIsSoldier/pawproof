import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseKtoItems,
  ktoSource,
} from "../../src/infrastructure/kto/source.ts";
import { openRouterExtractor } from "../../src/infrastructure/llm/extractor.ts";
import { kakaoTravel } from "../../src/infrastructure/kakao/travel.ts";
import {
  fetchJson,
  readJson,
} from "../../src/infrastructure/http/fetch-json.ts";
import {
  demoPlaces,
  demoPolicy,
  demoProviders,
  createDemoTrip,
} from "../../src/infrastructure/demo/catalog.ts";
import { verifyTrip } from "../../src/application/use-cases/verify-trip.ts";
import { validateExtraction } from "../../src/application/contracts/policy.ts";
import { resultSchema } from "../../src/application/contracts/result.ts";
const envelope = (item: unknown) => ({
  response: { header: { resultCode: "0000" }, body: { items: { item } } },
});
test("KTO supports single and multiple items, empty results and error codes", () => {
  assert.equal(parseKtoItems(envelope({ title: "테스트" })).length, 1);
  assert.equal(parseKtoItems(envelope([])).length, 0);
  assert.equal(
    parseKtoItems({
      response: { header: { resultCode: "0000" }, body: { items: "" } },
    }).length,
    0,
  );
  assert.throws(() =>
    parseKtoItems({ response: { header: { resultCode: "22" } } }),
  );
});
test("KTO uses decoding key exactly once and gathers operating and pet rules", async () => {
  const calls: URL[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    assert.equal(url.searchParams.get("serviceKey"), "test/+==");
    assert.equal(init?.cache, "no-store");
    if (url.pathname.endsWith("detailCommon2"))
      return Response.json(
        envelope({
          contentid: "123",
          contenttypeid: "39",
          title: "합성 식당",
          mapx: "126.6",
          mapy: "37.4",
        }),
      );
    if (url.pathname.endsWith("detailPetTour2"))
      return Response.json(envelope({ acmpyNeedMtr: "목줄 필수<br>이동장" }));
    return Response.json(envelope({ opentimefood: "10:00~18:00" }));
  };
  const source = await ktoSource("test/+==", fetcher).get("123");
  assert.match(source.raw, /목줄 필수\n이동장/);
  assert.match(source.raw, /10:00~18:00/);
  assert.equal(calls.length, 3);
});
test("LLM request has schema, budget and no user profile; validates evidence", async () => {
  const policy = demoPolicy("demo-table");
  const fetcher: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.type, "json_schema");
    const schema = body.response_format.json_schema.schema;
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.includes("rules"));
    assert.doesNotMatch(
      JSON.stringify(schema),
      /"(?:maxItems|minItems|maxLength|minLength|minimum|maximum)":/,
    );
    assert.equal(body.provider.require_parameters, true);
    assert.equal(body.max_tokens, 3500);
    assert.ok(!body.messages[1].content.includes('"pets"'));
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({ rules: policy.rules, unresolved: [] }),
          },
        },
      ],
    });
  };
  const result = await openRouterExtractor(
    { apiKey: "fake", model: "test" },
    fetcher,
  ).extract({ ...policy, place: demoPlaces[1] });
  assert.equal(result.rules.length, 7);
  assert.ok(!("place" in result));
  const fabricated: typeof fetch = async () =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              rules: [{ ...policy.rules[0], quote: "fabricated" }],
              unresolved: [],
            }),
          },
        },
      ],
    });
  await assert.rejects(
    openRouterExtractor({ apiKey: "fake", model: "test" }, fabricated).extract({
      ...policy,
      place: demoPlaces[1],
    }),
  );
});
test("provider schema simplification never relaxes server output bounds", () => {
  const policy = demoPolicy("demo-table");
  assert.throws(() =>
    validateExtraction(
      { rules: Array(41).fill(policy.rules[0]), unresolved: [] },
      policy.raw,
    ),
  );
  assert.throws(() =>
    validateExtraction(
      { rules: [{ ...policy.rules[0], value: 1441 }], unresolved: [] },
      policy.raw,
    ),
  );
  assert.throws(() =>
    validateExtraction(
      { rules: [], unresolved: ["x".repeat(301)] },
      policy.raw,
    ),
  );
});
test("upstream error cannot expose a key or return arbitrary HTML", async () => {
  await assert.rejects(
    fetchJson("https://example.test/?secret=test-key", {}, async () => {
      throw new Error("https://example.test/?secret=test-key");
    }),
    (error: Error) => !error.message.includes("test-key"),
  );
  await assert.rejects(
    fetchJson(
      "https://example.test",
      {},
      async () => new Response("<html>error</html>"),
    ),
  );
  await assert.rejects(
    readJson(new Response('"' + "a".repeat(50) + '"').body, 20),
  );
});
test("driving duration uses seconds and unknown coordinates return null", async () => {
  const travel = kakaoTravel("fake", async () =>
    Response.json({ routes: [{ result_code: 0, summary: { duration: 601 } }] }),
  );
  assert.equal(await travel.minutes(demoPlaces[0], demoPlaces[1]), 11);
  assert.equal(
    await travel.minutes({ ...demoPlaces[0], lat: 0 }, demoPlaces[1]),
    null,
  );
});
test("one source failure preserves successful neighboring place results", async () => {
  const providers = demoProviders();
  const get = providers.places.get;
  providers.places.get = (id) =>
    id === "demo-table" ? Promise.reject(new Error("source down")) : get(id);
  const result = await verifyTrip(createDemoTrip(), providers);
  assert.equal(result.visits[0].status, "available");
  assert.equal(result.visits[1].status, "confirm");
  assert.doesNotThrow(() => resultSchema.parse(result));
});
