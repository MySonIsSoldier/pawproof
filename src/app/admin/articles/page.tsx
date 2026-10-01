import type { Metadata } from "next";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { AdminArticleList } from "../../../features/articles/admin-article-list";
import { AdminGate } from "../../../features/articles/admin-gate";
import styles from "../../../features/articles/articles-admin.module.css";

export const metadata: Metadata = {
  title: "아티클 관리자",
  robots: { index: false, follow: false },
};

export default function AdminArticlesPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main" className={`${styles.shell} wrap`}>
        <AdminGate>
          <AdminArticleList />
        </AdminGate>
      </main>
      <SiteFooter />
    </>
  );
}
