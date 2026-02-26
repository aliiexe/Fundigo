/**
 * Structured JSON logging to stdout. Errors reported to Sentry when SENTRY_DSN present.
 * Audit events should be written to audit_logs table for critical actions.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  console.log(JSON.stringify(payload));
  if (level === 'error' && typeof process !== 'undefined' && (process as NodeJS.Process).env?.SENTRY_DSN) {
    // Sentry capture is typically done via @sentry/nextjs in API route catch blocks
    // TODO: optional Sentry.captureException(meta?.err) here if needed
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};

/**
 * Write audit log to DB for critical events (export, delete, etc.).
 * Call from API routes: await auditLog(supabase, clerkId, 'data_export', { format: 'zip' });
 */
export async function auditLog(
  supabase: { from: (t: string) => { insert: (v: unknown) => Promise<{ error: unknown }> } },
  userId: string,
  action: string,
  meta?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    meta: meta ?? {},
  });
  if (error) logger.error('audit_log insert failed', { err: error, action, userId });
}
