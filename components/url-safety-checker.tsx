"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Link2, Shield, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface URLCheckResult {
  url: string
  isSafe: boolean
  riskLevel: "safe" | "suspicious" | "dangerous"
  riskScore: number
  indicators: string[]
  redirectChain?: string[]
  finalDestination?: string
  isShortened?: boolean
  reason: string
  aiAnalysis?: string
  geminiVerdict?: "safe" | "suspicious" | "dangerous"
}

export function URLSafetyChecker() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<URLCheckResult | null>(null)

  const checkURL = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL")
      return
    }

    // Add protocol if missing
    let urlToCheck = url.trim()
    if (!urlToCheck.startsWith("http://") && !urlToCheck.startsWith("https://")) {
      urlToCheck = "https://" + urlToCheck
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToCheck }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to check URL")
      }

      const data: URLCheckResult = await response.json()
      setResult(data)

      // Show toast notification
      if (data.geminiVerdict === "safe") {
        toast.success("URL appears safe!")
      } else if (data.geminiVerdict === "suspicious") {
        toast.warning("URL has suspicious indicators")
      } else {
        toast.error("Dangerous URL detected!")
      }
    } catch (error) {
      console.error("URL check error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to check URL")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      checkURL()
    }
  }

  const getRiskColor = (level: "safe" | "suspicious" | "dangerous") => {
    switch (level) {
      case "safe":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "suspicious":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "dangerous":
        return "text-red-600 bg-red-50 border-red-200"
    }
  }

  const getRiskIcon = (level: "safe" | "suspicious" | "dangerous") => {
    switch (level) {
      case "safe":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case "dangerous":
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getRiskBadgeColor = (level: "safe" | "suspicious" | "dangerous") => {
    switch (level) {
      case "safe":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "suspicious":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "dangerous":
        return "bg-red-100 text-red-800 border-red-300"
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            URL Safety Checker
          </CardTitle>
          <CardDescription>
            Check if a link is safe before clicking. Detects phishing, malware, scams, and suspicious patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pl-10"
              />
            </div>
            <Button onClick={checkURL} disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Check URL
                </>
              )}
            </Button>
          </div>

          {/* Example URLs */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            <button
              onClick={() => setUrl("https://google.com")}
              className="text-sm text-blue-600 hover:underline"
            >
              google.com
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => setUrl("http://bit.ly/test")}
              className="text-sm text-blue-600 hover:underline"
            >
              bit.ly/test
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => setUrl("paypal-login.tk")}
              className="text-sm text-blue-600 hover:underline"
            >
              paypal-login.tk
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={`border-2 ${getRiskColor(result.riskLevel)} dark:bg-slate-900 dark:text-slate-50`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getRiskIcon(result.riskLevel)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg break-all text-foreground">{result.url}</CardTitle>
                  <CardDescription className="mt-1 dark:text-slate-400">
                    Security Analysis Complete
                  </CardDescription>
                </div>
              </div>
              <Badge className={getRiskBadgeColor(result.riskLevel)} variant="outline">
                {result.geminiVerdict?.toUpperCase() || result.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Score Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-foreground">
                <span className="font-medium">Risk Score</span>
                <span className="font-bold">{result.riskScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.riskLevel === "safe"
                      ? "bg-emerald-500"
                      : result.riskLevel === "suspicious"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
            </div>

            {/* AI Analysis */}
            {result.aiAnalysis && (
              <Alert className={`${getRiskColor(result.riskLevel)} dark:bg-slate-800 dark:border-slate-700`}>
                <Shield className="h-4 w-4" />
                <AlertDescription className="ml-2 text-foreground">
                  <strong>AI Security Analysis:</strong>
                  <p className="mt-2 text-foreground">{result.aiAnalysis}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Redirect Chain Display */}
            {result.redirectChain && result.redirectChain.length > 1 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <ExternalLink className="h-4 w-4" />
                  Redirect Chain ({result.redirectChain.length} hops)
                </h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  {result.redirectChain.map((redirectUrl, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-mono">
                        {index === 0 ? "🔗" : "→"}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 break-all font-mono">
                        {redirectUrl}
                      </span>
                      {index === result.redirectChain!.length - 1 && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">Final</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {result.isShortened && (
                  <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                    ⚠️ This shortened URL hides the real destination. Always verify the final URL before clicking.
                  </p>
                )}
              </div>
            )}

            {/* Security Indicators */}
            {result.indicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Security Concerns Detected ({result.indicators.length})
                </h4>
                <ul className="space-y-1 text-sm">
                  {result.indicators.map((indicator, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <span className="mt-0.5">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Recommendation */}
            <div className={`p-4 rounded-lg border ${getRiskColor(result.riskLevel)} dark:bg-slate-800/50`}>
              <h4 className="font-semibold text-sm mb-2 text-foreground">
                {result.riskLevel === "safe" ? "✅ Recommendation" : "⚠️ Warning"}
              </h4>
              <p className="text-sm text-foreground">
                {result.riskLevel === "safe" && (
                  "This URL appears safe to visit. However, always verify the domain matches what you expect."
                )}
                {result.riskLevel === "suspicious" && (
                  "Proceed with caution. This URL has concerning indicators. Verify the source before clicking."
                )}
                {result.riskLevel === "dangerous" && (
                  "DO NOT CLICK this link! It shows strong signs of being a phishing/malware site. Report if received via email."
                )}
              </p>
            </div>

            {/* Visit Link Button (only for safe/suspicious) */}
            {result.riskLevel !== "dangerous" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(result.url, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Link (Opens in New Tab)
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
