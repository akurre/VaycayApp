// Reproducible measurement for Task E acceptance criterion #6.
// Picks two viewports in the SAME cache bucket — base bounds at a bucket
// center, then shifted by 0.49 * step (worst-case shift before crossing the
// quantum boundary) — and runs the resolver's SQL path for each. The
// symmetric difference of the returned city-id sets, as a percentage of the
// smaller set, is the boundary-churn metric.
//
// With the resolver wired to pass quantized bounds as the SOLE SQL bounds
// (Option 2c in PR thread), both queries hit the same cache key and produce
// identical SQL inputs, so churn must be 0%.
//
// Run: DATABASE_URL=... [REGION=europe|usa|global] [STEP_DENOMINATOR=20] \
//      npx tsx scripts/measure-boundary-churn.ts

import { PrismaClient } from '@prisma/client';
import queryCityIds from '../src/utils/weatherQueries';
import quantizeBoundsForCacheKey from '../src/utils/quantizeBoundsForCacheKey';
import { BOUNDS_QUANTIZATION_STEP_DENOMINATOR } from '../src/const';
import type { Bounds } from '../src/types/boundsTypes';

async function main() {
  const prisma = new PrismaClient();
  const dateStr = '2020-03-15';

  // Zoom 5 over Europe: lat 35–65, long -10–30.
  // latSpan=30, longSpan=40, max=40 → step = 40/20 = 2°. Shift = 0.49 * 2 = 0.98°.
  // Region selectable via REGION env: europe | usa | global.
  // Base bounds are intentionally chosen so each edge sits at a bucket CENTER
  // for the natural span/20 step. This is the meaningful "worst-case shift
  // inside the same cache bucket" test — both views must share a cache key.
  const region = process.env.REGION ?? 'europe';
  const REGION_PRESETS: Record<string, Bounds> = {
    europe: { minLat: 36, maxLat: 64, minLong: 0, maxLong: 40 }, // span=40, step=2, all multiples of 2
    usa: { minLat: 27, maxLat: 48, minLong: -126, maxLong: -66 }, // span=60, step=3, all multiples of 3
    global: { minLat: -68, maxLat: 68, minLong: -170, maxLong: 170 }, // span=340, step=17, all multiples of 17
  };
  const baseBounds = REGION_PRESETS[region] ?? REGION_PRESETS.europe;
  console.log(`region = ${region}`);
  // Step is span/N; worst-case shift before quantum boundary = 0.49 * step.
  // STEP_DENOMINATOR env override for tuning experiments — must be a finite positive number.
  const stepDenominator = process.env.STEP_DENOMINATOR
    ? Number.parseFloat(process.env.STEP_DENOMINATOR)
    : BOUNDS_QUANTIZATION_STEP_DENOMINATOR;
  if (!Number.isFinite(stepDenominator) || stepDenominator <= 0) {
    throw new Error(
      `STEP_DENOMINATOR must be a positive number, got: ${process.env.STEP_DENOMINATOR}`
    );
  }
  const span = Math.max(baseBounds.maxLat - baseBounds.minLat, baseBounds.maxLong - baseBounds.minLong);
  const step = span / stepDenominator;
  const shift = Number((0.49 * step).toFixed(4));
  const shiftedBounds = {
    minLat: baseBounds.minLat + shift,
    maxLat: baseBounds.maxLat + shift,
    minLong: baseBounds.minLong + shift,
    maxLong: baseBounds.maxLong + shift,
  };

  // Mirror the resolver: SQL receives the quantized bounds, so two views in
  // the same cache bucket produce identical SQL inputs and identical sets.
  const quantizedA = quantizeBoundsForCacheKey(baseBounds);
  const quantizedB = quantizeBoundsForCacheKey(shiftedBounds);
  console.log(`quantizedA: ${JSON.stringify(quantizedA)}`);
  console.log(`quantizedB: ${JSON.stringify(quantizedB)}`);
  console.log(
    `same cache bucket: ${JSON.stringify(quantizedA) === JSON.stringify(quantizedB)}`
  );

  const setA = new Set(await queryCityIds({ prisma, dateStr, bounds: quantizedA }));
  const setB = new Set(await queryCityIds({ prisma, dateStr, bounds: quantizedB }));

  const onlyA = [...setA].filter((id) => !setB.has(id));
  const onlyB = [...setB].filter((id) => !setA.has(id));
  const symDiff = onlyA.length + onlyB.length;
  const smaller = Math.min(setA.size, setB.size);
  const churnPct = smaller === 0 ? 0 : (symDiff / smaller) * 100;

  console.log(`stepDenominator = ${stepDenominator} → step = ${step.toFixed(4)}° → shift = 0.49*step = ${shift}°`);
  console.log(`baseBounds: ${JSON.stringify(baseBounds)}`);
  console.log(`shiftedBounds (+${shift}° on all four edges): ${JSON.stringify(shiftedBounds)}`);
  console.log(`|A| = ${setA.size}`);
  console.log(`|B| = ${setB.size}`);
  console.log(`|A △ B| = ${symDiff}`);
  console.log(`smaller set = ${smaller}`);
  console.log(`boundary churn = ${churnPct.toFixed(2)}%`);
  console.log(`acceptance threshold ≤5%: ${churnPct <= 5 ? 'PASS' : 'FAIL — raise step to span/30 and rerun'}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
