type Level = "info" | "warn" | "error"
type LogData = Record<string, unknown>

function emit(level: Level, message: string, data?: LogData) {
  const entry = { ts: new Date().toISOString(), level, message, ...data }
  const line = JSON.stringify(entry)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  info:  (msg: string, data?: LogData) => emit("info",  msg, data),
  warn:  (msg: string, data?: LogData) => emit("warn",  msg, data),
  error: (msg: string, data?: LogData) => emit("error", msg, data),
}
