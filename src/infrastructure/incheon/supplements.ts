import { z } from "zod";
import snapshot from "../../../data/incheon/municipal-20260119.json" with { type: "json" };
import type { PolicySupplementSource } from "../../application/ports/providers.ts";

const data = z
  .object({
    sourceUrl: z.url(),
    publishedAt: z.iso.date(),
    accessedAt: z.iso.date(),
    records: z.array(
      z.object({
        ktoId: z.string(),
        rowNumber: z.number().int(),
        expectedNames: z.array(z.string()),
        roadAddress: z.string(),
        fields: z.record(z.string(), z.string()),
      }),
    ),
  })
  .parse(snapshot);
const normalize = (value: string) => value.replace(/\s/g, "");
const fields = [
  "반려동물 동행시 이용 가능 공간(실내_실외)",
  "입장 가능 반려동물 제한사항",
  "이용료",
  "기타 특이사항",
  "이용시간",
  "휴무",
];

export function incheonSupplements(now = new Date()): PolicySupplementSource {
  return {
    find(place) {
      const result: ReturnType<PolicySupplementSource["find"]> = {
        documents: [],
        notices: [],
        warnings: [],
      };
      const record = data.records.find((r) => r.ktoId === place.id);
      if (!record || place.source !== "kto") return result;
      // Annual publication deadline is a review gate, not proof of current venue policy.
      if (now.toISOString().slice(0, 10) >= "2027-01-19") {
        result.warnings.push(
          "인천시 보완 자료의 연간 갱신 예정일이 지나 재검수가 필요해요.",
        );
        return result;
      }
      // Reviewed ID AND name AND street/house number; no fuzzy cross-branch joins.
      const address = normalize(place.address);
      const [street, number] = record.roadAddress.split(" ");
      const escapedStreet = street.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sameRoad = new RegExp(
        `(?:^|\\s)${escapedStreet}\\s*${number}(?![\\d-])`,
      ).test(place.address);
      if (
        !record.expectedNames.some(
          (n) => normalize(n) === normalize(place.name),
        ) ||
        !/^인천/.test(address) ||
        !sameRoad
      ) {
        result.warnings.push(
          "인천시 보완 자료와 현재 장소의 이름·주소가 달라 자동 연결을 중단했어요.",
        );
        return result;
      }
      const raw = fields
        .filter((key) => record.fields[key]?.trim())
        .map((key) => `${key}: ${record.fields[key].trim()}`)
        .join("\n");
      const label = `출처: 인천광역시 반려동물 동반 관광지 목록 (${record.rowNumber}행)`;
      const evidence = {
        label,
        url: data.sourceUrl,
        publishedAt: data.publishedAt,
        accessedAt: data.accessedAt,
        phone: record.fields["전화번호"]?.trim() || null,
        raw,
      };
      result.documents.push({
        place,
        raw,
        modifiedAt: data.publishedAt,
        fetchedAt: data.accessedAt,
        sourceUrl: data.sourceUrl,
        sourceLabel: label,
        evidence,
      });
      if (place.id === "2767886")
        result.notices.push({
          startDate: "2026-09-12",
          endDate: "2026-09-12",
          message: "송도 도그파크는 행사로 2026년 9월 12일 휴장해요.",
          quote: "휴장일: 2026년 9월 12일(토)",
          sourceUrl:
            "https://reserve.insiseol.or.kr/bbs/bbsMsgDetail.do?bcd=notice&msg_seq=573",
          sourceLabel: "인천시설공단 송도 도그파크 휴장 공지 (2026-09-07)",
          checkedAt: "2026-09-11",
        });
      return result;
    },
  };
}
