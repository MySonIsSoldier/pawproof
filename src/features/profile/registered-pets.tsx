"use client";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { useProfile } from "./use-profile";
import type { Pet } from "../../domain/policies/types";
import { Button } from "../../components/ui/button";
import { samePet, toggleRegisteredPet } from "../../domain/itinerary/pets";
export function RegisteredPets(props: {
  pets: Pet[];
  change: (pets: Pet[]) => void;
  busy: boolean;
}) {
  const auth = useAuth();
  return auth.user ? <Picker key={auth.user.uid} {...props} /> : null;
}
function Picker({
  pets,
  change,
  busy,
}: {
  pets: Pet[];
  change: (pets: Pet[]) => void;
  busy: boolean;
}) {
  const profile = useProfile();
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
                className="registered-pet-chip"
                data-selected={pets.some((current) => samePet(current, pet))}
                aria-pressed={pets.some((current) => samePet(current, pet))}
                disabled={busy}
                onClick={() =>
                  change(toggleRegisteredPet(pets, pet, profile.data.pets))
                }
              >
                {pet.name} · {pet.weight}kg
              </Button>
            ))}
          </div>
          <p className="field-caption registered-pets-hint">
            눌러서 함께 갈 반려견을 추가하고, 다시 누르면 목록에서 빼요.
          </p>
        </>
      ) : (
        <p className="field-caption">
          프로필에 반려견을 등록하면 매번 입력하지 않아도 돼요.
        </p>
      )}
    </div>
  );
}
