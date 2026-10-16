// Self-check for the target maths: `npx tsx src/setup/targets.check.ts`.
import assert from "node:assert/strict";
import { lowestGoalKg, suggestTargets, type Answers } from "./targets.ts";

const kim: Answers = {
  sex: "female", birthYear: 2000, heightCm: 168, startWeightKg: 70,
  goalWeightKg: 63, activity: "light", weeklyChangeKg: 0.5,
};

// Resting 10*70 + 6.25*168 - 5*26 - 161 = 1459, maintenance x1.375 = 2006,
// minus 550 for half a kilo a week.
const losing = suggestTargets(kim, 2026);
assert.equal(losing.maintenanceKcal, 2006);
assert.equal(losing.kcal, 1460);
assert.equal(losing.protein, 113);
assert.equal(losing.fat, 49);
assert.equal(losing.kcal >= losing.protein * 4 + losing.fat * 9, true);
assert.equal(losing.weeks, 15);

const holding = suggestTargets({ ...kim, goalWeightKg: 70.2 }, 2026);
assert.equal(holding.kcal, 2010);
assert.equal(holding.weeks, null);

const gaining = suggestTargets({ ...kim, goalWeightKg: 74 }, 2026);
assert.equal(gaining.kcal, 2560);

// The floor holds even for a fast pace on a small, inactive body.
const small = suggestTargets({
  ...kim, heightCm: 152, startWeightKg: 50, goalWeightKg: 46,
  activity: "sedentary", weeklyChangeKg: 0.75,
}, 2026);
assert.equal(small.kcal, 1200);

assert.equal(lowestGoalKg(168), 53);
console.log("targets ok");
