"use client";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { useAuth } from "./auth-provider";
export function AccountButton() {
  const auth = useAuth();
  if (auth.user)
    return (
      <Button className="account-button" variant="ghost" asChild>
        <Link href="/profile">프로필</Link>
      </Button>
    );
  return (
    <Button
      className="account-button"
      variant="ghost"
      onClick={() => auth.setOpen(true)}
    >
      {auth.user ? "내 계정" : "로그인"}
    </Button>
  );
}
