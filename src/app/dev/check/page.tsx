import Link from "next/link";
import { notFound } from "next/navigation";
import { EnvironmentCheck } from "@/features/development/environment-check";

export default function DevelopmentCheckPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main><EnvironmentCheck /><Link href="/about">소개 페이지로 이동</Link></main>;
}
