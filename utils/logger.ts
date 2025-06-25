interface LogEntry {
  timestamp: Date
  level: "info" | "warn" | "error" | "debug"
  category: string
  message: string
  data?: any
  userId?: string
  sessionId: string
  userAgent: string
  url: string
  errorDetails?: {
    message: string
    data?: any
    stack?: string
    name?: string
  }
}

interface UserAction {
  timestamp: Date
  userId?: string
  sessionId: string
  action: string
  category: string
  data?: any
  duration?: number
  success: boolean
}

class Logger {
  private sessionId: string
  private userId?: string
  private logs: LogEntry[] = []
  private actions: UserAction[] = []
  private maxLogs = 1000
  private maxActions = 500

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeLogger()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeLogger() {
    // Listen for unhandled errors
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.error("unhandled_error", "Unhandled JavaScript error", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        })
      })

      window.addEventListener("unhandledrejection", (event) => {
        this.error("unhandled_promise_rejection", "Unhandled Promise rejection", {
          reason: event.reason,
          stack: event.reason?.stack,
        })
      })

      // Track page visibility changes
      document.addEventListener("visibilitychange", () => {
        this.trackAction("page_visibility_change", "navigation", {
          hidden: document.hidden,
        })
      })

      // Track page unload
      window.addEventListener("beforeunload", () => {
        this.flushLogs()
      })
    }
  }

  setUserId(userId: string) {
    this.userId = userId
    this.info("user_session", "User session started", { userId })
  }

  clearUserId() {
    if (this.userId) {
      this.info("user_session", "User session ended", { userId: this.userId })
    }
    this.userId = undefined
  }

  private createLogEntry(level: LogEntry["level"], category: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date(),
      level,
      category,
      message,
      data: this.sanitizeData(data),
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data

    try {
      // Remove sensitive information
      const sanitized = JSON.parse(JSON.stringify(data))

      // Remove passwords, tokens, etc.
      const sensitiveKeys = ["password", "token", "key", "secret", "auth"]
      const removeSensitive = (obj: any): any => {
        if (typeof obj !== "object" || obj === null) return obj

        if (Array.isArray(obj)) {
          return obj.map(removeSensitive)
        }

        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
            result[key] = "[REDACTED]"
          } else if (typeof value === "object") {
            result[key] = removeSensitive(value)
          } else {
            result[key] = value
          }
        }
        return result
      }

      return removeSensitive(sanitized)
    } catch (error) {
      return { error: "Failed to sanitize data", original: String(data) }
    }
  }

  info(category: string, message: string, data?: any) {
    const entry = this.createLogEntry("info", category, message, data)
    this.logs.push(entry)
    this.trimLogs()

    if (process.env.NODE_ENV === "development") {
      console.log(`[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`, entry.data)
    }
  }

  warn(category: string, message: string, data?: any) {
    const entry = this.createLogEntry("warn", category, message, data)
    this.logs.push(entry)
    this.trimLogs()

    console.warn(`[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`, entry.data)
  }

  error(category: string, message: string, data?: any) {
    // Ensure we have a proper message
    const errorMessage = message || "Unknown error occurred"

    // Create detailed error entry
    const entry = this.createLogEntry("error", category, errorMessage, {
      ...data,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      errorDetails: {
        message: errorMessage,
        data: data,
        stack: new Error().stack
      }
    })

    this.logs.push(entry)
    this.trimLogs()

    // Log to console with more details
    const logData = {
      ...entry.data,
      ...(entry.errorDetails ? {
        stack: entry.errorDetails.stack,
        errorName: entry.errorDetails.name,
        errorMessage: entry.errorDetails.message
      } : {})
    }

    console.error(`[${entry.level.toUpperCase()}] ${entry.category}: ${errorMessage}`, logData)

    // Store critical errors in localStorage for debugging
    try {
      const criticalErrors = JSON.parse(localStorage.getItem("app_critical_errors") || "[]")
      criticalErrors.push(entry)
      if (criticalErrors.length > 50) criticalErrors.shift()
      localStorage.setItem("app_critical_errors", JSON.stringify(criticalErrors))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  debug(category: string, message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      const entry = this.createLogEntry("debug", category, message, data)
      this.logs.push(entry)
      this.trimLogs()
      console.debug(`[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`, entry.data)
    }
  }

  trackAction(action: string, category: string, data?: any, startTime?: number): void {
    const actionEntry: UserAction = {
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      action,
      category,
      data: this.sanitizeData(data),
      duration: startTime ? Date.now() - startTime : undefined,
      success: true,
    }

    this.actions.push(actionEntry)
    this.trimActions()

    this.info("user_action", `User performed action: ${action}`, {
      category,
      data,
      duration: actionEntry.duration,
    })
  }

  trackError(action: string, category: string, error: any, data?: any, startTime?: number): void {
    const actionEntry: UserAction = {
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      action,
      category,
      data: this.sanitizeData({ ...data, error: error.message || String(error) }),
      duration: startTime ? Date.now() - startTime : undefined,
      success: false,
    }

    this.actions.push(actionEntry)
    this.trimActions()

    this.error("user_action_failed", `User action failed: ${action}`, {
      category,
      error: error.message || String(error),
      data,
      duration: actionEntry.duration,
    })
  }

  // Performance tracking
  startTimer(label: string): number {
    const startTime = Date.now()
    this.debug("performance", `Timer started: ${label}`, { startTime })
    return startTime
  }

  endTimer(label: string, startTime: number, category = "performance", data?: any): void {
    const duration = Date.now() - startTime
    this.info("performance", `Timer ended: ${label}`, {
      duration,
      category,
      ...data,
    })

    // Track slow operations
    if (duration > 1000) {
      this.warn("performance", `Slow operation detected: ${label}`, {
        duration,
        category,
        ...data,
      })
    }
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private trimActions() {
    if (this.actions.length > this.maxActions) {
      this.actions = this.actions.slice(-this.maxActions)
    }
  }

  // Get analytics data
  getAnalytics() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour

    const recentActions = this.actions.filter((a) => now - a.timestamp.getTime() < oneHour)
    const todayActions = this.actions.filter((a) => now - a.timestamp.getTime() < oneDay)

    const errorRate = this.logs.filter((l) => l.level === "error").length / Math.max(this.logs.length, 1)
    const actionSuccessRate = this.actions.filter((a) => a.success).length / Math.max(this.actions.length, 1)

    return {
      session: {
        id: this.sessionId,
        userId: this.userId,
        startTime: this.logs[0]?.timestamp,
        duration: this.logs.length > 0 ? now - this.logs[0].timestamp.getTime() : 0,
      },
      stats: {
        totalLogs: this.logs.length,
        totalActions: this.actions.length,
        recentActions: recentActions.length,
        todayActions: todayActions.length,
        errorRate: Math.round(errorRate * 100),
        actionSuccessRate: Math.round(actionSuccessRate * 100),
      },
      topActions: this.getTopActions(),
      recentErrors: this.logs.filter((l) => l.level === "error").slice(-10),
      performanceMetrics: this.getPerformanceMetrics(),
    }
  }

  private getTopActions() {
    const actionCounts: Record<string, number> = {}
    this.actions.forEach((action) => {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1
    })

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))
  }

  private getPerformanceMetrics() {
    const performanceLogs = this.logs.filter((l) => l.category === "performance" && l.data?.duration)

    if (performanceLogs.length === 0) return null

    const durations = performanceLogs.map((l) => l.data.duration).filter((d) => typeof d === "number")
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)

    return {
      averageDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      totalOperations: durations.length,
    }
  }

  // Export logs for debugging
  exportLogs() {
    return {
      logs: this.logs,
      actions: this.actions,
      analytics: this.getAnalytics(),
    }
  }

  // Flush logs to external service (placeholder)
  async flushLogs() {
    try {
      // In a real app, you'd send this to your logging service
      const exportData = this.exportLogs()

      // Store in localStorage as backup
      localStorage.setItem(
        "app_logs_backup",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          data: exportData,
        }),
      )

      this.debug("logger", "Logs flushed successfully", {
        logCount: this.logs.length,
        actionCount: this.actions.length,
      })

      // In production, you might send to a service like:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(exportData)
      // })
    } catch (error) {
      console.error("Failed to flush logs:", error)
    }
  }

  // Clear all logs (for privacy/GDPR compliance)
  clearLogs() {
    this.logs = []
    this.actions = []
    localStorage.removeItem("app_logs_backup")
    localStorage.removeItem("app_critical_errors")
    this.info("logger", "All logs cleared")
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience functions for common logging patterns
export const logUserAction = (action: string, category: string, data?: any) => {
  logger.trackAction(action, category, data)
}

export const logError = (category: string, message: string, error: any, data?: any) => {
  logger.error(category, message, { error: error.message || String(error), ...data })
}

export const logPerformance = (operation: string, duration: number, data?: any) => {
  logger.info("performance", `${operation} completed`, { duration, ...data })
}

export const withErrorLogging = <T extends any[], R>(fn: (...args: T) => R, category: string, action: string) => {
  return (...args: T): R => {
    const startTime = Date.now()
    try {
      const result = fn(...args)
      logger.trackAction(action, category, { args: args.length }, startTime)
      return result
    } catch (error) {
      logger.trackError(action, category, error, { args: args.length }, startTime)
      throw error
    }
  }
}

export const withAsyncErrorLogging = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  category: string,
  action: string,
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    try {
      const result = await fn(...args)
      logger.trackAction(action, category, { args: args.length }, startTime)
      return result
    } catch (error) {
      logger.trackError(action, category, error, { args: args.length }, startTime)
      throw error
    }
  }
}
