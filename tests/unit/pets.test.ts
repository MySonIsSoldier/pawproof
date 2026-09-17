import test from "node:test";
import assert from "node:assert/strict";
import {
  samePet,
  toggleRegisteredPet,
} from "../../src/domain/itinerary/pets.ts";
import type { Pet } from "../../src/domain/policies/types.ts";

const registered: Pet[] = [
  { name: "두부", breed: "웰시코기", weight: 12 },
  { name: "콩이", breed: "푸들", weight: 4 },
];

test("registered pet replaces custom first slot until another registered pet is active", () => {
  const custom: Pet[] = [
    { name: "직접 입력", breed: "믹스", weight: 8 },
    { name: "다른 친구", breed: "모름", weight: 6 },
  ];
  const withFirst = toggleRegisteredPet(custom, registered[0], registered);
  assert.deepEqual(withFirst, [registered[0], custom[1]]);
  const withSecond = toggleRegisteredPet(withFirst, registered[1], registered);
  assert.deepEqual(withSecond, [registered[0], custom[1], registered[1]]);
});

test("clicking an active registered pet removes it and keeps other pets", () => {
  const current = [registered[0], registered[1]];
  assert.deepEqual(toggleRegisteredPet(current, registered[0], registered), [
    registered[1],
  ]);
  assert.deepEqual(toggleRegisteredPet([registered[0]], registered[0], registered), [
    { name: "", breed: "모름", weight: 5 },
  ]);
  assert.equal(samePet(registered[0], { ...registered[0] }), true);
});
