import type { Metadata } from "next";
import { SiteFooter } from "../../../../components/site-footer";
import { SiteHeader } from "../../../../components/site-header";
import { AdminArticleEditor } from "../../../../features/articles/admin-article-editor";
import { AdminGate } from "../../../../features/articles/admin-gate";
import styles from "../../../../features/articles/articles-admin.module.css";

export const metadata: Metadata = {
  title: "아티클 편집",
  robots: { index: false, follow: false },
};

export default async function EditAdminArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <SiteHeader compact />
      <main id="main" className={`${styles.shell} wrap`}>
        <AdminGate>
          <AdminArticleEditor articleId={id} />
        </AdminGate>
      </main>
      <SiteFooter />
    </>
  );
}
