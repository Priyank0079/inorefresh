/**
 * Verification — order bundling into groups of 10 (nearest / same area).
 * Run:  npm run verify:bundles
 *
 * Pure-logic test on buildBundles (no DB needed).
 */
import { buildBundles } from "../modules/warehouse/controllers/routeController";

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

function mkGeo(n: number, baseLat: number, baseLng: number) {
  return Array.from({ length: n }, (_, i) => ({
    _id: `geo${baseLat}_${i}`,
    deliveryAddress: { latitude: baseLat + i * 0.001, longitude: baseLng + i * 0.001, city: "GeoCity" },
  }));
}
function mkCity(n: number, city: string) {
  return Array.from({ length: n }, (_, i) => ({ _id: `${city}_${i}`, deliveryAddress: { city } }));
}

async function main() {
  let passed = true;

  // 25 geo-located + 7 in city X + 3 in city Y = 35 total
  const orders = [...mkGeo(25, 19.0, 72.8), ...mkCity(7, "CityX"), ...mkCity(3, "CityY")];
  const bundles = buildBundles(orders);

  console.log("\n[1] No bundle exceeds 10");
  const over = bundles.filter((b) => b.count > 10);
  if (over.length) { fail(`${over.length} bundle(s) exceed 10`); passed = false; }
  else ok(`all ${bundles.length} bundles ≤ 10 (sizes: ${bundles.map((b) => b.count).join(", ")})`);

  console.log("\n[2] Every order is bundled exactly once");
  const totalInBundles = bundles.reduce((s, b) => s + b.count, 0);
  const uniqueIds = new Set(bundles.flatMap((b) => b.orderIds));
  if (totalInBundles !== 35 || uniqueIds.size !== 35) { fail(`expected 35, got ${totalInBundles} (unique ${uniqueIds.size})`); passed = false; }
  else ok("all 35 orders bundled, no duplicates");

  console.log("\n[3] Geo orders form 10 + 10 + 5");
  const geoBundles = bundles.filter((b) => b.area === "GeoCity").map((b) => b.count).sort((a, b) => b - a);
  if (JSON.stringify(geoBundles) !== JSON.stringify([10, 10, 5])) { fail(`geo sizes ${geoBundles}`); passed = false; }
  else ok("geo → [10, 10, 5]");

  console.log("\n[4] City groups bundle separately (7 and 3)");
  const cityX = bundles.find((b) => b.area === "CityX")?.count;
  const cityY = bundles.find((b) => b.area === "CityY")?.count;
  if (cityX !== 7 || cityY !== 3) { fail(`CityX=${cityX}, CityY=${cityY}`); passed = false; }
  else ok("CityX=7, CityY=3");

  console.log("\n[5] 'ready' flag set only when count === 10");
  const badReady = bundles.filter((b) => b.ready !== (b.count >= 10));
  if (badReady.length) { fail("ready flag mismatch"); passed = false; }
  else ok("ready flag correct");

  console.log("\n" + "=".repeat(48));
  console.log(passed ? "\x1b[32m\x1b[1m✅ BUNDLES PASSED\x1b[0m" : "\x1b[31m\x1b[1m❌ BUNDLES FAILED\x1b[0m");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => { console.error("Script error:", e); process.exit(1); });
