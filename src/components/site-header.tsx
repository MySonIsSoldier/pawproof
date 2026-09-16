import Link from "next/link";
import { Icon } from "./icon";
import { AccountButton } from "../features/auth/account-button";
import { InstallButton } from "../features/pwa/install-button";
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="site-header wrap">
      <Link href="/" className="brand" aria-label="PawProof 홈">
        <span className="brand-mark">
          <Icon name="paw" size={25} />
        </span>
        pawproof<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="주 메뉴">
        <InstallButton />
        <Link href="/about">PawProof 소개</Link>
        {!compact && <Link href="/#how-it-works">이용 방법</Link>}
        <Link href={compact ? "/" : "/plan"} className="button small">
          {compact ? "처음으로" : "지도에서 찾기"}
          <Icon name="arrow" size={16} />
        </Link>
        <AccountButton />
      </nav>
    </header>
  );
}
