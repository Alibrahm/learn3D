import type React from "react"

interface LearningDashboardProps {
  progress?: {
    completedLessons: string[]
    totalTimeSpent: number
  }
  currentModel?: string
  onProgressUpdate?: (progress: number) => void
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ progress, currentModel, onProgressUpdate }) => {
  return (
    <div>
      <h1>Learning Dashboard</h1>
      <p>Completed Lessons: {progress?.completedLessons.length || 0}</p>
      <p>Total Time Spent: {progress?.totalTimeSpent || 0} minutes</p>
    </div>
  )
}

export default LearningDashboard
