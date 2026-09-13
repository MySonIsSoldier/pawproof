"use client";

import type { ComponentProps } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import styles from "./avatar.module.css";

export function Avatar({
  className = "",
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={`${styles.root} ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({
  className = "",
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={`${styles.image} ${className}`}
      {...props}
    />
  );
}

export function AvatarFallback({
  className = "",
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={`${styles.fallback} ${className}`}
      {...props}
    />
  );
}
