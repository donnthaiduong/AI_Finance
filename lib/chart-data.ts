export type CashDay = { day: number; due: number; baseline: number; stressed: number; shortfall: number };

/** End-of-day cash is constant until the next day's scheduled change. */
export function cashSteps(rows: CashDay[], key: 'baseline' | 'stressed'): [number, number][] {
  return rows.flatMap(row => [[row.day, row[key]], [row.day + 1, row[key]]] as [number, number][]);
}

/** Weekly OHLC of simulated cash, including the opening balance; no intraday prices. */
export function cashCandles(rows: CashDay[], opening: number) {
  return Array.from({ length: Math.ceil(rows.length / 7) }, (_, i) => {
    const week = rows.slice(i * 7, i * 7 + 7);
    const open = i ? rows[i * 7 - 1].stressed : opening;
    const values = [open, ...week.map(row => row.stressed)];
    return { start: week[0].day, end: week.at(-1)!.day, open,
      high: Math.max(...values), low: Math.min(...values), close: week.at(-1)!.stressed };
  });
}

/** Integer-cent bin edges: left inclusive, right exclusive; the last edge is inclusive. */
export function cashHistogram(rows: CashDay[]) {
  if (!rows.length) return [];
  const values = rows.map(row => Math.round(row.stressed * 100));
  const min = Math.min(...values), max = Math.max(...values);
  const count = min === max ? 1 : Math.min(4, max - min + 1);
  const width = Math.max(1, Math.ceil((max - min) / count));
  const bins = Array.from({ length: count }, (_, i) => ({ low: (min + i * width) / 100,
    high: (min + (i + 1) * width) / 100, days: [] as number[] }));
  rows.forEach((row, i) => bins[Math.min(count - 1, Math.floor((values[i] - min) / width))].days.push(row.day));
  return bins;
}
