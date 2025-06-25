"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Target, Clock, Zap, Trophy, Star } from "lucide-react"

interface LearningProgress {
  userId: string
  completedLessons: string[]
  completedExercises: string[]
  scores: Record<string, number>
  totalTimeSpent: number
  lastActivity: Date
}

interface ExercisePanelProps {
  currentModel: string | null
  progress: LearningProgress | null
  onProgressUpdate: (updates: Partial<LearningProgress>) => void
}

const challenges = [
  {
    id: "challenge_shapes",
    title: "🎯 Shape Detective",
    description: "Spot the shapes in everyday objects!",
    difficulty: "Beginner",
    timeLimit: 180, // 3 minutes
    category: "Shape Recognition",
    questions: [
      {
        id: "q1",
        question: "What basic 3D shape is a basketball? 🏀",
        options: ["Cube", "Sphere", "Cylinder", "Pyramid"],
        correct: 1,
        explanation: "A basketball is a sphere - it's round in all directions! Perfect for bouncing and rolling. ⚽",
      },
      {
        id: "q2",
        question: "A soda can is basically which shape? 🥤",
        options: ["Cube", "Sphere", "Cylinder", "Cone"],
        correct: 2,
        explanation:
          "Soda cans are cylinders - round with flat tops and bottoms. Great for rolling but stable when standing! 🥫",
      },
      {
        id: "q3",
        question: "What shapes would you combine to make a simple house? 🏠",
        options: ["Two spheres", "Cube + pyramid", "Three cylinders", "Cone + cube"],
        correct: 1,
        explanation: "A cube for the main structure and a pyramid for the roof - classic house design! 🏡",
      },
      {
        id: "q4",
        question: "An ice cream cone is which basic shape? 🍦",
        options: ["Cylinder", "Sphere", "Cone", "Cube"],
        correct: 2,
        explanation:
          "Ice cream cones are cone-shaped - wide at the top, pointy at the bottom. Perfect for holding ice cream! 🍨",
      },
    ],
  },
  {
    id: "challenge_design",
    title: "🎨 Design Challenge",
    description: "Test your design thinking skills!",
    difficulty: "Intermediate",
    timeLimit: 300, // 5 minutes
    category: "Design Thinking",
    questions: [
      {
        id: "q1",
        question: "You want to design a phone stand. What's the FIRST step?",
        options: [
          "Start modeling in 3D software",
          "Think about what problem you're solving",
          "Choose colors and materials",
          "Look up existing designs",
        ],
        correct: 1,
        explanation:
          "Always start with the problem! Understanding what you need helps guide all your design decisions. 🎯",
      },
      {
        id: "q2",
        question: "What makes a good 3D design for beginners?",
        options: [
          "Lots of complex details",
          "Simple shapes combined cleverly",
          "As many colors as possible",
          "The biggest size possible",
        ],
        correct: 1,
        explanation:
          "Simple shapes are your friends! Master the basics first, then add complexity. Even pros use simple shapes! 🔧",
      },
      {
        id: "q3",
        question: "When designing for 3D printing, what should you avoid?",
        options: ["Round edges", "Thick walls", "Floating parts with no support", "Simple shapes"],
        correct: 2,
        explanation:
          "Floating parts need support to print! Think about gravity - what would fall down during printing? 🏗️",
      },
    ],
  },
  {
    id: "challenge_printing",
    title: "🖨️ Print Master",
    description: "Master the art of 3D printing design!",
    difficulty: "Advanced",
    timeLimit: 420, // 7 minutes
    category: "3D Printing",
    questions: [
      {
        id: "q1",
        question: "What's the minimum wall thickness for most 3D printers?",
        options: ["0.1mm", "0.8mm", "2.0mm", "5.0mm"],
        correct: 1,
        explanation:
          "0.8mm is usually the minimum for strong, printable walls. Thinner walls might not print or could break easily! 💪",
      },
      {
        id: "q2",
        question: "What angle overhang can most printers handle without support?",
        options: ["90° (straight out)", "45° or less", "60° or less", "30° or less"],
        correct: 1,
        explanation:
          "45° is the magic number! Steeper overhangs usually need support structures. Think of it like a roof angle! 🏠",
      },
      {
        id: "q3",
        question: "Why are rounded edges better than sharp corners for 3D printing?",
        options: [
          "They look cooler",
          "They're stronger and print better",
          "They use less material",
          "They print faster",
        ],
        correct: 1,
        explanation:
          "Rounded edges (fillets) are stronger and reduce stress concentration. Sharp corners are weak points! 🔄",
      },
      {
        id: "q4",
        question: "What should you consider when orienting your model for printing?",
        options: [
          "Which way looks prettiest",
          "Layer lines and strength direction",
          "Using the least material",
          "Printing as fast as possible",
        ],
        correct: 1,
        explanation:
          "Layer lines are weak spots! Orient your model so forces act along layers, not across them. Think about how it'll be used! 🧭",
      },
    ],
  },
]

export function ExercisePanel({ currentModel, progress, onProgressUpdate }: ExercisePanelProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const isChallengeCompleted = (challengeId: string) => {
    return progress?.completedExercises?.includes(challengeId) || false
  }

  const startChallenge = (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId)
    if (!challenge) return

    setSelectedChallenge(challengeId)
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setTimeLeft(challenge.timeLimit)

    // Start timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          submitChallenge()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const submitChallenge = () => {
    if (!selectedChallenge || !progress || !onProgressUpdate) return

    try {
      const challenge = challenges.find((c) => c.id === selectedChallenge)
      if (!challenge) return

      // Calculate score
      let correct = 0
      challenge.questions?.forEach((question) => {
        if (answers[question.id] === question.correct) {
          correct++
        }
      })

      const score = challenge.questions?.length > 0 ? Math.round((correct / challenge.questions.length) * 100) : 0

      // Update progress
      const updatedExercises = [...(progress.completedExercises || [])]
      if (!updatedExercises.includes(selectedChallenge)) {
        updatedExercises.push(selectedChallenge)
      }

      const updatedScores = { ...(progress.scores || {}) }
      updatedScores[selectedChallenge] = score

      onProgressUpdate({
        completedExercises: updatedExercises,
        scores: updatedScores,
      })

      setShowResults(true)
    } catch (error) {
      console.error("Error submitting challenge:", error)
    }
  }

  const selectedChallengeData = challenges.find((c) => c.id === selectedChallenge)
  const currentQuestionData = selectedChallengeData?.questions[currentQuestion]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🏆"
    if (score >= 80) return "🌟"
    if (score >= 70) return "👍"
    if (score >= 60) return "👌"
    return "💪"
  }

  const getEncouragementMessage = (score: number) => {
    if (score >= 90) return "Amazing! You're a 3D design superstar! 🌟"
    if (score >= 80) return "Great job! You really know your stuff! 🎉"
    if (score >= 70) return "Nice work! You're getting the hang of this! 👏"
    if (score >= 60) return "Good effort! Keep practicing and you'll master it! 💪"
    return "Don't worry! Every expert was once a beginner. Try again! 🚀"
  }

  if (selectedChallenge && selectedChallengeData) {
    if (showResults) {
      const score = progress?.scores[selectedChallenge] || 0
      const correct = selectedChallengeData.questions.filter((q) => answers[q.id] === q.correct).length

      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Challenge Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-2">{getScoreEmoji(score)}</div>
              <div className="text-4xl font-bold mb-2">{score}%</div>
              <p className="text-gray-600 mb-2">
                {correct} out of {selectedChallengeData.questions.length} correct
              </p>
              <p className="text-lg font-medium text-blue-600">{getEncouragementMessage(score)}</p>
            </div>

            <div className="space-y-4">
              {selectedChallengeData.questions.map((question, index) => (
                <div key={question.id} className="p-4 rounded-lg border">
                  <div className="flex items-start gap-3 mb-3">
                    {answers[question.id] === question.correct ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Your answer:</span>{" "}
                          {question.options[answers[question.id]] || "Not answered"}
                        </p>
                        {answers[question.id] !== question.correct && (
                          <p className="text-green-600">
                            <span className="font-medium">Correct answer:</span> {question.options[question.correct]}
                          </p>
                        )}
                        <p className="text-blue-600 italic">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setSelectedChallenge(null)} variant="outline" className="flex-1">
                Back to Challenges
              </Button>
              <Button onClick={() => startChallenge(selectedChallenge)} className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {selectedChallengeData.title}
            </span>
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                  timeLeft < 30 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {selectedChallengeData.questions.length} •{" "}
            {selectedChallengeData.category}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={((currentQuestion + 1) / selectedChallengeData.questions.length) * 100} className="h-2" />

          {currentQuestionData && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-relaxed">{currentQuestionData.question}</h3>

              <RadioGroup
                value={answers[currentQuestionData.id]?.toString()}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestionData.id]: Number.parseInt(value) }))
                }
                className="space-y-3"
              >
                {currentQuestionData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </Button>

            {currentQuestion === selectedChallengeData.questions.length - 1 ? (
              <Button
                onClick={submitChallenge}
                disabled={answers[currentQuestionData?.id || ""] === undefined}
                className="bg-green-600 hover:bg-green-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Finish Challenge
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                disabled={answers[currentQuestionData?.id || ""] === undefined}
              >
                Next →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🎮 Fun Challenges</h2>
        <p className="text-gray-600 text-lg">Test your skills and earn achievements!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const isCompleted = isChallengeCompleted(challenge.id)
          const score = progress?.scores[challenge.id]

          return (
            <Card
              key={challenge.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{challenge.title}</span>
                  {isCompleted && <Star className="w-5 h-5 text-yellow-500" />}
                </CardTitle>
                <CardDescription className="text-base">{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        challenge.difficulty === "Beginner"
                          ? "default"
                          : challenge.difficulty === "Intermediate"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-sm"
                    >
                      {challenge.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(challenge.timeLimit / 60)} min
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{challenge.questions.length} questions</span> • {challenge.category}
                  </div>

                  {isCompleted && score && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-700 font-medium">Best Score:</span>
                      <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                        {getScoreEmoji(score)} {score}%
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => startChallenge(challenge.id)}
                    className="w-full"
                    variant={isCompleted ? "outline" : "default"}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {isCompleted ? "Play Again" : "Start Challenge"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {progress && progress.completedExercises.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Your Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.completedExercises.length}</div>
                <div className="text-sm opacity-90">Challenges Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.values(progress.scores).length > 0
                    ? Math.round(
                        Object.values(progress.scores).reduce((a, b) => a + b, 0) /
                          Object.values(progress.scores).length,
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm opacity-90">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.values(progress.scores).filter((score) => score >= 90).length}
                </div>
                <div className="text-sm opacity-90">Perfect Scores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {progress.completedExercises.length >= 3
                    ? "🏆"
                    : progress.completedExercises.length >= 1
                      ? "🌟"
                      : "🚀"}
                </div>
                <div className="text-sm opacity-90">Current Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
