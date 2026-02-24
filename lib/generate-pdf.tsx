import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { AnalysisResult } from '@/app/page';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  verdictSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  verdictBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
  },
  verdictTrue: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  verdictFalse: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  verdictPartial: {
    backgroundColor: '#fef3c7',
    color: '#854d0e',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: '#475569',
    marginRight: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 4,
  },
  text: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  claim: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeft: '3 solid #94a3b8',
  },
  claimVerified: {
    borderLeft: '3 solid #22c55e',
  },
  claimContradicted: {
    borderLeft: '3 solid #ef4444',
  },
  claimUnverified: {
    borderLeft: '3 solid #f59e0b',
  },
  claimText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  claimStatus: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statusVerified: {
    color: '#22c55e',
  },
  statusContradicted: {
    color: '#ef4444',
  },
  statusUnverified: {
    color: '#f59e0b',
  },
  claimExplanation: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  source: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  sourceTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  sourceUrl: {
    fontSize: 8,
    color: '#2563eb',
    textDecoration: 'none',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #cbd5e1',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  metadata: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
});

interface PDFReportProps {
  results: AnalysisResult;
  sourceUrl?: string;
  analysisDate?: Date;
}

const PDFReport: React.FC<PDFReportProps> = ({ results, sourceUrl, analysisDate }) => {
  const getVerdictStyle = (verdict: string) => {
    const lower = verdict.toLowerCase();
    if (lower.includes('true') || lower.includes('authentic')) {
      return styles.verdictTrue;
    }
    if (lower.includes('false') || lower.includes('misleading')) {
      return styles.verdictFalse;
    }
    return styles.verdictPartial;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return '#22c55e';
    if (confidence >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getClaimStyle = (status: string) => {
    if (status === 'verified') return styles.claimVerified;
    if (status === 'contradicted') return styles.claimContradicted;
    return styles.claimUnverified;
  };

  const getStatusStyle = (status: string) => {
    if (status === 'verified') return styles.statusVerified;
    if (status === 'contradicted') return styles.statusContradicted;
    return styles.statusUnverified;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Veritas AI - Fact Check Report</Text>
          <Text style={styles.subtitle}>
            Generated: {analysisDate ? analysisDate.toLocaleString() : new Date().toLocaleString()}
          </Text>
          {sourceUrl && (
            <Text style={styles.subtitle}>Source: {sourceUrl}</Text>
          )}
        </View>

        {/* Verdict Section */}
        <View style={styles.verdictSection}>
          <View style={[styles.verdictBadge, getVerdictStyle(results.verdict)]}>
            <Text>{results.verdict}</Text>
          </View>
          
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceText}>Confidence: {results.confidence}%</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${results.confidence}%`,
                    backgroundColor: getConfidenceColor(results.confidence)
                  }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.text}>{results.summary}</Text>
        </View>

        {/* Reasoning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Reasoning</Text>
          <Text style={styles.text}>{results.reasoning}</Text>
        </View>

        {/* Claims Analysis */}
        {results.claims && results.claims.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Claims Analysis ({results.claims.length})</Text>
            {results.claims.map((claim, index) => (
              <View key={index} style={[styles.claim, getClaimStyle(claim.status)]}>
                <Text style={styles.claimText}>{claim.text}</Text>
                <Text style={[styles.claimStatus, getStatusStyle(claim.status)]}>
                  {claim.status}
                </Text>
                <Text style={styles.claimExplanation}>{claim.explanation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sources */}
        {results.sources && results.sources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sources ({results.sources.length})</Text>
            {results.sources.map((source, index) => (
              <View key={index} style={styles.source}>
                <Text style={styles.sourceTitle}>{source.title}</Text>
                <Text style={styles.sourceUrl}>{source.url}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report was generated by Veritas AI, an automated fact-checking system.
          </Text>
          <Text style={styles.footerText}>
            Always verify critical information with multiple authoritative sources.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate and download a PDF report
 */
export async function generatePDFReport(
  results: AnalysisResult,
  sourceUrl?: string,
  analysisDate?: Date
): Promise<Blob> {
  const blob = await pdf(
    <PDFReport 
      results={results} 
      sourceUrl={sourceUrl} 
      analysisDate={analysisDate}
    />
  ).toBlob();
  
  return blob;
}

/**
 * Download PDF report to user's device
 */
export async function downloadPDFReport(
  results: AnalysisResult,
  sourceUrl?: string,
  analysisDate?: Date,
  filename?: string
): Promise<void> {
  const blob = await generatePDFReport(results, sourceUrl, analysisDate);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `veritas-report-${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default PDFReport;
