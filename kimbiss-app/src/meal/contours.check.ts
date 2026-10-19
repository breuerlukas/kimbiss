import assert from "node:assert/strict";
import { contourAlphas } from "./contours.ts";

// A 20 × 10 picture, black on the left half, white on the right.
const width = 20;
const height = 10;
const rgba = new Uint8Array(width * height * 4).map((_, index) =>
  index % 4 === 3 || Math.floor(index / 4) % width >= width / 2 ? 255 : 0);
const alphas = contourAlphas(width, height, rgba);
const alpha = (column: number, row: number) => alphas[row * width + column];

assert.equal(alpha(9, 5), 1, "the step between the halves is a full edge");
assert.equal(alpha(3, 5), 0, "flat black is no edge");
assert.equal(alpha(16, 5), 0, "flat white is no edge");
assert.ok(contourAlphas(width, height, new Uint8Array(width * height * 4)).every((value) => value === 0),
  "a flat picture has no outlines");
console.log("contours ok");
