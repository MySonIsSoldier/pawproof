import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";

const variants = {
  primary: "button",
  outline: "ui-button-outline",
  ghost: "ui-button-ghost",
  link: "text-button",
  icon: "icon-button",
  plain: "",
} as const;

// shadcn's asChild composition keeps links as links and buttons as buttons.
export function Button({
  variant = "primary",
  size = "default",
  asChild = false,
  className = "",
  type,
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: "default" | "small";
  asChild?: boolean;
}) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      data-slot="button"
      data-variant={variant}
      className={`ui-button ${variants[variant]} ${size === "small" ? "small" : ""} ${className}`}
      type={asChild ? undefined : type || "button"}
      {...props}
    />
  );
}
