"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, CheckCircle, AlertCircle } from "lucide-react"
import { trackNewStudentAccount, trackUserActivity } from "@/utils/account-tracker"
import { logger } from "@/utils/logger"
import { generateUUID, validateUUID } from "@/utils/uuid"

interface AuthPanelProps {
  onLogin: (user: {
    id: string
    name: string
    email: string
    role: "student" | "teacher"
    classId?: string
  }) => void
}

export function AuthPanel({ onLogin }: AuthPanelProps) {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "teacher",
    classId: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Mock authentication - in real app, this would connect to your auth system
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser = {
        id: Date.now().toString(),
        name: loginForm.email.split("@")[0],
        email: loginForm.email,
        role: loginForm.email.includes("teacher") ? "teacher" : "student",
        classId: loginForm.email.includes("teacher") ? undefined : "class_001",
      }

      // Track login activity
      await trackUserActivity(mockUser.id, "user_login", {
        email: mockUser.email,
        role: mockUser.role,
        method: "email_password",
      })

      logger.info("authentication", "User logged in successfully", {
        userId: mockUser.id,
        role: mockUser.role,
        method: "login",
      })

      setMessage({ type: "success", text: "Login successful! Welcome back." })

      setTimeout(() => {
        //@ts-ignore
        onLogin(mockUser)
      }, 1000)
    } catch (error) {
      // logger.error("authentication", "Login failed", { error: error.message })
      setMessage({ type: "error", text: "Login failed. Please check your credentials." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate and validate UUID for the user
      const userId = generateUUID()
      validateUUID(userId)

      const newUser = {
        id: userId,
        name: signupForm.name,
        email: signupForm.email,
        role: signupForm.role,
        classId: signupForm.role === "student" ? signupForm.classId : undefined,
      }

      // Track new account creation
      const accountResult = await trackNewStudentAccount({
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        classId: newUser.classId,
        registrationMethod: "signup",
        referralSource: "direct",
      })

      if (accountResult.success) {
        logger.info("authentication", "New account created successfully", {
          userId: newUser.id,
          role: newUser.role,
          method: "signup",
        })

        setMessage({
          type: "success",
          text: `Account created successfully! Welcome to the platform, ${newUser.name}!`,
        })

        setTimeout(() => {
          onLogin(newUser)
        }, 1500)
      } else {
        throw new Error(accountResult.message)
      }
    } catch (error: any) {
      logger.error("authentication", "Signup failed", {
        error: error.message,
        formData: { ...signupForm, password: "[REDACTED]" },
      })
      setMessage({ type: "error", text: "Account creation failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: "student" | "teacher") => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const demoUser = {
        id: `demo_${role}_${Date.now()}`,
        name: role === "student" ? "Demo Student" : "Demo Teacher",
        email: `demo.${role}@example.com`,
        role,
        classId: role === "student" ? "demo_class" : undefined,
      }

      // Track demo account creation
      const accountResult = await trackNewStudentAccount({
        userId: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        classId: demoUser.classId,
        registrationMethod: "demo",
        referralSource: "demo_button",
      })

      logger.info("authentication", "Demo account created", {
        userId: demoUser.id,
        role: demoUser.role,
        method: "demo",
      })

      setMessage({
        type: "success",
        text: `Welcome to the demo! Exploring as a ${role}.`,
      })

      setTimeout(() => {
        onLogin(demoUser)
      }, 1000)
    } catch (error: any) {
      logger.error("authentication", "Demo login failed", { error: error.message, role })
      setMessage({ type: "error", text: "Demo login failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Learning Platform</h1>
          <p className="text-gray-600">Sign in to start your 3D design journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Choose your account type to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert
                className={`mb-4 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="Create a password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={signupForm.role === "student" ? "default" : "outline"}
                        onClick={() => setSignupForm({ ...signupForm, role: "student" })}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-user w-4 h-4 mr-2"
                        >
                          <path d="M19 21a8 8 0 0 0-16 0" />
                          <circle cx="12" cy="10" r="4" />
                        </svg>
                        Student
                      </Button>
                      <Button
                        type="button"
                        variant={signupForm.role === "teacher" ? "default" : "outline"}
                        onClick={() => setSignupForm({ ...signupForm, role: "teacher" })}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Teacher
                      </Button>
                    </div>
                  </div>
                  {signupForm.role === "student" && (
                    <div>
                      <Label htmlFor="classId">Class Code (Optional)</Label>
                      <Input
                        id="classId"
                        value={signupForm.classId}
                        onChange={(e) => setSignupForm({ ...signupForm, classId: e.target.value })}
                        placeholder="Enter class code"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 text-center mb-4">Try the demo:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("student")}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user w-4 h-4 mr-2"
                  >
                    <path d="M19 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="10" r="4" />
                  </svg>
                  Demo Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoLogin("teacher")}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Demo Teacher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
