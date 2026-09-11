# API 연결 계약

2026-09-11 · 사용자 키로 공급자 연결과 실제 3개 장소의 브라우저 흐름을 검증했다. 범위·오류 수정·데이터 한계는 [실측 기록](../delivery/LIVE_VALIDATION_2026-09-11.md), 재실행은 [실 API 검사](LIVE_VALIDATION.md)를 따른다.

## 서버 환경 설정

저장소 루트 `.env.local` 또는 배포 플랫폼 서버 환경변수:

```dotenv
KTO_SERVICE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
KAKAO_MOBILITY_REST_KEY=
LIVE_SERVICES_ENABLED=false
```

KTO는 공공데이터포털 반려동물 동반여행 서비스의 **Decoding** 키. OpenRouter는 전용 키를 만들고 초기 누적 크레딧 상한 $5를 권고한다(서비스가 자동 설정하지 않음). 모델은 2026-09-11 공개 모델 목록에서 구조화 출력 지원을 확인한 Gemini 2.5 Flash를 초기값으로 선택했으며 한국어 표본 추출과 일부 예외 처리를 확인했다. 전국 데이터의 의미 정확도 평가는 남아 있다. 키·한도 준비 후 LIVE_SERVICES_ENABLED=true로 변경하고 개발 서버 재시작/배포 환경 재배포. 값 자체를 Git이나 채팅에 넣지 않는다.

카카오는 Kakao Developers REST API 키와 자동차 길찾기 사용 권한이 필요하다. 브라우저 지도 SDK 키는 이번 버전에서 필요하지 않다. 지도 대신 방문 순서 노선도를 제공하고, 실제 도로 이동시간만 서버에서 조회한다. 현재 교통 기준 조회이며 미래 여행일의 교통 예측값이 아니다.

Firestore는 이번 비로그인 핵심 흐름의 선행 조건이 아니다. 사용자 편집 입력만 선택적으로 브라우저에 저장하며 규정·결과 원문은 저장하지 않는다.

## 외부 경로

- KTO: `https://apis.data.go.kr/B551011/KorPetTourService2`의 searchKeyword2, locationBasedList2, detailCommon2, detailPetTour2, detailIntro2. 실호출 성공을 확인했다. 필드 누락은 허용으로 해석하지 않는다. 이름 검색은 지원 contentTypeId별로 조회한 후 최대 20곳을 표시한다. 인천/인천광역시는 areaBasedList2의 lDongRegnCd=28 지역 검색으로 최대 100곳을 반환한다. 신규 lclsSystm2가 있으면 우선하여 카페를 분류한다. 전체 검색 최대 4회, 관광지 3회, 식당/카페 1회 요청이며 동시 요청은 2개다. ID·주소·좌표·업종은 어댑터에서 변환한다.
- OpenRouter: https://openrouter.ai/api/v1/chat/completions. strict JSON schema, require_parameters, 데이터 수집 거부, 출력 3500토큰 상한, 35초 제한, 자동 재시도 없음. Gemini의 생성 복잡도 제한에 맞춰 전달 스키마의 길이·수치 경계를 단순화하되 서버의 원래 Zod 제약과 근거 검증을 유지한다. 규정 원문 14000자 초과는 잘라서 확정하지 않고 추출 실패 처리.
- Kakao: https://apis-navi.kakaomobility.com/v1/directions. summary=true, 초를 분으로 올림, 실패 또는 좌표 누락은 미확인.

한 검증의 최대 방문지 5, 동시 작업자 2, 대체 후보 최대 3. 대체 요청 안에서만 조회/추출/구간 응답을 재사용하며 요청 간 원문·규정 캐시는 없다. 한 개 장소 조회·추출 실패는 확인 필요로 보존하고 나머지를 처리한다. 미래 방문일의 특별 영업·휴게시간·입장마감 등 지원 불가 표현은 unresolved에 남긴다.

## HTTP

- GET /api/places?mode=demo|live&q=...&category=관광지|식당|카페
- POST /api/verify: TripInput → TripResult
- POST /api/recover: {trip, index} → {alternatives, inspected}

POST 바디 24000바이트, JSON만 허용, 입력 스키마 검증. 응답은 no-store. 자격증명이나 공급자 원본 오류는 반환/로깅하지 않는다. 실제 모드 설정 부족은 503 SETUP_REQUIRED. 실제 모드를 자동으로 가상 모드로 바꾸지 않는다.

## 실측 필요

API 연결·지원 필드, 음식점/카페 분류, 규정 의미 정확도, 관광 권역 후보 밀도, 호출 시간과 비용, 심사 환경 가용성. 구조화 출력·원문 구절 일치는 의미 정확성의 보장이 아니다. 키 없는 테스트 통과를 공모전 필수 API 사용 완료로 표시하지 않는다.

## 공식 참고

- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [OpenRouter models](https://openrouter.ai/api/v1/models)
- [카카오 자동차 길찾기](https://developers.kakaomobility.com/guide/navi-api/directions)
- [Zod schema API](https://zod.dev/api)

## 인천 보완 연결

실제 모드의 추출기는 enrichedExtractor로 조립한다. KTO 원문과 검수한 인천시 행을 각각 추출한 뒤 출처·구역별 규정을 비교한다. 연결된 유효 원문당 모델 호출 1회가 추가되며 서버 원문 캐시는 없다. 개별 규칙의 근거·의미 검증 실패는 확인 필요 사유와 함께 부분 보존하고, 전체 스키마 실패는 추출 실패다. 날짜 휴장·연락처·출처별 원문은 결과 DTO에 포함하지만 사용자 입력 저장에는 포함하지 않는다. [인천 데이터 기준](../data/INCHEON_COVERAGE.md)을 따른다.
