import type { Metadata } from "next";
import { SiteFooter } from "../../../../components/site-footer";
import { SiteHeader } from "../../../../components/site-header";
import { AdminArticleEditor } from "../../../../features/articles/admin-article-editor";
import { AdminGate } from "../../../../features/articles/admin-gate";
import styles from "../../../../features/articles/articles-admin.module.css";

export const metadata: Metadata = {
  title: "새 아티클 작성",
  robots: { index: false, follow: false },
};

export default function NewAdminArticlePage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main" className={`${styles.shell} wrap`}>
        <AdminGate>
          <AdminArticleEditor articleId={null} />
        </AdminGate>
      </main>
      <SiteFooter />
    </>
  );
}
