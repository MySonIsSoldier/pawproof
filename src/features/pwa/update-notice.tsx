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

export function UpdateNotice({ apply }: { apply: () => void }) {
  return (
    <aside className="pwa-status no-print">
      <strong>새 버전이 준비됐어요.</strong>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link">업데이트 안내</Button>
        </DialogTrigger>
        <DialogContent className="pwa-dialog">
          <DialogTitle>새 버전으로 다시 열까요?</DialogTitle>
          <DialogDescription>
            열린 화면이 새로고침됩니다. 저장하지 않은 입력은 사라질 수 있어요.
            비회원의 작성 내용과 검사 결과는 사라져요. 로그인한 경우 여행 노트
            상단의 ‘자동 저장됨’을 확인해 주세요.
          </DialogDescription>
          <div className="pwa-dialog-actions">
            <DialogClose asChild>
              <Button variant="outline">계속 편집하기</Button>
            </DialogClose>
            <Button onClick={apply}>새 버전으로 열기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
