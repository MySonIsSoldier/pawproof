"use client";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import { useAuth } from "./auth-provider";
export function AccountButton() {
  const auth = useAuth();
  if (auth.user)
    return (
      <Button className="account-button account-avatar" variant="ghost" asChild>
        <Link href="/profile" aria-label="프로필" title="나의 프로필">
          <Avatar aria-hidden="true" key={auth.user.uid}>
            <AvatarImage
              src={auth.user.photoURL || undefined}
              alt=""
              referrerPolicy="no-referrer"
              style={{ borderRadius: "100%", border: "1px solid var(--line)" }}
            />
            <AvatarFallback>
              {Array.from(
                auth.user.displayName?.trim() || auth.user.email || "나",
              )[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </Button>
    );
  return (
    <Button
      className="account-button"
      variant="ghost"
      disabled={!auth.ready}
      aria-busy={!auth.ready}
      onClick={() => auth.setOpen(true)}
    >
      로그인
    </Button>
  );
}
