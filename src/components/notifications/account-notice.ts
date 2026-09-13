"use client";
import { toast } from "sonner";
/** Root toaster survives dialog dismissal and client route transitions. */
export function accountSuccess(title: string) {
  toast.success(title, { toasterId: "account-global", duration: 4000 });
}
