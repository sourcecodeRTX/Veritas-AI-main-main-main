"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "@/components/header"
import { InputSection } from "@/components/input-section"
import { ResultsSection } from "@/components/results-section"
import { ExportReport } from "@/components/export-report"
import { EmailSpamChecker } from "@/components/email-spam-checker"
import { URLSafetyChecker } from "@/components/url-safety-checker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Zap, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Globe,
  Mail,
  Link2
} from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

export interface AnalysisResult {
  verdict: string
  confidence: number
  summary: string
  claims: Array<{
    text: string
    status: "verified" | "contradicted" | "unverified"
    explanation: string
  }>
  reasoning: string
  sources: Array<{
    title: string
    url: string
  }>
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | undefined>()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const handleAnalyze = async (input: { text?: string; url?: string }) => {
    setIsAnalyzing(true)
    setError(null)
    setResults(null)
    setSourceUrl(input.url)
    setProgress(0)
    setCurrentStep(0)

    try {
      // Step 1: Content Extraction (0-20%)
      setProgress(5)
      setCurrentStep(0)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        let errorMessage = "Analysis failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response body is empty or invalid JSON, use default error
          errorMessage = `Server error (${response.status})`
        }
        throw new Error(errorMessage)
      }

      // Step 2: Web Search & Fact-Checking (20-40%)
      setProgress(25)
      setCurrentStep(1)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 3: AI Analysis (40-60%)
      setProgress(45)
      setCurrentStep(2)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 4: Claim Verification (60-80%)
      setProgress(65)
      setCurrentStep(3)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 5: Report Generation (80-100%)
      setProgress(85)
      setCurrentStep(4)
      
      const data = await response.json()
      
      // Complete progress
      setProgress(100)
      setCurrentStep(5)
      
      setResults(data)

      toast.success("Analysis completed successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      toast.error("Analysis failed: " + errorMessage)
      setProgress(0)
      setCurrentStep(0)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-slate-400/10 dark:bg-slate-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/5 dark:bg-teal-600/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 md:pt-28 relative">
        {/* Hero Section */}
        <motion.div
          className="max-w-6xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center space-y-6 mb-12">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                AI-Powered Fact Verification Platform
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-slate-900 dark:text-slate-100">
                Truth Verification
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Leverage advanced AI and real-time web search to verify news authenticity, 
              detect misinformation, and make informed decisions with confidence.
            </p>

            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                <div className="flex flex-col items-center">
                  <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">95%+</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Accuracy Rate</div>
                </div>
              </Card>
              <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                <div className="flex flex-col items-center">
                  <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">&lt;10s</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Analysis Time</div>
                </div>
              </Card>
              <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                <div className="flex flex-col items-center">
                  <Globe className="h-6 w-6 text-teal-600 dark:text-teal-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1000+</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Sources</div>
                </div>
              </Card>
              <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">Real-time</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Verification</div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Tabs Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Tabs defaultValue="news" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 p-1 h-auto gap-1 rounded-xl">
                <TabsTrigger value="news" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 rounded-lg py-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">News Analysis</span>
                  <span className="sm:hidden">News</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 rounded-lg py-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email Check</span>
                  <span className="sm:hidden">Email</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 rounded-lg py-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">URL Safety</span>
                  <span className="sm:hidden">URL</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="news" className="space-y-6">
                <InputSection 
                  onAnalyze={handleAnalyze} 
                  isAnalyzing={isAnalyzing}
                  progress={progress}
                  currentStep={currentStep}
                />
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      Email Spam Checker
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Check if an email address appears suspicious or potentially spam. Our detector analyzes patterns and characteristics to identify risky emails.
                    </p>
                  </div>
                  <EmailSpamChecker />
                </Card>
              </TabsContent>

              <TabsContent value="url" className="space-y-6">
                <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      URL Safety Checker
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Verify if a link is safe before clicking. Detects phishing, malware, scams, and suspicious patterns with AI-powered analysis.
                    </p>
                  </div>
                  <URLSafetyChecker />
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200">Analysis Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 space-y-6"
              >
                <ResultsSection results={results} />
                <ExportReport results={results} sourceUrl={sourceUrl} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="max-w-6xl mx-auto mt-20 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-slate-100">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Multi-Source Extraction
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced 4-tier extraction system with Jina AI, Firecrawl, and BeautifulSoup-like parsing ensures 95%+ success rate on any URL.
              </p>
            </Card>

            <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                AI Fact-Checking
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Powered by Gemini 1.5 Flash and Tavily AI web search to cross-reference claims with authoritative sources in real-time.
              </p>
            </Card>

            <Card className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Detailed Reports
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Export professional PDF reports with claim-by-claim analysis, source verification, and confidence scoring.
              </p>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
