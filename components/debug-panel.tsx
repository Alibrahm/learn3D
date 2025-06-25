"use client"

import { useEffect } from "react"

import { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logger } from "@/utils/logger"
import { Bug, Download, Trash2, Activity, Clock, AlertTriangle, TrendingUp, UserPlus } from "lucide-react"

export function DebugPanel() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show debug panel in development or when debug flag is set
    const showDebug =
      process.env.NODE_ENV === "development" ||
      localStorage.getItem("debug_mode") === "true" ||
      new URLSearchParams(window.location.search).has("debug")

    setIsVisible(showDebug)

    if (showDebug) {
      const updateAnalytics = () => {
        const analyticsData = logger.getAnalytics()

        // Add account tracking mock data for demonstration
        analyticsData.accountStats = {
          newAccountsToday: Math.floor(Math.random() * 10) + 1,
          newAccountsThisWeek: Math.floor(Math.random() * 50) + 20,
          totalStudents: Math.floor(Math.random() * 200) + 100,
          totalTeachers: Math.floor(Math.random() * 20) + 5,
          activeSessions: Math.floor(Math.random() * 15) + 3,
          registrationMethods: {
            email: Math.floor(Math.random() * 60) + 40,
            demo: Math.floor(Math.random() * 30) + 10,
            invite: Math.floor(Math.random() * 20) + 5,
          },
        }

        setAnalytics(analyticsData)
      }

      updateAnalytics()
      const interval = setInterval(updateAnalytics, 5000) // Update every 5 seconds

      return () => clearInterval(interval)
    }
  }, [])

  const downloadLogs = () => {
    try {
      const logs = logger.exportLogs()
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `app-logs-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      logger.trackAction("download_logs", "debug", { timestamp: new Date().toISOString() })
    } catch (error) {
      logger.error("debug_panel", "Failed to download logs", error)
    }
  }

  const clearLogs = () => {
    if (confirm("Are you sure you want to clear all logs? This cannot be undone.")) {
      logger.clearLogs()
      setAnalytics(logger.getAnalytics())
      logger.trackAction("clear_logs", "debug")
    }
  }

  const flushLogs = async () => {
    try {
      await logger.flushLogs()
      alert("Logs flushed successfully!")
      logger.trackAction("flush_logs", "debug")
    } catch (error) {
      logger.error("debug_panel", "Failed to flush logs", error)
      alert("Failed to flush logs. Check console for details.")
    }
  }

  if (!isVisible || !analytics) {
    return null
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return "text-green-600"
    if (rate >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Panel
            <Badge variant="outline" className="text-xs">
              {process.env.NODE_ENV}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">Session: {analytics.session.id.split("_")[1]}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="overview" className="space-y-2">
            <TabsList className="grid w-full grid-cols-5 h-8">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="accounts" className="text-xs">
                Accounts
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                Actions
              </TabsTrigger>
              <TabsTrigger value="errors" className="text-xs">
                Errors
              </TabsTrigger>
              <TabsTrigger value="perf" className="text-xs">
                Perf
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Actions: {analytics.stats.totalActions}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Session: {formatDuration(analytics.session.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className={getStatusColor(analytics.stats.actionSuccessRate)}>
                    Success: {analytics.stats.actionSuccessRate}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span className={analytics.stats.errorRate > 5 ? "text-red-600" : "text-green-600"}>
                    Errors: {analytics.stats.errorRate}%
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button onClick={downloadLogs} size="sm" variant="outline" className="text-xs h-6">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button onClick={flushLogs} size="sm" variant="outline" className="text-xs h-6">
                  Flush
                </Button>
                <Button onClick={clearLogs} size="sm" variant="destructive" className="text-xs h-6">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-2">
              <div className="text-xs space-y-2">
                <div className="font-medium flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Account Tracking
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>New Today:</span>
                    <Badge variant="secondary" className="text-xs">
                      {analytics.accountStats?.newAccountsToday || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>New This Week:</span>
                    <Badge variant="secondary" className="text-xs">
                      {analytics.accountStats?.newAccountsThisWeek || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Students:</span>
                    <Badge variant="outline" className="text-xs">
                      {analytics.accountStats?.totalStudents || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Teachers:</span>
                    <Badge variant="outline" className="text-xs">
                      {analytics.accountStats?.totalTeachers || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions:</span>
                    <Badge variant="default" className="text-xs">
                      {analytics.accountStats?.activeSessions || 1}
                    </Badge>
                  </div>
                </div>

                <div className="pt-1 border-t">
                  <div className="text-xs font-medium mb-1">Registration Methods:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Email:</span>
                      <span>{analytics.accountStats?.registrationMethods?.email || 0}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Demo:</span>
                      <span>{analytics.accountStats?.registrationMethods?.demo || 0}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Invite:</span>
                      <span>{analytics.accountStats?.registrationMethods?.invite || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-2">
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {analytics.topActions.map((action: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="truncate">{action.action}</span>
                      <Badge variant="secondary" className="text-xs">
                        {action.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="errors" className="space-y-2">
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {analytics.recentErrors.map((error: any, index: number) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-red-600 truncate">
                        {error.category}: {error.message}
                      </div>
                      <div className="text-gray-500 text-xs">{new Date(error.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {analytics.recentErrors.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-4">No recent errors 🎉</div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="perf" className="space-y-2">
              {analytics.performanceMetrics ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span>{analytics.performanceMetrics.averageDuration}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Duration:</span>
                    <span className={analytics.performanceMetrics.maxDuration > 1000 ? "text-red-600" : ""}>
                      {analytics.performanceMetrics.maxDuration}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operations:</span>
                    <span>{analytics.performanceMetrics.totalOperations}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">No performance data yet</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
