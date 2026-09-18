import { z } from "zod";
const date = z
  .string()
  .regex(/^20\d{2}-\d{2}-\d{2}$/)
  .refine((value) => {
    const time = Date.parse(`${value}T00:00:00Z`);
    return (
      Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === value
    );
  }, "올바른 날짜를 입력해 주세요.");
export const visitSchema = z
  .object({
    placeId: z.string().regex(/^(demo-[a-z-]+|mfds-\d+|\d{1,12})$/),
    duration: z.number().int().min(15).max(240),
    zone: z.enum(["indoor", "outdoor"]),
    locked: z.boolean(),
  })
  .strict();
export const tripSchema = z
  .object({
    mode: z.enum(["demo", "live"]),
    pets: z
      .array(
        z
          .object({
            name: z.string().trim().min(1).max(20),
            breed: z.string().trim().min(1).max(40),
            weight: z.number().min(0.1).max(120),
          })
          .strict(),
      )
      .min(1)
      .max(5),
    date,
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    equipment: z
      .array(z.enum(["목줄", "이동장", "유모차", "입마개", "예약", "추가요금"]))
      .max(6),
    visits: z.array(visitSchema).min(1).max(5),
  })
  .strict()
  .superRefine((trip, ctx) => {
    if (new Set(trip.visits.map((v) => v.placeId)).size !== trip.visits.length)
      ctx.addIssue({
        code: "custom",
        message: "같은 장소를 중복해서 담을 수 없어요.",
        path: ["visits"],
      });
    if (
      trip.visits.some((v) =>
        trip.mode === "demo"
          ? !v.placeId.startsWith("demo-")
          : v.placeId.startsWith("demo-"),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "가상 체험과 실제 장소를 같은 코스에 섞을 수 없어요.",
        path: ["visits"],
      });
  });
export const recoverySchema = z
  .object({ trip: tripSchema, index: z.number().int().min(0).max(4) })
  .strict()
  .refine(
    ({ trip, index }) =>
      index < trip.visits.length && !trip.visits[index].locked,
    "고정한 방문지는 교체할 수 없어요.",
  );
