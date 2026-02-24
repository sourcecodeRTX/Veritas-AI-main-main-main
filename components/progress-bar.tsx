"use client"

import { motion } from "framer-motion"
import { CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressStep {
  id: string
  label: string
  description: string
  completed: boolean
  active: boolean
}

interface ProgressBarProps {
  isVisible: boolean
  currentStep: number
  progress?: number
}

export function ProgressBar({ isVisible, currentStep, progress = 0 }: ProgressBarProps) {
  const steps: ProgressStep[] = [
    {
      id: "extraction",
      label: "Extracting Content",
      description: "Using multi-tier extraction (Jina AI → Firecrawl → Readability)",
      completed: currentStep > 0,
      active: currentStep === 0,
    },
    {
      id: "web-search",
      label: "Web Search & Fact-Checking",
      description: "Tavily AI searching for fact-checks and related news",
      completed: currentStep > 1,
      active: currentStep === 1,
    },
    {
      id: "ai-analysis",
      label: "AI Analysis",
      description: "Gemini 1.5 Flash analyzing claims and credibility",
      completed: currentStep > 2,
      active: currentStep === 2,
    },
    {
      id: "verification",
      label: "Claim Verification",
      description: "Cross-referencing with authoritative sources",
      completed: currentStep > 3,
      active: currentStep === 3,
    },
    {
      id: "report",
      label: "Generating Report",
      description: "Compiling final analysis and verdict",
      completed: currentStep > 4,
      active: currentStep === 4,
    },
  ]

  if (!isVisible) return null

  const progressPercent = progress > 0 ? progress : ((currentStep + 1) / steps.length) * 100
  const activeStep = steps.find(s => s.active)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full max-w-5xl mx-auto mb-6"
    >
      <Card className="border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Analyzing Article</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {activeStep?.description || "Processing..."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(progressPercent)}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Complete</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center flex-1 min-w-[4.25rem]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                    step.completed 
                      ? "bg-emerald-500 text-white" 
                      : step.active 
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-800" 
                      : "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <p className={`text-xs text-center font-medium hidden md:block ${
                    step.active 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : step.completed 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}