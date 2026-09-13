import { SiteHeader } from "../../components/site-header";
import { ProfileScreen } from "../../features/profile/profile-screen";
export const metadata = { title: "나의 프로필" };
export default function ProfilePage() {
  return (
    <>
      <SiteHeader compact />
      <ProfileScreen />
    </>
  );
}
