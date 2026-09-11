import { test } from "node:test";
import assert from "node:assert/strict";
import { ktoSource } from "../../src/infrastructure/kto/source.ts";
const envelope = (item: unknown) => ({
  response: { header: { resultCode: "0000" }, body: { items: { item } } },
});
test("KTO searches supported content types before truncating results", async () => {
  const types: string[] = [];
  const source = ktoSource("fake", async (input) => {
    const type = new URL(String(input)).searchParams.get("contentTypeId");
    assert.ok(type);
    types.push(type);
    return Response.json(
      envelope(
        type === "12"
          ? [{ contentid: "123", contenttypeid: "12", title: "합성 공원" }]
          : [],
      ),
    );
  });
  assert.equal((await source.search("지역"))[0].name, "합성 공원");
  assert.deepEqual(types.sort(), ["12", "14", "28", "39"]);
  types.length = 0;
  await source.search("카페", "카페");
  assert.deepEqual(types, ["39"]);
});
