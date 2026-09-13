"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth/auth-provider";
import { useProfile } from "./use-profile";
import type { Pet } from "../../domain/policies/types";
import { Button } from "../../components/ui/button";
export function RegisteredPets(props: {
  pets: Pet[];
  change: (pets: Pet[]) => void;
  busy: boolean;
}) {
  const auth = useAuth();
  return auth.user ? <Picker key={auth.user.uid} {...props} /> : null;
}
function Picker({
  change,
  busy,
}: {
  pets: Pet[];
  change: (pets: Pet[]) => void;
  busy: boolean;
}) {
  const profile = useProfile();
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="registered-pets">
      <div className="search-heading">
        <strong>등록한 반려견으로 시작</strong>
        <Link href="/profile">프로필 관리</Link>
      </div>
      {profile.isPending ? (
        <p className="field-caption">반려견을 불러오고 있어요…</p>
      ) : profile.error ? (
        <Button variant="link" onClick={() => void profile.refetch()}>
          반려견 다시 불러오기
        </Button>
      ) : profile.data?.pets.length ? (
        <>
          <div className="filter-chips">
            {profile.data.pets.map((pet) => (
              <Button
                key={pet.id}
                variant="outline"
                aria-pressed={selected.includes(pet.id)}
                disabled={busy}
                onClick={() =>
                  setSelected(
                    selected.includes(pet.id)
                      ? selected.filter((id) => id !== pet.id)
                      : [...selected, pet.id],
                  )
                }
              >
                {pet.name} · {pet.weight}kg
              </Button>
            ))}
          </div>
          <Button
            variant="link"
            disabled={busy || !selected.length}
            onClick={() =>
              change(
                profile
                  .data!.pets.filter((p) => selected.includes(p.id))
                  .map(({ name, breed, weight }) => ({ name, breed, weight })),
              )
            }
          >
            선택한 반려견으로 입력 바꾸기
          </Button>
        </>
      ) : (
        <p className="field-caption">
          프로필에 반려견을 등록하면 매번 입력하지 않아도 돼요.
        </p>
      )}
    </div>
  );
}
