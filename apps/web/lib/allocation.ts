/**
 * Smart allocation algorithm: rule-based presets + EMA-based adaptive blending.
 * Server-side only unless user has E2E encryption enabled.
 */

export type Allocation = { spend: number; save: number; invest: number; keep?: number };

const ALPHA = 0.3; // EMA smoothing factor

type Preset = 'student' | 'standard' | 'aggressive';

const PRESETS: Record<Preset, Allocation> = {
  student: { spend: 70, save: 20, invest: 5, keep: 5 },
  standard: { spend: 50, save: 25, invest: 20, keep: 5 },
  aggressive: { spend: 40, save: 20, invest: 35, keep: 5 },
};

/**
 * Normalize allocation so percentages sum to 100.
 */
function normalize(a: Allocation): Allocation {
  const total = a.spend + a.save + a.invest + (a.keep ?? 0);
  if (total === 0) return PRESETS.standard;
  return {
    spend: Math.round((a.spend / total) * 100),
    save: Math.round((a.save / total) * 100),
    invest: Math.round((a.invest / total) * 100),
    keep: Math.round(((a.keep ?? 0) / total) * 100),
  };
}

/**
 * EMA blend: new = alpha * suggested + (1 - alpha) * previous.
 * w_ema growth: increase alpha slightly when user accepts (simplified: fixed alpha here).
 */
function blendEMA(suggested: Allocation, previous: Allocation | null): Allocation {
  if (!previous) return normalize(suggested);
  return normalize({
    spend: ALPHA * suggested.spend + (1 - ALPHA) * previous.spend,
    save: ALPHA * suggested.save + (1 - ALPHA) * previous.save,
    invest: ALPHA * suggested.invest + (1 - ALPHA) * previous.invest,
    keep: ALPHA * (suggested.keep ?? 0) + (1 - ALPHA) * (previous.keep ?? 0),
  });
}

/**
 * Suggest allocation for a user and amount.
 * In real impl: fetch user's primary_goal/profession and last allocation from DB.
 * Pseudo: const user = await supabase.from('users').select('primary_goal, profession').eq('clerk_id', clerkId).single();
 *        const last = await supabase.from('allocations').select('spend_pct, save_pct, invest_pct, keep_pct').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
 */
export async function suggestAllocation(
  clerkId: string,
  amount: number
): Promise<{ suggested: Allocation; reasoning: string; etaGoal?: string }> {
  // TODO: Load user profile and last allocation from DB (see comments above)
  const preset: Preset = 'standard';
  const previous: Allocation | null = null;
  const suggested = blendEMA(PRESETS[preset], previous);
  const reasoning = `Based on ${preset} preset and your history. Amount $${amount.toFixed(2)} allocated.`;
  const etaGoal = undefined; // TODO: compute from goals table
  return { suggested, reasoning, etaGoal };
}
