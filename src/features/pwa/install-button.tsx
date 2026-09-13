"use client";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components/ui/dialog";
import { Icon } from "../../components/icon";
import { usePwa } from "./pwa-provider";

export function InstallButton() {
  const pwa = usePwa();
  if (pwa.standalone) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="pwa-install-button"
          aria-label="PawProof 앱 설치 안내"
        >
          <Icon name="plus" size={16} />
          <span>앱 설치</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="pwa-dialog">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">TAKE US WITH YOU</p>
            <DialogTitle>여행 노트를 홈 화면에.</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="icon" aria-label="설치 안내 닫기">
              <Icon name="close" />
            </Button>
          </DialogClose>
        </div>
        <div className="pwa-emblem">
          <Icon name="paw" size={40} />
        </div>
        <DialogDescription>
          설치한 PawProof 아이콘으로 우리의 여행 노트를 편하게 다시 열어요.
        </DialogDescription>
        <div className="pwa-install-steps">
          {pwa.ios ? (
            <>
              <strong>iPhone · iPad</strong>
              <p>
                Safari에서 이 페이지를 열고, 공유 메뉴의 ‘홈 화면에 추가’를
                선택해 주세요.
              </p>
            </>
          ) : (
            <>
              <strong>나에게 편한 방법으로 설치해요.</strong>
              <p>
                아래 설치 버튼을 이용하거나, 브라우저 주소창·메뉴에서 ‘앱 설치’
                또는 ‘홈 화면에 추가’를 선택해 주세요. 브라우저마다 표시가 다를
                수 있어요.
              </p>
            </>
          )}
        </div>
        {pwa.canPrompt && (
          <Button onClick={() => void pwa.install()} disabled={pwa.pending}>
            PawProof 설치하기 <Icon name="arrow" size={16} />
          </Button>
        )}
        <p className="field-caption">
          장소 검색과 규정 검사는 인터넷 연결이 필요해요. 앱을 설치해도 여행
          비로그인 입력은 기기별로 보관돼요. 로그인 후 자동 저장된 노트는 다른
          기기에서 불러올 수 있어요.
        </p>
        {pwa.enabled && pwa.supported && !pwa.error && (
          <p className="field-caption">
            {pwa.ready
              ? "오프라인 안내 화면 준비 완료"
              : "오프라인 안내 화면을 준비하고 있어요."}
          </p>
        )}
        {pwa.enabled && !pwa.supported && (
          <p className="field-caption">
            이 브라우저에서는 오프라인 안내를 준비할 수 없어요. 온라인으로 계속
            이용할 수 있어요.
          </p>
        )}
        {pwa.error && (
          <div role="alert">
            <p>오프라인 준비를 완료하지 못했어요. 연결 상태를 확인해 주세요.</p>
            <Button variant="link" onClick={pwa.retry}>
              설치 준비 다시 확인
            </Button>
          </div>
        )}
        {pwa.message && <p role="status">{pwa.message}</p>}
      </DialogContent>
    </Dialog>
  );
}
