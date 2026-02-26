export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", message: msg, ...meta, timestamp: new Date().toISOString() })),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", message: msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", message: msg, ...meta, timestamp: new Date().toISOString() })),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function auditLog(supabase: any, userId: string, action: string, meta?: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({ user_id: userId, action, meta: meta ?? {} });
  if (error) logger.error("audit_log insert failed", { err: error, action, userId });
}
