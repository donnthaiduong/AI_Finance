import type { PortfolioInput } from './portfolio';

export const examplePortfolio = (): PortfolioInput => ({
  positions: [
    { id: 'demo-a', bankName: 'Example bank A', cert: null, amount: 90000 },
    { id: 'demo-b', bankName: 'Example bank B', cert: null, amount: 60000 },
    { id: 'demo-c', bankName: 'Example bank C', cert: null, amount: 30000 },
  ],
  payments: [
    { id: 'salary', label: 'Payroll', day: 5, amount: 85000 },
    { id: 'supplier', label: 'Suppliers', day: 15, amount: 40000 },
    { id: 'operating', label: 'Operating costs', day: 25, amount: 25000 },
  ],
  affectedId: 'demo-a', unavailablePercent: 80, durationDays: 21,
});
