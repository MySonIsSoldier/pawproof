"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { DatePicker } from "../../components/ui/date-picker";
import { TimePicker } from "../../components/ui/time-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";
import { Icon } from "../../components/icon";
import {
  withNotifications,
  useNotify,
} from "../../components/notifications/with-notifications";

function DesignSystemScreen() {
  const notify = useNotify();
  const [date, setDate] = useState("2026-09-21");
  const [time, setTime] = useState("10:07");
  const [zone, setZone] = useState("outdoor");
  return (
    <main id="main" className="wrap design-system">
      <p className="eyebrow">PAWPROOF · DESIGN SYSTEM</p>
      <h1>숲빛 입력 컴포넌트</h1>
      <p>같은 토큰, 같은 반응. 포커스·선택·비활성 상태를 여기서 확인해요.</p>
      <section>
        <h2>작업 알림</h2>
        <p>
          성공·안내·실패를 구분하고 마지막 작업 하나만 표시해요. Alt+T로 알림에
          이동할 수 있어요.
        </p>
        <div className="ds-row">
          <Button
            onClick={() =>
              notify({ kind: "success", title: "변경 내용을 저장했어요" })
            }
          >
            성공 알림
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify({ kind: "info", title: "방문 전에 확인할 내용이 있어요" })
            }
          >
            안내 알림
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              notify({
                kind: "error",
                title: "저장하지 못했어요. 다시 시도해 주세요.",
              })
            }
          >
            오류 알림
          </Button>
        </div>
      </section>
      <section>
        <h2>버튼과 상태</h2>
        <div className="ds-row">
          <Button>
            코스 확인 <Icon name="arrow" size={16} />
          </Button>
          <Button variant="outline">다른 장소</Button>
          <Button variant="ghost">다시 보기</Button>
          <Button variant="link">근거 보기</Button>
          <Button disabled>검사 중</Button>
        </div>
      </section>
      <section>
        <h2>입력과 선택</h2>
        <div className="ds-grid">
          <label>
            반려견 이름
            <Input placeholder="예: 두부" />
          </label>
          <label>
            비활성 입력
            <Input disabled value="처리 중" readOnly />
          </label>
          <div className="ui-field">
            <span>이용 구역</span>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger aria-label="이용 구역">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indoor">실내</SelectItem>
                <SelectItem value="outdoor">실외</SelectItem>
                <SelectItem value="unavailable" disabled>
                  선택 불가
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ui-field">
            <span>여행 날짜</span>
            <DatePicker value={date} onChange={setDate} label="여행 날짜" />
          </div>
          <div className="ui-field">
            <span>도착 시간</span>
            <TimePicker value={time} onChange={setTime} label="도착 시간" />
          </div>
        </div>
        <div className="ds-row">
          <label>
            <Checkbox defaultChecked /> 목줄 준비
          </label>
          <label>
            <Checkbox disabled /> 비활성 준비 상태
          </label>
        </div>
      </section>
      <section>
        <h2>핵심 토큰</h2>
        <div className="ds-row">
          {["forest", "sage", "paper", "ink", "line"].map((token) => (
            <div key={token} className="ds-swatch">
              <span style={{ background: `var(--${token})` }} />
              {token}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export const DesignSystem = withNotifications(DesignSystemScreen);
