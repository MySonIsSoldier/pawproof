"use client";

import Image from "next/image";
import { useState } from "react";
import { apiPath, publicAssetPath } from "@/config/public";

export function EnvironmentCheck() {
  const [completed, setCompleted] = useState(0);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function checkApi() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch(apiPath("/api/health"), { cache: "no-store", signal: AbortSignal.timeout(5000) });
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== "object" || !("status" in body) || body.status !== "ok") {
        throw new Error("Health response is invalid.");
      }
      setCompleted((count) => count + 1);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <h1>개발 환경 점검</h1>
      <Image src={publicAssetPath("/fixtures/path-check.svg")} alt="경로 확인 이미지" width={48} height={48} />
      <p>페이지·자산·브라우저 API 연결을 점검합니다. 외부 서비스 연결은 검사하지 않습니다.</p>
      <button onClick={checkApi} disabled={pending}>API 연결 확인</button>
      <p role="status">{failed ? "API 연결 실패" : `API 정상 응답 ${completed}회`}</p>
    </section>
  );
}
