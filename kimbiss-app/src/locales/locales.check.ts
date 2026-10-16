// Self-check for the locale files: `npx tsx src/locales/locales.check.ts`.
// Both languages carry the same keys, and no dash stands in for punctuation
// (a hyphen inside a word, as German compounds need, is fine).
import assert from "node:assert/strict";
import de from "./de.json";
import en from "./en.json";

const LOOSE_DASH = /(^|\s)[—–-](\s|$)/;

type Tree = { [key: string]: string | Tree };

/** Every leaf string in a locale tree, keyed by its dotted path. */
function leaves(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : leaves(value, path);
  });
}

const keysOf = (tree: Tree) => leaves(tree).map(([path]) => path).sort();
assert.deepEqual(keysOf(de as Tree), keysOf(en as Tree), "de and en must have the same keys");

for (const [language, tree] of [["de", de], ["en", en]] as const) {
  const offenders = leaves(tree as Tree).filter(([, text]) => LOOSE_DASH.test(text));
  assert.deepEqual(offenders, [], `${language}: use a comma, colon or full stop instead of a dash`);
}

assert.equal(LOOSE_DASH.test("Foto — fertig"), true);
assert.equal(LOOSE_DASH.test("Foto-Schätzung"), false);
console.log("locales ok");
