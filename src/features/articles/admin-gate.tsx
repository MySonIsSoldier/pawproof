"use client";
import type { ReactNode } from "react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../auth/auth-provider";
import styles from "./articles-admin.module.css";

export function AdminGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.configured)
    return (
      <section className={styles.gate} role="status">
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>운영 로그인 설정을 확인해 주세요.</h1>
        <p>
          관리 화면은 Production Firebase 인증이 연결된 운영 환경에서 사용할 수
          있어요.
        </p>
      </section>
    );
  if (!auth.ready)
    return (
      <section className={styles.gate} role="status">
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>로그인 상태를 확인하고 있어요.</h1>
      </section>
    );
  if (!auth.user)
    return (
      <section className={styles.gate}>
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>관리자 로그인이 필요해요.</h1>
        <p>허용된 PawProof 계정으로 로그인해 주세요.</p>
        <Button onClick={() => auth.setOpen(true)}>로그인</Button>
      </section>
    );
  return children;
}
