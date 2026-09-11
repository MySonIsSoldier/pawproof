import { notFound } from "next/navigation";
import { DesignSystem } from "../../../features/development/design-system";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignSystem />;
}
