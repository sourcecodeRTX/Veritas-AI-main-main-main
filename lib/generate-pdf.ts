"use client"

import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { AnalysisResult } from "@/app/page"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  verdict: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  verdictLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 4,
  },
  verdictValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    borderColor: "#bbf7d0",
    borderWidth: 1,
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
  },
  statLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  claimBox: {
    marginVertical: 10,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  claimLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 2,
  },
  claimText: {
    fontSize: 11,
    marginBottom: 6,
    color: "#111827",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  badgeVerified: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeContradicted: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeUnverified: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  reasoning: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#374151",
  },
  sourceItem: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 2,
    borderLeftColor: "#10b981",
  },
  sourceTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 9,
    color: "#0891b2",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
  },
})

export async function downloadPDFReport(
  results: AnalysisResult,
  sourceUrl: string | undefined,
  generatedDate: Date,
  filename: string
) {
  const verificationRate =
    results.claims.length > 0
      ? Math.round(
          (results.claims.filter((c) => c.status === "verified").length /
            results.claims.length) * 100
        )
      : 0

  const verifiedCount = results.claims.filter((c) => c.status === "verified").length
  const contradictedCount = results.claims.filter((c) => c.status === "contradicted").length
  const unverifiedCount = results.claims.filter((c) => c.status === "unverified").length

  const timestamp = generatedDate.toLocaleString()
  const claimElements: React.ReactNode[] = results.claims.slice(0, 10).map((claim, index) => {
    const claimBorderColor =
      claim.status === "verified"
        ? "#22c55e"
        : claim.status === "contradicted"
        ? "#ef4444"
        : "#f59e0b"

    const badgeStyle =
      claim.status === "verified"
        ? styles.badgeVerified
        : claim.status === "contradicted"
        ? styles.badgeContradicted
        : styles.badgeUnverified

    return React.createElement(
      View,
      {
        key: `claim-${index}`,
        style: [styles.claimBox, { borderLeftColor: claimBorderColor }],
      },
      React.createElement(Text, { style: styles.claimLabel }, `Claim ${index + 1}`),
      React.createElement(Text, { style: styles.claimText }, claim.text),
      React.createElement(
        Text,
        { style: [styles.statusBadge, badgeStyle] },
        claim.status.toUpperCase()
      ),
      React.createElement(Text, { style: styles.reasoning }, claim.explanation)
    )
  })

  if (results.claims.length > 10) {
    claimElements.push(
      React.createElement(Text, { key: "claims-more", style: styles.claimText }, `...and ${
        results.claims.length - 10
      } additional claims in full report`)
    )
  }

  const sourceElements: React.ReactNode[] =
    results.sources.length > 0
      ? [
          React.createElement(
            View,
            { key: "sources-section", style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Verified Sources"),
            ...results.sources.map((source, index) =>
              React.createElement(
                View,
                { key: `source-${index}`, style: styles.sourceItem },
                React.createElement(
                  Text,
                  { style: styles.sourceTitle },
                  `${index + 1}. ${source.title}`
                ),
                React.createElement(Text, { style: styles.sourceUrl }, source.url)
              )
            )
          ),
        ]
      : []

  const statCards = (
    values: Array<{ label: string; value: string }>,
    keyPrefix: string
  ): React.ReactNode[] =>
    values.map((stat, index) =>
      React.createElement(
        View,
        {
          key: `${keyPrefix}-${index}`,
          style: [
            styles.statCard,
            { marginRight: index === values.length - 1 ? 0 : 12 },
          ],
        },
        React.createElement(Text, { style: styles.statLabel }, stat.label),
        React.createElement(Text, { style: styles.statValue }, stat.value)
      )
    )

  const pdfDocument = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "Veritas AI - News Authenticity Report"),
        React.createElement(Text, { style: styles.subtitle }, `Generated: ${timestamp}`),
        React.createElement(
          Text,
          { style: styles.subtitle },
          "Powered by: Gemini 2.0 Flash AI, Tavily Search, Jina AI, Firecrawl"
        ),
        sourceUrl
          ? React.createElement(Text, { style: styles.subtitle }, `Source: ${sourceUrl}`)
          : null
      ),
      React.createElement(
        View,
        { style: styles.verdict },
        React.createElement(Text, { style: styles.verdictLabel }, "VERDICT"),
        React.createElement(Text, { style: styles.verdictValue }, results.verdict),
        React.createElement(
          View,
          { style: styles.statRow },
          ...statCards(
            [
              { label: "Confidence", value: `${results.confidence}%` },
              { label: "Verification Rate", value: `${verificationRate}%` },
            ],
            "verdict"
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.statRow },
        ...statCards(
          [
            { label: "Verified Claims", value: `${verifiedCount}` },
            { label: "Contradicted Claims", value: `${contradictedCount}` },
            { label: "Unverified Claims", value: `${unverifiedCount}` },
          ],
          "claims"
        )
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Executive Summary"),
        React.createElement(Text, { style: styles.claimText }, results.summary)
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Detailed Claim Analysis"),
        ...claimElements
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "AI Reasoning & Analysis"),
        React.createElement(Text, { style: styles.reasoning }, results.reasoning)
      ),
      ...sourceElements,
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          "This analysis was generated using Gemini 2.0 Flash AI, Tavily Search, Jina AI, and Firecrawl with Veritas AI's multi-tier fact-checking pipeline."
        ),
        React.createElement(
          Text,
          null,
          `Report generated by Veritas AI - News Authenticity Analyzer | ${new Date().getFullYear()}`
        )
      )
    )
  )

  try {
    const { pdf } = await import("@react-pdf/renderer")
    const blob = await pdf(pdfDocument).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("PDF generation failed", error)

    const fallback = `VERITAS AI - NEWS AUTHENTICITY REPORT\nGenerated: ${timestamp}\nVERDICT: ${results.verdict}\nCONFIDENCE: ${results.confidence}%\nVERIFICATION RATE: ${verificationRate}%\n\n${results.summary}`
    const fallbackBlob = new Blob([fallback], { type: "text/plain" })
    const fallbackUrl = URL.createObjectURL(fallbackBlob)
    const link = document.createElement("a")
    link.href = fallbackUrl
    link.download = filename.replace(/\.pdf$/, ".txt")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(fallbackUrl)
  }
}
