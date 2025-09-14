import { BudgetGuard } from '../src/core/guards/BudgetGuard';

// simple in-memory KV is used under Node

test('budget guard caps spend per day', () => {
  const g = new BudgetGuard('t.budget', 't.limit');
  // @ts-ignore
  const { kv } = require('../src/core/storage/KV');
  kv.set('t.limit', '2');
  expect(g.canSpend(1)).toBe(true); g.spend(1);
  expect(g.canSpend(1)).toBe(true); g.spend(1);
  expect(g.canSpend(1)).toBe(false);
});