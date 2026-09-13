import { Input } from "../../components/ui/input";
import type { Pet } from "../../domain/policies/types";
export function PetFields({
  pet,
  label,
  change,
}: {
  pet: Pet;
  label: string;
  change: (pet: Pet) => void;
}) {
  return (
    <div className="pet-fields">
      <label>
        이름
        <Input
          aria-label={`${label} 이름`}
          value={pet.name}
          maxLength={20}
          onChange={(e) => change({ ...pet, name: e.target.value })}
          placeholder="예: 두부"
        />
      </label>
      <label>
        견종
        <Input
          aria-label={`${label} 견종`}
          value={pet.breed}
          maxLength={40}
          onChange={(e) => change({ ...pet, breed: e.target.value })}
          placeholder="믹스·모름도 가능"
        />
      </label>
      <label>
        체중 <span className="muted">kg</span>
        <Input
          aria-label={`${label} 체중`}
          type="number"
          min="0.1"
          max="120"
          step="0.1"
          value={pet.weight || ""}
          onChange={(e) => change({ ...pet, weight: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
