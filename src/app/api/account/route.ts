import { z } from "zod";
import { accountDeletionSchema } from "../../../application/contracts/account";
import {
  accountErrorResponse,
  deleteAccount,
  requireAccount,
} from "../../../server/account";
import { inputJson, json } from "../../../server/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(request: Request) {
  try {
    const uid = await requireAccount(request, false);
    accountDeletionSchema.parse(await inputJson(request, 2_000));
    await deleteAccount(uid);
    return json({ deleted: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        {
          error: "계정 삭제 확인 문구를 정확히 입력해 주세요.",
          code: "INVALID_CONFIRMATION",
        },
        400,
      );
    return accountErrorResponse(error);
  }
}
