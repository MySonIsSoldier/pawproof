import { SiteHeader } from "../../components/site-header";
import { ProfileScreen } from "../../features/profile/profile-screen";
export const metadata = {
  title: "나의 프로필",
  description: "PawProof에 등록한 반려견과 여행 정보를 관리합니다.",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: false },
};
export default function ProfilePage() {
  return (
    <>
      <SiteHeader compact />
      <ProfileScreen />
    </>
  );
}
