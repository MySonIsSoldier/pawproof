import { test } from "node:test";
import assert from "node:assert/strict";
import { ktoSource } from "../../src/infrastructure/kto/source.ts";
const envelope = (item: unknown) => ({
  response: { header: { resultCode: "0000" }, body: { items: { item } } },
});
test("Incheon uses legal district codes and current cafe classification", async () => {
  const source = ktoSource("fake", async (input) => {
    const url = new URL(String(input));
    assert.ok(url.pathname.endsWith("areaBasedList2"));
    assert.equal(url.searchParams.get("lDongRegnCd"), "28");
    assert.equal(url.searchParams.get("areaCode"), null);
    return Response.json(
      envelope([
        {
          contentid: "456",
          contenttypeid: "39",
          title: "합성 카페",
          cat3: "",
          lclsSystm2: "FD05",
        },
      ]),
    );
  });
  assert.equal((await source.search("인천", "카페"))[0].category, "카페");
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
test("pilot scope uses addresses, excludes Namyangju, and deduplicates content IDs", async () => {
  const source = ktoSource("fake", async (input) => {
    const url = new URL(String(input));
    assert.ok(url.pathname.endsWith("areaBasedList2"));
    assert.equal(url.searchParams.get("lDongRegnCd"), "41");
    assert.equal(url.searchParams.get("numOfRows"), "100");
    return Response.json(
      envelope([
        {
          contentid: "1",
          contenttypeid: "12",
          title: "고양 공원",
          addr1: "경기 고양시 덕양구",
        },
        {
          contentid: "2",
          contenttypeid: "12",
          title: "파주 공원",
          addr1: "경기도 파주시 탄현면",
        },
        {
          contentid: "3",
          contenttypeid: "12",
          title: "양주 공원",
          addr1: "경기도 양주시 장흥면",
        },
        {
          contentid: "4",
          contenttypeid: "12",
          title: "남양주 공원",
          addr1: "경기도 남양주시 조안면",
        },
        { contentid: "5", contenttypeid: "12", title: "주소 미상" },
      ]),
    );
  });
  assert.deepEqual(
    (await source.search("경기 북서부")).map((p) => p.id),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    (await source.search("양주시")).map((p) => p.id),
    ["3"],
  );
});
test("a venue name containing a region stays a keyword search", async () => {
  const source = ktoSource("fake", async (input) => {
    const url = new URL(String(input));
    assert.ok(url.pathname.endsWith("searchKeyword2"));
    assert.equal(url.searchParams.get("keyword"), "고양 카페");
    return Response.json(envelope([]));
  });
  assert.deepEqual(await source.search("고양 카페", "카페"), []);
});
