"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, History, Clock, ExternalLink, Trash2, Shield, ChevronLeft, ChevronRight, X, Plus, CheckCircle, XCircle, AlertCircle, Mail, Link2 } from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface HistoryItem {
  id: string
  timestamp: Date
  results: AnalysisResult
  sourceUrl?: string
  inputType: "text" | "url"
}

interface SidebarProps {
  onLoadHistory: (item: HistoryItem) => void
}

export function Sidebar({ onLoadHistory }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth < 768
      setIsMobile(isMobileScreen)
      if (isMobileScreen && isOpen) {
        setIsOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [isOpen])

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem("veritas-ai-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setHistory(parsed)
      } catch (error) {
        console.error("Failed to load history:", error)
      }
    }
  }, [])

  const saveToHistory = useCallback((results: AnalysisResult, sourceUrl?: string, inputType: "text" | "url" = "text") => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      results,
      sourceUrl,
      inputType,
    }

    setHistory((prevHistory) => {
      const updatedHistory = [newItem, ...prevHistory].slice(0, 10)

      try {
        localStorage.setItem("veritas-ai-history", JSON.stringify(updatedHistory))
      } catch (error) {
        console.error("Failed to save history:", error)
      }

      return updatedHistory
    })
  }, [])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("veritas-ai-history")
  }

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("veritas-ai-history", JSON.stringify(updatedHistory))
  }

  const getVerdictIcon = (verdict: string) => {
    const lower = verdict.toLowerCase()
    if (lower.includes("highly authentic") || lower.includes("mostly authentic")) {
      return <CheckCircle className="h-3 w-3 text-green-500" />
    }
    if (lower.includes("highly misleading") || lower.includes("likely misleading")) {
      return <XCircle className="h-3 w-3 text-red-500" />
    }
    return <AlertCircle className="h-3 w-3 text-yellow-500" />
  }

  const getVerdictColor = (verdict: string) => {
    const lower = verdict.toLowerCase()
    if (lower.includes("highly authentic") || lower.includes("mostly authentic")) {
      return "bg-green-500/10 text-green-600 border-green-500/20"
    }
    if (lower.includes("highly misleading") || lower.includes("likely misleading")) {
      return "bg-red-500/10 text-red-600 border-red-500/20"
    }
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
  }

  // Expose saveToHistory function globally
  useEffect(() => {
    ;(window as any).saveAnalysisToHistory = saveToHistory
  }, [saveToHistory])

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 transition-all duration-300 ${
          isOpen 
            ? "left-[16.75rem]" 
            : "left-4"
        } top-3.5 hover:bg-accent/80 h-10 w-10 p-0 rounded-xl bg-background/95 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl hover:scale-105`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Menu className="h-5 w-5" />
        </motion.div>
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: isMobile ? "-100%" : "-320px" }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? "-100%" : "-320px" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed top-0 left-0 h-full bg-gradient-to-b from-background/98 via-background/95 to-background/98 backdrop-blur-xl border-r border-border/50 z-40 ${
              isMobile ? "w-72" : "w-80"
            } shadow-2xl`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Veritas AI</h2>
                    <p className="text-xs text-muted-foreground font-medium">Analysis History</p>
                  </div>
                </div>
                {isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Navigation */}
              <div className="p-4 border-b border-border/50 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11 px-4 text-sm font-semibold hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 rounded-xl border border-transparent hover:border-emerald-500/20 transition-all duration-200 group"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    const textArea = document.querySelector('textarea') as HTMLTextAreaElement
                    const urlInput = document.querySelector('input[type="url"]') as HTMLInputElement
                    if (textArea) textArea.value = ''
                    if (urlInput) urlInput.value = ''
                    // Switch to news tab
                    const newsTab = document.querySelector('[value="news"]') as HTMLButtonElement
                    if (newsTab) newsTab.click()
                    if (isMobile) setIsOpen(false)
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all">
                    <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground">New News Analysis</span>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11 px-4 text-sm font-semibold hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 rounded-xl border border-transparent hover:border-amber-500/20 transition-all duration-200 group"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    // Switch to email tab
                    const emailTab = document.querySelector('[value="email"]') as HTMLButtonElement
                    if (emailTab) emailTab.click()
                    if (isMobile) setIsOpen(false)
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground">Check Email</span>
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-11 px-4 text-sm font-semibold hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 rounded-xl border border-transparent hover:border-blue-500/20 transition-all duration-200 group"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    // Switch to URL tab
                    const urlTab = document.querySelector('[value="url"]') as HTMLButtonElement
                    if (urlTab) urlTab.click()
                    if (isMobile) setIsOpen(false)
                  }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                    <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground">Check URL Safety</span>
                </Button>
              </div>

              {/* Recent Section */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <History className="h-3.5 w-3.5" />
                    Recent Analyses
                  </h3>
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive opacity-70 hover:opacity-100 transition-all rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 px-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4 border border-emerald-500/20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <History className="h-8 w-8 text-emerald-500/50" />
                    </motion.div>
                    <p className="text-sm text-foreground font-semibold mb-2">
                      No analyses yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 px-4 leading-relaxed">
                      Start analyzing news articles to see your history here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-accent/80 hover:to-accent/40 cursor-pointer transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-lg"
                        onClick={() => {
                          onLoadHistory(item)
                          if (isMobile) setIsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/30 group-hover:border-border/50 transition-all">
                              {getVerdictIcon(item.results.verdict)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-foreground/90 line-clamp-1 group-hover:text-foreground flex-1">
                                {item.results.verdict}
                              </h4>
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {item.results.confidence}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mb-2.5">
                              {item.results.summary}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-muted-foreground/60">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">{item.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </span>
                              {item.sourceUrl && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/30">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                                  <span className="font-mono text-xs text-muted-foreground/70 max-w-20 truncate">
                                    {new URL(item.sourceUrl).hostname.replace('www.', '')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer Stats */}
              {history.length > 0 && (
                <div className="border-t border-border/50 p-4 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30">
                      <div className="text-lg font-bold text-foreground">{history.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {history.filter(h => h.results.verdict.toLowerCase().includes('authentic')).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Verified</div>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {history.filter(h => h.results.verdict.toLowerCase().includes('misleading')).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Flagged</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
