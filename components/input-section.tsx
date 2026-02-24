"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileText, AlertCircle, Sparkles, Globe, Link as LinkIcon, Shield, Search } from "lucide-react"
import { ProgressBar } from "./progress-bar"

interface InputSectionProps {
  onAnalyze: (input: { text?: string; url?: string }) => void
  isAnalyzing: boolean
  progress?: number
  currentStep?: number
}

export function InputSection({ onAnalyze, isAnalyzing, progress = 0, currentStep = 0 }: InputSectionProps) {
  const [activeTab, setActiveTab] = useState("url")
  const [textInput, setTextInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState("")

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith("http://") || url.startsWith("https://")
    } catch {
      return false
    }
  }

  const handleUrlChange = (value: string) => {
    setUrlInput(value)
    setUrlError("")

    if (value && !validateUrl(value)) {
      setUrlError("Please enter a valid URL starting with http:// or https://")
    }
  }

  const handleSubmit = async () => {
    if (activeTab === "text" && textInput.trim()) {
      onAnalyze({ text: textInput.trim() })
    } else if (activeTab === "url" && urlInput.trim()) {
      if (!validateUrl(urlInput.trim())) {
        setUrlError("Please enter a valid URL starting with http:// or https://")
        return
      }

      onAnalyze({ url: urlInput.trim() })
    }
  }

  const exampleUrls = [
    "https://www.bbc.com/news/technology",
    "https://www.reuters.com/world",
    "https://www.theguardian.com/international"
  ]

  const canSubmit = (activeTab === "text" && textInput.trim()) || (activeTab === "url" && urlInput.trim() && !urlError)

  return (
    <div className="space-y-6">
      <ProgressBar isVisible={isAnalyzing} currentStep={currentStep} progress={progress} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
          
          <CardContent className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Multi-Tier Verification System
                </span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 dark:bg-slate-800 p-1">
                <TabsTrigger
                  value="url"
                  className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Article URL</span>
                  <span className="sm:hidden">URL</span>
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Direct Text</span>
                  <span className="sm:hidden">Text</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="article-url" className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    News Article URL
                  </Label>
                  <div className="relative">
                    <Input
                      id="article-url"
                      type="url"
                      placeholder="https://example.com/article-to-verify"
                      value={urlInput}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      disabled={isAnalyzing}
                      className={`h-14 text-base pl-12 pr-4 border-2 ${urlError ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400" : "border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400"} rounded-xl transition-all`}
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                  
                  {urlError && (
                    <motion.div
                      className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {urlError}
                    </motion.div>
                  )}
                  
                  {/* Example URLs */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Try these examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exampleUrls.map((exampleUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleUrlChange(exampleUrl)}
                          disabled={isAnalyzing}
                          className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {new URL(exampleUrl).hostname}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">Powered by:</span> Jina AI • Firecrawl • Tavily Search • Gemini 1.5 Flash
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="article-text" className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Article Content
                  </Label>
                  <Textarea
                    id="article-text"
                    placeholder="Paste the complete article text here for instant fact-checking and verification..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="min-h-[240px] text-base resize-y border-2 border-slate-200 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 rounded-xl transition-all"
                    disabled={isAnalyzing}
                  />
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <p className="text-slate-600 dark:text-slate-400">Minimum 50 characters required</p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{textInput.length} characters</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    AI will analyze claims, verify sources, and provide detailed credibility assessment
                  </p>
                </div>
              </TabsContent>

              <motion.div
                className="pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isAnalyzing}
                  className="w-full h-14 text-base font-semibold gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 rounded-xl disabled:opacity-50"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Analyzing with AI + Web Search...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="flex items-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>Start Verification Analysis</span>
                    </motion.div>
                  )}
                </Button>
              </motion.div>

              {/* Info Footer */}
              <div className="flex flex-col items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-4 sm:flex-row sm:gap-6">
                <div className="flex items-center gap-1.5 text-center sm:text-left">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time verification</span>
                </div>
                <div className="flex items-center gap-1.5 text-center sm:text-left">
                  <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>Source cross-checking</span>
                </div>
                <div className="flex items-center gap-1.5 text-center sm:text-left">
                  <div className="h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
                  <span>Claim analysis</span>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
