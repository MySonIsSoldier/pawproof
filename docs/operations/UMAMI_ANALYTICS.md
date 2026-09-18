# Umami 분석 설정

PawProof는 `umami.hothyun.com`에 설치된 Umami를 선택적으로 사용한다. 웹사이트 ID가 없으면 추적 스크립트를 렌더링하지 않으므로 개발·운영 환경 모두 키 없이 동작한다.

## 처음 등록하기

1. [umami.hothyun.com](https://umami.hothyun.com)에 로그인한다.
2. **Websites → Add website**를 선택하고 이름을 `PawProof`로 입력한다.
3. 기본 도메인에는 `pawproof.kr`을 입력한다. Vercel 미리보기까지 집계하려면 `pawproof-rose.vercel.app`도 허용 도메인에 추가하거나 아래 `NEXT_PUBLIC_UMAMI_DOMAINS`에 쉼표로 적는다.
4. 저장 후 표시되는 **Website ID**를 복사한다. 이 값은 Umami가 어느 사이트의 데이터인지 구분하는 공개 식별자이며, 로그인 비밀번호나 API 키가 아니다.

## Vercel에 연결하기

Vercel 프로젝트의 **Settings → Environment Variables**에서 Production(필요하면 Preview도)에 다음 값을 추가한다.

```text
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<Umami에서 복사한 Website ID>
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://umami.hothyun.com/script.js
NEXT_PUBLIC_UMAMI_DOMAINS=pawproof.kr,pawproof-rose.vercel.app
```

그 다음 새 배포를 실행한다. 운영 페이지의 소스에 `script.js`가 로드되고, Umami 대시보드의 **Websites → PawProof**에서 방문·페이지뷰를 확인할 수 있다. 로컬에서도 확인하려면 같은 Website ID를 `.env.local`에 넣고 개발 서버를 다시 시작한다. 로컬 방문을 운영 통계와 섞고 싶지 않다면 `NEXT_PUBLIC_UMAMI_DOMAINS`에 `localhost`를 넣지 않는다.

## 기록하는 사용자 흐름

페이지뷰와 SPA 이동은 Umami의 자동 추적에 맡기고, 제품 판단에 필요한 행동만 이벤트로 보낸다. 검색어, 장소명·주소, 이메일, 반려견 이름·견종·체중, 계정 ID는 이벤트에 포함하지 않는다.

| 이벤트 | 의미 | 추가 정보 |
|---|---|---|
| `home_map_cta`, `home_demo_cta` | 첫 화면에서 지도/체험 시작 | 없음 |
| `map_destination_search` | 지역·주소 검색 완료 | 결과 수, 결과 있음 여부 |
| `map_search_area` | 지도에서 이 지역 다시 검색 | 반경 |
| `map_filter_change`, `map_radius_change` | 장소 필터·반경 변경 | 필터 종류/값, 반경 |
| `map_place_select` | 지도에서 장소를 선택 | 장소 유형·공식 출처·이미 코스에 담겼는지 |
| `place_inspection_result` | 장소 선택 후 규정 조회 완료 | 요청·성공·실패 수 |
| `course_place_add` | 장소를 여행 코스에 추가 | 장소 유형·출처·코스 개수 |
| `course_verify_start`, `course_verify_result` | 코스 검사 시작·완료 | 이동 방식, 방문지 수, 판정별 수 |
| `map_note_open` | 여행 노트로 이동 | 코스 개수 |
| `trip_mode_change` | 실제/가상 모드 변경 | 모드 |
| `inquiry_copy` | 문의 문구 복사 | 없음 |
| `auth_action_success`, `auth_google_success` | 로그인·가입·비밀번호 재설정 성공 | 인증 방식 |

이벤트는 Umami가 제공하는 `window.umami.track`으로 전송하며, 분석 장애가 여행 기능을 중단시키지 않도록 실패를 앱에서 무시한다.
