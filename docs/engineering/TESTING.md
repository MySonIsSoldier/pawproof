# 검증 실행 안내

2026-09-11 · 제품 기능 검증은 실제 외부 서비스 호출과 분리한다.

## 한 번에 실행

```bash
pnpm verify
```

단위 테스트, ESLint, TypeScript, Playwright 직접 개발/프록시 개발/운영 빌드를 순서대로 실행한다. 두 개발 서버를 같은 .next/dev에 동시에 실행하지 않는다. Linux/code-server에서 이 프로젝트가 관리하는 preview PID만 명령·작업 경로를 확인한 뒤 중지하고, 종료 시 복원한다. 임의 사용자 서버나 IDE 본체를 종료하지 않는다.

모든 E2E 서버에는 LIVE_SERVICES_ENABLED=false를 주입하므로 유료 API나 실제 KTO를 호출하지 않는다. 모델·KTO·Kakao 단위 검사는 함수 인자로 전달한 합성 HTTP 응답을 사용한다. 실제 서비스 연결 검사와 구분한다.

## 설치 환경

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

OCI에서 기존 /tmp/ms-playwright와 /tmp/pawproof-browser-libs가 있으면 verify 실행기가 브라우저·공유 라이브러리 경로를 자동 지정한다. 다른 환경에는 Playwright Chromium 시스템 의존성이 필요하다. 임시 경로가 삭제되면 브라우저/시스템 의존성을 다시 준비한다.

/app/code-server/bin/code-server가 있으면 127.0.0.1:8444에 임시 프록시를 실행해 /absproxy/3101을 실제 경유한다. 테스트 전용 루프백 프록시만 인증 없이 실행하며 외부 IDE의 인증 설정은 바꾸지 않는다. 바이너리가 없으면 Next basePath 직접 검증으로 대체되었다는 메시지를 출력한다.

## 검사 범위

- 정책 10kg 이하/미만, 개체와 일행, AND/OR, 구역, 누락, 일정·고정 방문 보존, 실패 처리.
- 원문 근거가 없는 LLM 결과 거부, KTO JSON 및 비정상 HTML/XML 응답·빈 목록, 초/분 변환, 입력 바디 크기와 키 포함 오류 제거.
- 데스크톱 1440×1000, 모바일 390×844, 한국어/Asia-Seoul 시간 설정.
- 홈·폰트·사진·FAQ·CTA, 방문지/반려견 편집, 검색/빈 결과, 네 상태와 원문 dialog.
- 프로필 수정 뒤 이전 결과 표시, 대체 후보·적용·되돌리기, 준비물·문의 문구·기기 저장/삭제.
- 인쇄 시 여행 날짜/반려견 정보와 결과 유지, 모바일 고정 검사 버튼 숨김.
- 실제 모드 준비 부족, 잘못된 입력 거부, 공급자 장애 후 재시도.
- CSS/JS/MIME/새로고침/API, 개발 WebSocket·HMR 상태 유지, 운영에서 dev/check 404.

HMR 검사는 개발 컴포넌트의 제목을 잠시 바꾸고 finally에서 복원한다. 테스트 중 해당 파일을 직접 수정하거나 여러 테스트 모드를 동시에 실행하지 않는다.

## 결과 파일

- playwright-report/direct/index.html
- playwright-report/proxy/index.html
- playwright-report/production/index.html
- test-results/<mode>/ 아래 홈/결과 스크린샷과 실패 trace

리포트와 임시 프록시 로그는 Git에 올리지 않는다. 성공 시에도 홈과 결과 화면 스크린샷을 남긴다. 실제 외부 HTTPS 로그인 경유, Vercel 배포, 실키 연결·정확도·비용은 이 검사 결과에 포함되지 않는다.

## 일부만 재검사

```bash
pnpm test
pnpm test:e2e --project=mobile --grep 'complete trip'
E2E_MODE=proxy pnpm test:e2e
pnpm exec playwright show-report playwright-report/production
```

pnpm test:e2e를 직접 실행할 때는 해당 환경의 브라우저 경로를 설정한다. pnpm verify는 이 OCI 환경의 임시 경로를 자동으로 찾아준다.
