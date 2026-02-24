"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Eye,
  Clock,
  BarChart3,
  FileText,
  LinkIcon,
  Users,
  Calendar,
} from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface ResultsSectionProps {
  results: AnalysisResult
}

export function ResultsSection({ results }: ResultsSectionProps) {
  const getVerdictColor = (verdict: string) => {
    const lower = verdict.toLowerCase()
    if (lower.includes("highly authentic") || lower.includes("mostly authentic")) {
      return "bg-success text-success-foreground"
    }
    if (lower.includes("highly misleading") || lower.includes("likely misleading")) {
      return "bg-destructive text-destructive-foreground"
    }
    if (lower.includes("partially authentic") || lower.includes("unverified")) {
      return "bg-warning text-warning-foreground"
    }
    return "bg-muted text-muted-foreground"
  }

  const getVerdictIcon = (verdict: string) => {
    const lower = verdict.toLowerCase()
    if (lower.includes("highly authentic") || lower.includes("mostly authentic")) {
      return <Shield className="h-6 w-6" />
    }
    if (lower.includes("highly misleading") || lower.includes("likely misleading")) {
      return <XCircle className="h-6 w-6" />
    }
    return <AlertCircle className="h-6 w-6" />
  }

  const getClaimIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "contradicted":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />
    }
  }

  const getClaimBadgeVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case "verified":
        return "default"
      case "contradicted":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success"
    if (confidence >= 60) return "text-warning"
    return "text-destructive"
  }

  const claimStats = {
    verified: results.claims.filter((c) => c.status === "verified").length,
    contradicted: results.claims.filter((c) => c.status === "contradicted").length,
    unverified: results.claims.filter((c) => c.status === "unverified").length,
    total: results.claims.length,
  }

  const verificationRate = claimStats.total > 0 ? (claimStats.verified / claimStats.total) * 100 : 0
  const getClaimRatio = (count: number) => (claimStats.total > 0 ? (count / claimStats.total) * 100 : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="border-border/50 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className={`p-6 text-center ${getVerdictColor(results.verdict)}`}>
              <div className="flex items-center justify-center gap-3 mb-3">
                {getVerdictIcon(results.verdict)}
                <h3 className="text-2xl md:text-3xl font-bold text-balance">{results.verdict}</h3>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 md:w-32 h-2 bg-black/20 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-current rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${results.confidence}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </div>
                  <span className="text-lg md:text-xl font-semibold">{results.confidence}% Confidence</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-3 border-t border-current/20 sm:grid-cols-3 sm:gap-2">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold">{claimStats.total}</div>
                  <div className="text-xs md:text-sm opacity-90">Claims</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold">{claimStats.verified}</div>
                  <div className="text-xs md:text-sm opacity-90">Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold">{results.sources.length}</div>
                  <div className="text-xs md:text-sm opacity-90">Sources</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Verification Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
                <span className="text-sm font-semibold">{claimStats.verified}</span>
              </div>
              <Progress value={getClaimRatio(claimStats.verified)} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Contradicted</span>
                </div>
                <span className="text-sm font-semibold">{claimStats.contradicted}</span>
              </div>
              <Progress value={getClaimRatio(claimStats.contradicted)} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Unverified</span>
                </div>
                <span className="text-sm font-semibold">{claimStats.unverified}</span>
              </div>
              <Progress value={getClaimRatio(claimStats.unverified)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Analysis Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{Math.round(verificationRate)}%</div>
                <div className="text-xs text-muted-foreground">Verification Rate</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{results.sources.length}</div>
                <div className="text-xs text-muted-foreground">Source Count</div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                Analysis completed
              </div>
              <div className="text-xs text-muted-foreground">{new Date().toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground leading-relaxed text-pretty text-base">{results.summary}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Shield className="h-5 w-5 text-primary" />
              Detailed Claim Analysis
              <Badge variant="outline" className="ml-0 w-full justify-center sm:ml-auto sm:w-auto">
                {results.claims.length} Claims Examined
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.claims.map((claim, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                className="border border-border/50 rounded-xl p-6 space-y-4 hover:bg-muted/30 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="mt-1 p-2 rounded-full bg-muted/50">{getClaimIcon(claim.status)}</div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <p className="font-medium text-pretty leading-relaxed text-base">{claim.text}</p>
                      <Badge variant={getClaimBadgeVariant(claim.status)} className="capitalize shrink-0">
                        {claim.status}
                      </Badge>
                    </div>
                    <Separator className="opacity-50" />
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{claim.explanation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Reasoning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Expert Analysis & Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="bg-muted/30 rounded-xl p-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-pretty text-base">
                  {results.reasoning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <LinkIcon className="h-5 w-5 text-primary" />
              Verification Sources
              <Badge variant="outline" className="ml-0 w-full justify-center sm:ml-auto sm:w-auto">
                {results.sources.length} References
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.sources.length > 0 ? (
                results.sources.map((source, index) => (
                  <motion.a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-pretty group-hover:text-foreground line-clamp-2 mb-1">
                        {source.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                  </motion.a>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-2">No External Sources Referenced</p>
                  <p className="text-sm">This analysis was based on internal knowledge and reasoning</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Calendar className="h-4 w-4" />
                <span>Analysis completed on {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                <span>Powered by Veritas AI</span>
                <Badge variant="outline" className="text-xs w-full justify-center sm:w-auto">
                  v1.0
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
