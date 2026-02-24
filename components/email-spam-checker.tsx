import { useState } from "react"
import { Mail, AlertTriangle, CheckCircle2, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface SpamCheckResult {
  email: string
  isSpam: boolean
  riskLevel: "safe" | "risky" | "invalid"
  spamScore: number
  indicators: string[]
  reason: string
  aiAnalysis?: string
  geminiVerdict?: "legitimate" | "suspicious" | "fake"
}

export function EmailSpamChecker() {
  const [email, setEmail] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<SpamCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to check email")
      }

      const data = await response.json()
      setResult(data)

      if (data.isSpam) {
        toast.warning(`Potential spam detected: ${data.reason}`)
      } else {
        toast.success("Email appears safe")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Check failed"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isChecking) {
      handleCheck()
    }
  }

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="Enter email address to check..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isChecking}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleCheck}
          disabled={isChecking || !email.trim()}
          className="gap-2 whitespace-nowrap"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Check Email
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card className="overflow-hidden border-0 shadow-md">
          {/* Header with risk level */}
          <div
            className={`p-4 ${
              result.riskLevel === "safe"
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : result.riskLevel === "risky"
                  ? "bg-amber-50 dark:bg-amber-950/30"
                  : "bg-red-50 dark:bg-red-950/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {result.riskLevel === "safe" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {result.email}
                </h3>
                <p
                  className={`text-sm ${
                    result.riskLevel === "safe"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : result.riskLevel === "risky"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {result.reason}
                </p>
              </div>
              <Badge
                variant={
                  result.riskLevel === "safe"
                    ? "default"
                    : result.riskLevel === "risky"
                      ? "secondary"
                      : "destructive"
                }
              >
                {result.riskLevel.charAt(0).toUpperCase() +
                  result.riskLevel.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Spam Score
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.spamScore <= 30
                        ? "bg-emerald-500"
                        : result.spamScore <= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${result.spamScore}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {result.spamScore}/100
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Risk Indicators
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {result.indicators.length}
                </p>
              </div>
            </div>

            {/* Indicators list */}
            {result.indicators.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                  Detected Issues:
                </p>
                <ul className="space-y-1">
                  {result.indicators.map((indicator, index) => (
                    <li
                      key={index}
                      className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-amber-600 dark:text-amber-400 mt-1">
                        •
                      </span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Analysis */}
            {result.aiAnalysis && (
              <div className={`p-4 rounded-lg border-2 ${
                result.geminiVerdict === "fake"
                  ? "border-red-500/30 bg-red-50/50 dark:bg-red-950/30"
                  : result.geminiVerdict === "suspicious"
                    ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30"
                    : "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30"
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  <div className={`text-lg font-bold ${
                    result.geminiVerdict === "fake"
                      ? "text-red-600 dark:text-red-400"
                      : result.geminiVerdict === "suspicious"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    🤖 AI Analysis
                  </div>
                  <Badge variant={
                    result.geminiVerdict === "fake"
                      ? "destructive"
                      : result.geminiVerdict === "suspicious"
                        ? "secondary"
                        : "default"
                  }>
                    {result.geminiVerdict?.toUpperCase() || "Unknown"}
                  </Badge>
                </div>
                <p className={`text-sm ${
                  result.geminiVerdict === "fake"
                    ? "text-red-700 dark:text-red-300"
                    : result.geminiVerdict === "suspicious"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300"
                }`}>
                  {result.aiAnalysis}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
