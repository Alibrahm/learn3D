"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, GraduationCap, TrendingUp, Activity, Clock } from "lucide-react"
import { getAccountStats, trackUserActivity } from "@/utils/account-tracker"
import { logger } from "@/utils/logger"

interface AccountAnalyticsPanelProps {
  currentUser?: {
    id: string
    role: "student" | "teacher"
  }
}

export function AccountAnalyticsPanel({ currentUser }: AccountAnalyticsPanelProps) {
  const [stats, setStats] = useState<any>(null)
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week")
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadAccountStats()
    loadAnalytics()
  }, [timeframe])

  const loadAccountStats = async () => {
    try {
      setIsLoading(true)
      const accountStats = await getAccountStats(timeframe)
      setStats(accountStats)

      if (currentUser) {
        await trackUserActivity(currentUser.id, "view_account_analytics", {
          timeframe,
          statsViewed: true,
        })
      }
    } catch (error) {
      logger.error("account_analytics", "Failed to load account stats", { error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = () => {
    const analyticsData = logger.getAnalytics()
    setAnalytics(analyticsData)
  }

  const formatTimeframe = (timeframe: string) => {
    switch (timeframe) {
      case "day":
        return "Last 24 Hours"
      case "week":
        return "Last 7 Days"
      case "month":
        return "Last 30 Days"
      default:
        return "Last 7 Days"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Analytics</h2>
          <p className="text-gray-600">Track new account creation and user activity</p>
        </div>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === "day" ? "24h" : period === "week" ? "7d" : "30d"}
            </Button>
          ))}
        </div>
      </div>

      {/* Account Creation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total New Accounts</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{formatTimeframe(timeframe)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Students</p>
                <p className="text-2xl font-bold">{stats?.students || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Teachers</p>
                <p className="text-2xl font-bold">{stats?.teachers || 0}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.total > 0 ? Math.round((stats.teachers / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">{stats?.total > 0 ? "+" + Math.round(stats.total / 7) : "0"}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Accounts per day</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="session">Session Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Creation Timeline</CardTitle>
                <CardDescription>New accounts created over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Students</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${stats?.total > 0 ? (stats.students / stats.total) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats?.students || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Teachers</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${stats?.total > 0 ? (stats.teachers / stats.total) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats?.teachers || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration Methods</CardTitle>
                <CardDescription>How users are signing up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Email Signup</Badge>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Demo Access</Badge>
                    </div>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest account creation and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topActions?.slice(0, 5).map((action: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{action.action.replace(/_/g, " ")}</p>
                        <p className="text-sm text-gray-600">Performed {action.count} times</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{action.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold">{analytics?.stats?.recentActions || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{analytics?.stats?.actionSuccessRate || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">User actions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold">{analytics?.stats?.errorRate || 0}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">System errors</p>
              </CardContent>
            </Card>
          </div>

          {analytics?.session && (
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
                <CardDescription>Information about the current user session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Session ID</p>
                    <p className="text-sm text-gray-600 font-mono">{analytics.session.id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(analytics.session.duration / 1000 / 60)} minutes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-gray-600 font-mono">{analytics.session.userId || "Anonymous"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start Time</p>
                    <p className="text-sm text-gray-600">
                      {analytics.session.startTime ? new Date(analytics.session.startTime).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
