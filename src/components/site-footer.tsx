import Link from "next/link";
import { Icon } from "./icon";
export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <Link href="/" className="brand">
            <Icon name="paw" /> pawproof.
          </Link>
          <p>작은 발걸음도, 여행의 끝까지.</p>
        </div>
        <nav className="site-footer-section" aria-label="콘텐츠">
          <h2>콘텐츠</h2>
          <div className="site-footer-links">
            <Link href="/articles">반려견 정보 아티클</Link>
          </div>
        </nav>
        <nav className="site-footer-section" aria-label="서비스와 도움말">
          <h2>서비스와 도움말</h2>
          <div className="site-footer-links">
            <Link href="/about">서비스와 데이터 안내</Link>
            <Link href="/contact">문의하기</Link>
          </div>
        </nav>
        <nav className="site-footer-section" aria-label="정책">
          <h2>정책</h2>
          <div className="site-footer-links">
            <Link href="/privacy">개인정보처리방침</Link>
            <Link href="/terms">이용약관</Link>
          </div>
        </nav>
      </div>
      <div className="site-footer-meta">
        <p>© 2026 PawProof</p>
        <p>반려견과 함께하는 여행</p>
      </div>
    </footer>
  );
}
