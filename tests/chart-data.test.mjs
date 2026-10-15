import test from 'node:test';
import assert from 'node:assert/strict';
import { cashSteps, cashCandles, cashHistogram } from '../work/chart-data.mjs';
import { calculatePortfolio } from '../work/portfolio.mjs';
import { examplePortfolio } from '../work/example-portfolio.mjs';

test('range edges preserve daily values and the exact recovery step', () => {
  const { daily } = calculatePortfolio(examplePortfolio());
  const steps = cashSteps(daily, 'stressed');
  assert.deepEqual(steps.slice(40, 44), [[21, -17000], [22, -17000], [22, 55000], [23, 55000]]);
  assert.deepEqual(steps.at(-1), [31, 30000]);
  assert.ok(daily.every(row => row.stressed <= row.baseline));
});

test('weekly cash candles include opening cash, recovery and the partial final week', () => {
  const result = calculatePortfolio(examplePortfolio());
  const candles = cashCandles(result.daily, result.accessibleNow);
  assert.deepEqual(candles[0], { start: 1, end: 7, open: 108000, high: 108000, low: 23000, close: 23000 });
  assert.deepEqual(candles[3], { start: 22, end: 28, open: -17000, high: 55000, low: -17000, close: 30000 });
  assert.deepEqual(candles.at(-1), { start: 29, end: 30, open: 30000, high: 30000, low: 30000, close: 30000 });
  assert.deepEqual(cashCandles([], 0), []);
});

test('histogram counts every day exactly once, including cents and edge values', () => {
  const cases = [[-0.02,-0.01,0,0.01,0.02], [0,0,0], [-10,0,10], [10000000000,10000000000.01], []];
  for (const values of cases) {
    const rows = values.map((stressed, i) => ({ day: i + 1, stressed, baseline: stressed, due: 0, shortfall: 0 }));
    const bins = cashHistogram(rows);
    assert.deepEqual(bins.flatMap(bin => bin.days).sort((a,b)=>a-b), rows.map(row=>row.day));
    bins.forEach((bin, i) => bin.days.forEach(day => {
      const cents = Math.round(rows[day-1].stressed * 100);
      assert.ok(cents >= Math.round(bin.low*100));
      assert.ok(i === bins.length-1 ? cents <= Math.round(bin.high*100) : cents < Math.round(bin.high*100));
    }));
  }
});
