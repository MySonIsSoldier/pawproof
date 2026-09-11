import offlineFont from "../../assets/fonts/offline-font.json";

/** Self-contained public fallback. No Next chunks, external fonts or trip snapshots. */
export function offlineDocument(planUrl: string): string {
  const href = planUrl
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
  return `<!doctype html>
<html lang="ko" data-pawproof-offline="true"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2f6b50"><title>연결을 기다리고 있어요 | PawProof</title>
<style>
@font-face{font-family:PawProofOffline;src:url(data:font/woff2;base64,${offlineFont.base64}) format("woff2");font-weight:100 900;font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#fafbf7;color:#193d30;font-family:PawProofOffline,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;line-height:1.7;word-break:keep-all}main{max-width:560px;margin:12vh auto;padding:36px 24px;text-align:center}.mark{display:grid;place-items:center;width:76px;height:76px;background:#eaf0e9;border-radius:24px;margin:0 auto 32px;color:#2f6b50}small{color:#2f6b50;letter-spacing:2px}h1{font-size:clamp(25px,6vw,34px);line-height:1.45;letter-spacing:-1px}p{color:#5b6e63}.note{margin:28px 0;padding:22px;border:1px dashed #b3cbb9;border-radius:18px;text-align:left}a{display:inline-block;background:#2f6b50;color:white;text-decoration:none;border-radius:50px;padding:14px 28px}a:focus-visible{outline:3px solid #2f6b50;outline-offset:4px}footer{margin-top:38px;font-size:13px;color:#5b6e63}
</style></head><body><main id="main">
<div class="mark"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v9m0 5v1M4 7a10 10 0 0 1 16 0M7 10a6 6 0 0 1 10 0"/></svg></div>
<small>PAWPROOF · TRAVEL NOTE</small><h1>연결을 기다리고 있어요.</h1><p>인터넷 연결을 확인한 뒤<br>우리의 여행 노트를 다시 열어주세요.</p>
<div class="note"><strong>동반 조건은 최신 정보로 확인해요.</strong><p>오프라인에서는 장소 검색과 코스 검사를 할 수 없어요. 이전 규정을 대신 보여드리지 않아요.</p><p>‘이 기기에 저장’한 여행 입력은 이 브라우저에 남아 있어요. 연결 후 여행 노트에서 불러와 주세요.</p></div>
<a href="${href}">여행 노트 다시 열기</a><footer>작은 발걸음도, 여행의 끝까지. PawProof</footer>
</main></body></html>`;
}
