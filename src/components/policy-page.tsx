import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PolicyPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader compact />
      <main id="main" className="policy-page wrap">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="policy-lead">{lead}</p>
        <article className="policy-content">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
