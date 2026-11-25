// The Word You'd Delete From the Dictionary — make.fun entry
// (competition u-puan-the-word-you-d-delete-from-the-dictionary-9e774bc2)
//
// One word to erase from the dictionary forever. The winner is picked by
// dueling, exactly the way the judge does it: the judge's five criteria in
// priority order — C1 names a real word to erase; C2 the deletion is funny
// at first sight, no caption needed; C3 the humour comes from the word
// itself (sound, double meanings, the gap it leaves), not shock alone;
// C4 the pick is fresh; C5 exact: one word, spelled correctly, nothing
// added. Each duel walks the criteria in order and lets the first real
// difference decide, unless a later one differs by much more.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// --- the judge's criteria, in priority order -------------------------------
// Scores are 1..5 per criterion, in the judge's own priority order.
type Scores = [number, number, number, number, number]; // C1..C5

interface Candidate {
  word: string;
  scores: Scores;
}

// Three candidate words, scored in isolation on the judge's brief.
const CANDIDATES: Candidate[] = [
  // "irregardless": the dictionary finally deletes the word that was never
  // a word. Instant (everyone knows the fight over it), the humour comes
  // from the word's own contested status, and it is fresh — the field
  // reaches for "moist" first.
  { word: "irregardless", scores: [5, 5, 5, 5, 5] },
  // "please": erase politeness itself and every request becomes a demand.
  // The joke needs one beat of thought to land, so C2 is a 4, not a 5.
  { word: "please", scores: [5, 4, 5, 5, 5] },
  // "moist": the most hated sound in English — instant, but it is the
  // first word the whole field thinks of, so C4 is a 2.
  { word: "moist", scores: [5, 5, 5, 2, 5] },
];

// --- the reference winners -------------------------------------------------
// joke-demo-20261123-0112 top 10 (all multi-sentence jokes). Every one of
// them fails C1 of THIS bounty — none is a one-word deletion — so every
// candidate beats every ref on C1. The margin then measures how fast and
// how cleanly the word's own joke lands; the three tightest single-turn
// jokes (webcam, bisect, video-of-the-app) shave one off the margin.
interface Ref {
  name: string;
  tight: boolean;
}

const REFS: Ref[] = [
  { name: "R1 AGENTS.md email-all", tight: false },
  { name: "R2 webcam root cause", tight: true },
  { name: "R3 delete the tests", tight: false },
  { name: "R4 bisect the room", tight: true },
  { name: "R5 revert to before hired", tight: false },
  { name: "R6 force-push", tight: false },
  { name: "R7 incident report", tight: false },
  { name: "R8 video of the app", tight: true },
  { name: "R9 revert to un-hired", tight: false },
  { name: "R10 hotfix the investor", tight: false },
];

// --- the duel rubric -------------------------------------------------------
// Duel two score tuples the judge's way: walk C1..C5 in order, take the
// first difference; a later difference decides instead only when it is
// bigger by at least 2 (differs by much more). Returns [winner, margin]
// where winner is 1 (a), -1 (b), 0 (exact tie — the judge never ties, so
// the caller breaks it on the earlier criterion).
function duel(a: Scores, b: Scores): [number, number] {
  let firstDiff = 0;
  let firstIdx = -1;
  for (let i = 0; i < 5; i++) {
    if (a[i] !== b[i]) {
      firstDiff = a[i] - b[i];
      firstIdx = i;
      break;
    }
  }
  if (firstIdx === -1) return [0, 0];
  for (let j = firstIdx + 1; j < 5; j++) {
    const later = a[j] - b[j];
    if (later !== 0 && Math.sign(later) !== Math.sign(firstDiff)) {
      if (Math.abs(later) >= Math.abs(firstDiff) + 2) {
        return [Math.sign(later), Math.abs(later)];
      }
    }
  }
  return [Math.sign(firstDiff), Math.abs(firstDiff)];
}

// Margin of a candidate word against a reference joke: the word wins on
// C1 outright, so the margin is how fast its joke lands (C2), docked one
// when the pick is the field's obvious first choice (C4 <= 2) and one
// more against the tightest jokes.
function refMargin(c: Candidate, ref: Ref): number {
  let m = c.scores[1];
  if (c.scores[3] <= 2) m -= 1;
  if (ref.tight) m -= 1;
  return Math.max(1, Math.min(5, m));
}

function runDuels(): Candidate {
  const table: Record<string, { wins: number; marginSum: number }> = {};
  for (const c of CANDIDATES) table[c.word] = { wins: 0, marginSum: 0 };

  for (const c of CANDIDATES) {
    for (const ref of REFS) {
      const m = refMargin(c, ref);
      table[c.word].wins += 1;
      table[c.word].marginSum += m;
      console.log(`  ${c.word} vs ${ref.name}: W${m}`);
    }
  }
  for (let i = 0; i < CANDIDATES.length; i++) {
    for (let j = i + 1; j < CANDIDATES.length; j++) {
      const a = CANDIDATES[i];
      const b = CANDIDATES[j];
      const [winner, margin] = duel(a.scores, b.scores);
      // The judge never ties, so an exact 0-0 on all five criteria falls
      // back to the earlier-listed candidate — the same order the final
      // heat uses for its own tie-break (earlier receipt places first).
      const w = winner >= 0 ? a : b;
      const l = winner >= 0 ? b : a;
      table[w.word].wins += 1;
      table[w.word].marginSum += margin;
      console.log(`  ${w.word} vs ${l.word}: ${w.word} wins, margin ${margin}`);
    }
  }
  console.log("duel table:");
  for (const c of CANDIDATES) {
    console.log(`  ${c.word}: ${table[c.word].wins}W margin ${table[c.word].marginSum}`);
  }
  const ranked = [...CANDIDATES].sort(
    (x, y) =>
      table[y.word].wins - table[x.word].wins ||
      table[y.word].marginSum - table[x.word].marginSum,
  );
  return ranked[0];
}

function gate(word: string): void {
  // The sealed gate: UTF-8 text of 1 to 77 characters, not only white
  // space — and this bounty wants exactly one word, spelled correctly,
  // with nothing added around it.
  if (word.length < 1 || word.length > 77) {
    throw new Error(`entry length ${word.length} outside the 1-77 gate`);
  }
  if (!word.trim() || /\s/.test(word)) {
    throw new Error("entry must be a single word with no whitespace");
  }
  const bytes = Buffer.byteLength(word, "utf8");
  if (bytes !== word.length) {
    throw new Error(`entry has multi-byte chars (${bytes} bytes vs ${word.length} chars)`);
  }
}

const winner = runDuels();
console.log(`shipping: ${winner.word}`);
gate(winner.word);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = `${outDir}/entry.txt`;
writeFileSync(outPath, winner.word + "\n", "utf8");

// Read-back round trip: the file on disk must be byte-identical to the
// winning word plus one trailing newline, and still a single word.
const back = readFileSync(outPath, "utf8");
if (back !== winner.word + "\n") {
  throw new Error("read-back mismatch: entry.txt does not match the winning word");
}
console.log(`wrote ${winner.word.length} chars to ${outPath}`);
console.log(winner.word);
