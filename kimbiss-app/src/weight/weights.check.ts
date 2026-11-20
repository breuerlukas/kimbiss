// Self-check: `npx tsx src/weight/weights.check.ts`.
import assert from "node:assert/strict";
import { goalProgress } from "./weights.ts";

assert.equal(goalProgress(75, 80, 77), 0.4);
assert.equal(goalProgress(90, 80, 85), 0.5);
assert.equal(goalProgress(90, 80, 92), 0);
assert.equal(goalProgress(90, 80, 70), 1);
assert.equal(goalProgress(70, 70, 71), 1);
console.log("weights ok");
