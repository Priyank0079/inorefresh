// Static verification harness for the bug fixes.
// Run: node scratch/verify_fixes.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const checks = [
  // ── Fix #99/#100 — resend OTP countdown ──────────────────────────────
  {
    bug: '#99/#100 Delivery resend-OTP timer counts down & re-enables',
    file: 'frontend/src/modules/delivery/pages/DeliveryOrderDetail.tsx',
    must: [
      /useEffect\(\(\) => \{\s*if \(resendCooldown <= 0\) return;/,
      /setResendCooldown\(\(prev\) => \(prev <= 1 \? 0 : prev - 1\)\)/,
      /clearInterval\(timer\)/,
    ],
  },
  // ── Fix #76 — return item card clickable ─────────────────────────────
  {
    bug: '#76 Delivery "Total return item" card is clickable',
    file: 'frontend/src/modules/delivery/pages/DeliveryDashboard.tsx',
    must: [
      /title="Total return item have"[\s\S]{0,120}onClick=\{\(\) => navigate\("\/delivery\/orders\/return"\)\}/,
    ],
  },
  // ── Fix #113 — live count update ─────────────────────────────────────
  {
    bug: '#113 Delivery dashboard refreshes counts on socket event',
    file: 'frontend/src/modules/delivery/pages/DeliveryDashboard.tsx',
    must: [
      /const silentRefresh = async/,
      /window\.addEventListener\('delivery:orders-changed', onOrdersChanged\)/,
      /window\.removeEventListener\('delivery:orders-changed', onOrdersChanged\)/,
    ],
  },
  {
    bug: '#113 Notification socket broadcasts orders-changed event',
    file: 'frontend/src/hooks/useDeliveryOrderNotifications.ts',
    must: [
      /'new-order'[\s\S]{0,400}window\.dispatchEvent\(new CustomEvent\('delivery:orders-changed'\)\)/,
      /'order-accepted'[\s\S]{0,200}window\.dispatchEvent\(new CustomEvent\('delivery:orders-changed'\)\)/,
    ],
  },
  // ── Fix #12 — warehouse name alphanumeric ────────────────────────────
  {
    bug: '#12 Admin warehouse name alphanumeric validation',
    file: 'frontend/src/modules/admin/pages/AdminCreateSeller.tsx',
    must: [/\/\^\[a-zA-Z0-9\\s\]\+\$\/\.test\(formData\.warehouseName\.trim\(\)\)/],
  },
  // ── Fix #108 — port fish name alphabets only ─────────────────────────
  {
    bug: '#108 Port "Fish Name" accepts only letters/spaces',
    file: 'frontend/src/modules/port/pages/products/AddProduct.jsx',
    must: [/name="productName"[\s\S]{0,260}\/\^\[a-zA-Z\\s\]\*\$\/\.test\(e\.target\.value\)/],
  },
  // ── Fix #85 — single product fetch + loader ──────────────────────────
  {
    bug: '#85 User Category fetches products once (no category._id dep) + shows loader',
    file: 'frontend/src/modules/user/Category.tsx',
    must: [
      /const params: any = \{ category: id \};/,
      /\}, \[id, userLocation\?\.latitude, userLocation\?\.longitude\]\);/,
      /animate-spin rounded-full h-10 w-10 border-b-2 border-green-600/,
    ],
    mustNot: [/\}, \[id, category\?\._id, userLocation\]\);/, /return null;\s*\}\s*\n\s*if \(error/],
  },
];

let pass = 0, fail = 0;
for (const c of checks) {
  let src;
  try { src = read('/' + c.file); }
  catch { console.log(`❌ ${c.bug}\n     cannot read ${c.file}`); fail++; continue; }

  const missing = (c.must || []).filter((re) => !re.test(src));
  const present = (c.mustNot || []).filter((re) => re.test(src));

  if (missing.length === 0 && present.length === 0) {
    console.log(`✅ ${c.bug}`);
    pass++;
  } else {
    console.log(`❌ ${c.bug}`);
    missing.forEach((re) => console.log(`     MISSING: ${re}`));
    present.forEach((re) => console.log(`     SHOULD-NOT-EXIST: ${re}`));
    fail++;
  }
}
console.log(`\n──────────────\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
