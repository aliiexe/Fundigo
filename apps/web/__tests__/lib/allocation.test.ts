/**
 * Unit test skeleton for lib/allocation.ts
 * Run with: pnpm test
 */
import { suggestAllocation } from '@/lib/allocation';

describe('allocation', () => {
  it('returns suggested allocation with spend/save/invest/keep', async () => {
    const result = await suggestAllocation('clerk_test_123', 100);
    expect(result.suggested).toBeDefined();
    expect(result.suggested.spend).toBeGreaterThanOrEqual(0);
    expect(result.suggested.save).toBeGreaterThanOrEqual(0);
    expect(result.suggested.invest).toBeGreaterThanOrEqual(0);
    const total = result.suggested.spend + result.suggested.save + result.suggested.invest + (result.suggested.keep ?? 0);
    expect(total).toBe(100);
    expect(result.reasoning).toBeTruthy();
  });
});
