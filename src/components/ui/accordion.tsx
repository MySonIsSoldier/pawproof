"use client";

import type { ComponentProps, ReactNode } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Icon } from "../icon";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className = "",
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={`ui-accordion-item ${className}`}
      {...props}
    />
  );
}

export function AccordionTrigger({
  children,
  className = "",
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="ui-accordion-header">
      <AccordionPrimitive.Trigger
        className={`ui-accordion-trigger ${className}`}
        {...props}
      >
        <span>{children}</span>
        <Icon name="down" size={18} />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  children,
  className = "",
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={`ui-accordion-content ${className}`}
      {...props}
    >
      <div className="ui-accordion-body">{children}</div>
    </AccordionPrimitive.Content>
  );
}

// A single independently expandable section shares the same keyboard and motion contract.
export function Disclosure({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="content">
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
