import { z } from "zod";
import {
  inquiryCompletionSchema,
  inquiryInputSchema,
  inquiryResultSchema,
} from "../../../../application/contracts/discovery";
import { getOpenRouterConfig } from "../../../../config/server";
import { fetchJson } from "../../../../infrastructure/http/fetch-json";
import { errorResponse, inputJson, json } from "../../../../server/http";

export const maxDuration = 35;

function fallbackInquiry(input: z.infer<typeof inquiryInputSchema>) {
  const pets = input.pets
    .map((pet) => `${pet.breed} ${pet.weight}kg`)
    .join(", ");
  const questions = input.findings
    .filter((finding) => finding.status !== "available")
    .map((finding) => finding.message.trim())
    .filter(Boolean);
  return [
    "안녕하세요. 방문 가능 여부를 문의드려요.",
    "",
    `${input.date}에 ${input.place.name}에 ${input.zone === "indoor" ? "실내" : "야외/테라스"}로 반려견 ${input.pets.length}마리(${pets})와 방문하려고 합니다.`,
    "방문 전에 아래 내용을 확인 부탁드립니다.",
    ...(questions.length
      ? questions.map((question) => `- ${question}`)
      : ["- 반려견 동반 가능 여부와 필요한 준비사항"]),
    "",
    "가능 여부와 준비할 사항을 알려주시면 감사하겠습니다.",
  ].join("\n");
}

const system = `당신은 반려견 동반 장소에 문의할 한국어 메시지를 다듬는 도우미입니다. 사용자가 실제 매장에 보낼 수 있도록 예의 있고 자연스러운 구어체 한 개의 메시지를 작성하세요. 인사, 방문 예정일·장소·실내외 구분·반려견 정보, 확인할 질문, 감사 인사를 포함하세요. 제공된 확인사항만 사용하고 새로운 규정이나 가능 여부를 단정하지 마세요. '확인 필요' 내용은 질문형으로 바꾸고, 내부 필드명·영문 키·상태명·JSON·마크다운 제목은 출력하지 마세요. 메시지만 반환하세요.`;

async function openRouterInquiry(input: z.infer<typeof inquiryInputSchema>) {
  const config = getOpenRouterConfig();
  const response = await fetchJson(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "PawProof",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        max_tokens: 700,
        provider: {
          require_parameters: true,
          data_collection: "deny",
          max_price: { prompt: 1, completion: 3 },
        },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    },
    fetch,
    30_000,
  );
  const parsed = inquiryCompletionSchema.parse(response);
  const text = parsed.choices[0].message.content
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return z.string().min(20).max(3000).parse(text);
}

export async function POST(request: Request) {
  try {
    const parsed = inquiryInputSchema.safeParse(await inputJson(request, 18_000));
    if (!parsed.success)
      return json({ error: "문의 문구를 만들 장소와 반려견 정보를 확인해 주세요." }, 400);
    try {
      const text = await openRouterInquiry(parsed.data);
      return json(inquiryResultSchema.parse({ text, generatedBy: "openrouter" }));
    } catch {
      return json({
        text: fallbackInquiry(parsed.data),
        generatedBy: "fallback",
      });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
