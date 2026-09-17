import type { Pet } from "../policies/types";

export function samePet(a: Pet, b: Pet): boolean {
  return (
    a.name.trim() === b.name.trim() &&
    a.breed.trim() === b.breed.trim() &&
    a.weight === b.weight
  );
}

/** Toggle a registered pet while preserving custom companions after the first slot. */
export function toggleRegisteredPet(
  pets: Pet[],
  selected: Pet,
  registered: Pet[],
  max = 5,
): Pet[] {
  if (pets.some((pet) => samePet(pet, selected))) {
    const remaining = pets.filter((pet) => !samePet(pet, selected));
    return remaining.length
      ? remaining
      : [{ name: "", breed: "모름", weight: 5 }];
  }
  if (pets.length >= max) return pets;
  const next = {
    name: selected.name,
    breed: selected.breed,
    weight: selected.weight,
  };
  const anotherRegisteredIsActive = registered.some((registeredPet) =>
    pets.some((pet) => samePet(pet, registeredPet)),
  );
  return anotherRegisteredIsActive
    ? [...pets, next]
    : [next, ...pets.slice(1)];
}
