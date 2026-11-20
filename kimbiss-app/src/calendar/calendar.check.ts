// Self-check: `npx tsx src/calendar/calendar.check.ts`.
import assert from "node:assert/strict";
import type { Meal } from "../meal/meals.ts";
import { leadingBlanks, monthStats, tone, totalsByDay } from "./calendar.ts";

const meal = (day: number, kcal: number, month = 10): Meal =>
  ({ id: "", name: "", items: [], has_photo: false, eaten_at: new Date(2026, month, day, 12).getTime(), kcal, protein: 1, carbs: 2, fat: 3 });
const november = new Date(2026, 10, 1);

const totals = totalsByDay([meal(1, 1000), meal(1, 500), meal(3, 3340), meal(5, 2000, 9)], november);
assert.equal(totals.length, 30);
assert.deepEqual(totals[0], { kcal: 1500, protein: 2, carbs: 4, fat: 6 });
assert.equal(totals[2].kcal, 3340);
assert.equal(totals[4].kcal, 0, "a meal of another month does not count");

assert.equal(tone(0, 3000), "none");
assert.equal(tone(2849, 3000), "under");
assert.equal(tone(2850, 3000), "on");
assert.equal(tone(3150, 3000), "on");
assert.equal(tone(3151, 3000), "over");

// Today (the 3rd) does not count yet: only the 1st is finished and logged.
assert.deepEqual(monthStats(totals, november, new Date(2026, 10, 3, 18), 3340), { logged: 1, average: 1500, onTarget: 0 });
assert.deepEqual(monthStats(totals, november, new Date(2026, 10, 4, 8), 3340), { logged: 2, average: 2420, onTarget: 1 });

assert.equal(leadingBlanks(november), 6, "1 November 2026 is a Sunday");
assert.equal(leadingBlanks(new Date(2026, 5, 1)), 0, "1 June 2026 is a Monday");
console.log("calendar ok");
