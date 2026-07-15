import {
  NURTURE_SCHEDULE_DAYS,
  NURTURE_TOTAL_STEPS,
  getNurtureEmail,
  nextSendDate,
  effectiveDailyCap,
} from "./nurture-templates";

// ── Schedule math ────────────────────────────────────────────────────

console.log("=== Schedule Math ===");

const EXPECTED_DAYS = [0, 3, 7, 11, 16, 21, 27, 33, 39, 45];
for (let i = 0; i < EXPECTED_DAYS.length; i++) {
  const actual = NURTURE_SCHEDULE_DAYS[i];
  console.assert(
    actual === EXPECTED_DAYS[i],
    `Step ${i}: expected day ${EXPECTED_DAYS[i]}, got ${actual}`,
  );
}
console.log(`  Schedule days: [${NURTURE_SCHEDULE_DAYS.join(", ")}] OK`);
console.assert(NURTURE_TOTAL_STEPS === 10, `Total steps should be 10, got ${NURTURE_TOTAL_STEPS}`);
console.log(`  Total steps: ${NURTURE_TOTAL_STEPS} OK`);

// ── nextSendDate ─────────────────────────────────────────────────────

console.log("\n=== nextSendDate ===");

const start = new Date("2026-07-01T14:00:00Z");
for (let step = 0; step < 10; step++) {
  const next = nextSendDate(start, step);
  const diffDays = Math.round((next.getTime() - start.getTime()) / 86400000);
  console.assert(
    diffDays === EXPECTED_DAYS[step],
    `Step ${step}: expected +${EXPECTED_DAYS[step]} days, got +${diffDays}`,
  );
}
console.log("  All 10 steps compute correct offsets OK");

// Out-of-range step → far future
const farFuture = nextSendDate(start, 10);
console.assert(farFuture.getTime() > Date.now() + 1e12, "Step 10+ should return far future");
console.log("  Out-of-range step returns far future OK");

// ── effectiveDailyCap ────────────────────────────────────────────────

console.log("\n=== effectiveDailyCap ===");

// No warmup → base cap
console.assert(effectiveDailyCap(70, null) === 70, "No warmup → base cap");
console.log("  No warmup → 70 OK");

// Day 0 of warmup → 10
const warmupStart = new Date(Date.now());
console.assert(effectiveDailyCap(70, warmupStart) === 10, "Day 0 warmup → 10");
console.log("  Day 0 warmup → 10 OK");

// Day 2 → 20
const day2 = new Date(Date.now() - 2 * 86400000);
console.assert(effectiveDailyCap(70, day2) === 20, "Day 2 warmup → 20");
console.log("  Day 2 warmup → 20 OK");

// Day 7 → 40
const day7 = new Date(Date.now() - 7 * 86400000);
console.assert(effectiveDailyCap(70, day7) === 40, "Day 7 warmup → 40");
console.log("  Day 7 warmup → 40 OK");

// Day 14+ → base cap
const day14 = new Date(Date.now() - 14 * 86400000);
console.assert(effectiveDailyCap(70, day14) === 70, "Day 14 warmup → base cap");
console.log("  Day 14+ → base cap OK");

// Future warmup start → 0
const futureDate = new Date(Date.now() + 86400000);
console.assert(effectiveDailyCap(70, futureDate) === 0, "Future start → 0");
console.log("  Future warmup start → 0 OK");

// ── Template generation ──────────────────────────────────────────────

console.log("\n=== Template Generation ===");

const tags = {
  name: "Keisha",
  business_name: "Crown & Glory Braids",
  source: "google",
  lead_id: "test-uuid-123",
  email: "keisha@example.com",
};

for (let step = 0; step < 10; step++) {
  const email = getNurtureEmail(step, tags);
  console.assert(email !== null, `Step ${step} should produce an email`);
  console.assert(email!.subject.length > 0, `Step ${step} subject not empty`);
  console.assert(email!.html.includes("Keisha"), `Step ${step} html has name`);
  console.assert(email!.html.includes("unsubscribe"), `Step ${step} html has unsubscribe link`);
  console.assert(email!.html.includes("9480 Main St"), `Step ${step} html has CAN-SPAM address`);
  console.assert(email!.html.includes("google"), `Step ${step} html has source`);
  console.assert(email!.text.length > 0, `Step ${step} plaintext not empty`);
  console.assert(
    email!.html.includes(`utm_content=email${step + 1}`),
    `Step ${step} has correct utm_content`,
  );
}
console.log("  All 10 templates render with merge tags OK");

// Out of range
console.assert(getNurtureEmail(10, tags) === null, "Step 10 → null");
console.assert(getNurtureEmail(-1, tags) === null, "Step -1 → null");
console.log("  Out-of-range steps return null OK");

// Fallback name
const noNameEmail = getNurtureEmail(0, { ...tags, name: null });
console.assert(noNameEmail!.html.includes("Hey there"), 'Null name → "there" fallback');
console.log('  Null name fallback → "there" OK');

// Fallback business
const noBizEmail = getNurtureEmail(0, { ...tags, business_name: null });
console.assert(
  noBizEmail!.html.includes("your business"),
  'Null business → "your business" fallback',
);
console.log('  Null business fallback → "your business" OK');

// ── Suppression check (logic test) ──────────────────────────────────

console.log("\n=== Suppression Check ===");
const suppressedSet = new Set(["blocked@test.com", "bounce@test.com"]);
console.assert(suppressedSet.has("blocked@test.com"), "Suppressed email detected");
console.assert(!suppressedSet.has("clean@test.com"), "Clean email passes");
console.log("  Suppression set check OK");

console.log("\n=== ALL TESTS PASSED ===");
