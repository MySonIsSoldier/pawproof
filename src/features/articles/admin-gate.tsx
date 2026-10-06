"use client";
import type { ReactNode } from "react";
import { Button } from "../../components/ui/button";
import { isArticleAdminIdentity } from "../../config/article-admin";
import { useAuth } from "../auth/auth-provider";
import styles from "./articles-admin.module.css";

export function AdminGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.configured)
    return (
      <section className={styles.gate} role="status">
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>관리자 기능을 아직 사용할 수 없어요.</h1>
        <p>잠시 후 다시 이용해 주세요.</p>
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
  if (auth.user.signInProvider === "checking")
    return (
      <section className={styles.gate} role="status">
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>로그인 방식을 확인하고 있어요.</h1>
      </section>
    );
  if (
    !isArticleAdminIdentity(
      auth.user.email,
      auth.user.signInProvider,
      auth.user.verified,
    )
  )
    return (
      <section className={styles.gate} role="alert">
        <span className={styles.gateMark}>ADMIN ACCESS</span>
        <h1>이 계정은 아티클 관리 화면을 사용할 수 없어요.</h1>
        <p>ohsong656565@gmail.com Google 계정으로 로그인해 주세요.</p>
      </section>
    );
  return children;
}
