"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-provider";
import { useProfile } from "./use-profile";
import { PetFields } from "./pet-fields";
import {
  profileInputSchema,
  type AccountProfile,
} from "../../application/contracts/profile";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icon";
import {
  withNotifications,
  useNotify,
} from "../../components/notifications/with-notifications";
import styles from "./profile.module.css";
function ProfileScreenInner() {
  const auth = useAuth();
  const profile = useProfile();
  const router = useRouter();
  const notify = useNotify();
  const [draft, setDraft] = useState<AccountProfile | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const data = draft || profile.data;
  async function accountAction(
    action: Parameters<typeof auth.run>[0],
    message: string,
  ) {
    setPending(true);
    setError("");
    try {
      await auth.run(action);
      notify({ kind: "success", title: message });
    } catch {
      setError(
        "계정 작업을 완료하지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }
  async function save() {
    if (!data) return;
    if (
      !profileInputSchema.safeParse({
        pets: data.pets,
        expectedRevision: data.revision,
      }).success
    ) {
      setError("반려견 이름·견종·체중을 확인해 주세요.");
      return;
    }
    setError("");
    try {
      await profile.save.mutateAsync(data);
      setDraft(null);
      notify({ kind: "success", title: "반려견 프로필을 저장했어요" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "저장하지 못했어요.");
    }
  }
  return (
    <main id="main" className={`wrap ${styles.page}`}>
      <p className="eyebrow">MY LITTLE COMPANIONS</p>
      <h1>
        우리의 프로필<span className="muted">.</span>
      </h1>
      <p className={styles.lead}>
        한 번 알려주면, 다음 여행도 더 가볍게 시작해요.
      </p>
      {!auth.ready ? (
        <p role="status">로그인 확인 중…</p>
      ) : !auth.user ? (
        <section className={styles.card}>
          <h2>반려견과 여행을 함께 보관하세요</h2>
          <Button onClick={() => auth.setOpen(true)}>로그인</Button>
          <Link href="/plan">회원가입 없이 코스 만들기</Link>
        </section>
      ) : (
        <div className={styles.grid}>
          <section className={styles.account}>
            <span className="round-icon">
              <Icon name="paw" />
            </span>
            <h2>나의 계정</h2>
            <p className={styles.email}>{auth.user.email}</p>
            <p>
              {auth.user.verified
                ? "이메일 인증 완료"
                : "여행 자동 저장을 위해 이메일을 인증해 주세요."}
            </p>
            {!auth.user.verified && (
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    void accountAction(async (a, s) => {
                      if (a.currentUser)
                        await s.sendEmailVerification(a.currentUser);
                    }, "인증 메일을 보냈어요")
                  }
                >
                  인증 메일 다시 보내기
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    void accountAction(async (a) => {
                      await a.currentUser?.reload();
                      await a.currentUser?.getIdToken(true);
                      if (!a.currentUser?.emailVerified) throw new Error();
                    }, "이메일 인증을 확인했어요")
                  }
                >
                  인증 완료 확인
                </Button>
              </div>
            )}
            <Link className="button" href="/plan">
              여행 노트로 가기
            </Link>
            <Button
              variant="link"
              disabled={pending || profile.save.isPending}
              onClick={() =>
                void accountAction(async (a, s) => {
                  await s.signOut(a);
                  setDraft(null);
                  router.push("/");
                }, "로그아웃했어요")
              }
            >
              로그아웃
            </Button>
          </section>
          <section className={styles.card} aria-label="등록한 반려견">
            <div className={styles.heading}>
              <div>
                <h2>함께 떠나는 반려견</h2>
                <p>최대 5마리 · 여행마다 함께 갈 친구를 선택해요.</p>
              </div>
              <Icon name="paw" size={28} />
            </div>
            {profile.isPending && (
              <p role="status">프로필을 불러오고 있어요…</p>
            )}
            {profile.error && (
              <>
                <p role="alert">{profile.error.message}</p>
                <Button variant="link" onClick={() => void profile.refetch()}>
                  프로필 다시 불러오기
                </Button>
              </>
            )}
            {data && (
              <fieldset
                disabled={profile.save.isPending}
                className={styles.fields}
              >
                {data.pets.length === 0 && (
                  <p className={styles.empty}>
                    첫 반려견을 등록해 주세요. 이름·견종·체중을 여행에 바로
                    가져올 수 있어요.
                  </p>
                )}
                {data.pets.map((pet, index) => (
                  <article className={styles.pet} key={pet.id}>
                    <div className={styles.heading}>
                      <strong>반려견 {index + 1}</strong>
                      <Button
                        variant="link"
                        onClick={() =>
                          setDraft({
                            ...data,
                            pets: data.pets.filter((p) => p.id !== pet.id),
                          })
                        }
                      >
                        반려견 {index + 1} 삭제
                      </Button>
                    </div>
                    <PetFields
                      pet={pet}
                      label={`등록 반려견 ${index + 1}`}
                      change={(next) =>
                        setDraft({
                          ...data,
                          pets: data.pets.map((p) =>
                            p.id === pet.id ? { ...next, id: pet.id } : p,
                          ),
                        })
                      }
                    />
                  </article>
                ))}
                <div className={styles.actions}>
                  <Button
                    variant="outline"
                    disabled={data.pets.length >= 5}
                    onClick={() =>
                      setDraft({
                        ...data,
                        pets: [
                          ...data.pets,
                          {
                            id: crypto.randomUUID(),
                            name: "",
                            breed: "",
                            weight: 0,
                          },
                        ],
                      })
                    }
                  >
                    <Icon name="plus" size={16} />
                    반려견 등록
                  </Button>
                  <Button
                    disabled={!draft || profile.save.isPending}
                    onClick={() => void save()}
                  >
                    {profile.save.isPending ? "저장 중…" : "프로필 저장"}
                  </Button>
                  {draft && (
                    <Button variant="link" onClick={() => setDraft(null)}>
                      수정 취소
                    </Button>
                  )}
                </div>
              </fieldset>
            )}
            <p className="field-caption">
              프로필 수정·삭제는 저장 버튼을 누르면 반영돼요. 이미 만든 여행의
              반려견 정보는 유지돼요.
            </p>
          </section>
        </div>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </main>
  );
}
function AccountProfileScreen() {
  const { user } = useAuth();
  // Auth changes from another tab must also discard the previous account's draft.
  return <ProfileScreenInner key={user?.uid || "guest"} />;
}
export const ProfileScreen = withNotifications(AccountProfileScreen);
