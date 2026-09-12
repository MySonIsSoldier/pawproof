"use client";
import { Button } from "../../components/ui/button";
import { useAuth } from "./auth-provider";
export function AccountButton() {
  const auth = useAuth();
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
