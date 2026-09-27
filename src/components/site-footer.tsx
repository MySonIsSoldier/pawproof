import Link from "next/link";
import { Icon } from "./icon";
export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
      <div>
        <Link href="/" className="brand">
          <Icon name="paw" /> pawproof.
        </Link>
        <p>작은 발걸음도, 여행의 끝까지.</p>
      </div>
      <div>
        <nav className="site-footer-links" aria-label="서비스 안내">
          <Link href="/contact">
            문의하기 <Icon name="arrow" size={14} />
          </Link>
          <Link href="/about">
            서비스와 데이터 안내 <Icon name="arrow" size={14} />
          </Link>
          <Link href="/privacy">
            개인정보처리방침 <Icon name="arrow" size={14} />
          </Link>
          <Link href="/terms">
            이용약관 <Icon name="arrow" size={14} />
          </Link>
        </nav>
        <p>© 2026 PawProof · 반려견과 함께하는 여행</p>
      </div>
    </footer>
  );
}
