// --- ResponseListItem: Renders a single response's analysis and feedback ---
// --- Analysis interface: Defines the structure of analysis data for type safety ---
// --- SummaryScreen: Main analytics dashboard and summary for the interview session ---
  // --- Trend extraction config for extensibility and UI consistency ---
  // --- Compute all trends in a single pass for efficiency ---
  // --- Get the last analysis object for summary display ---
  // --- State for backend-driven sentiment/archetype results ---
  // --- Fetch missing backend analysis (sentiment/archetype) as needed ---
  // --- Aggregate scoring results for summary display ---
  // --- Render minimal analytics dashboard with trend visualizations ---
  // --- Render scoring results summary ---
  // --- Render final archetype alignment if available ---
  // --- Render list of all responses with analysis ---

// Extracted component for a single response list item
interface ResponseListItemProps {
  response: { analysis: Analysis; prompt: string };
  index: number;
  backendResult: { sentiment?: string; archetype?: string };
}

function ResponseListItem({ response, index, backendResult }: ResponseListItemProps) {
  const { analysis, prompt } = response;
  return (
  <li className="bg-gray-900 bg-opacity-60 rounded-lg p-4"> 
      {/* Question prompt */}
      <div className="text-sm text-gray-400 mb-1">Q{index + 1}: {prompt}</div>
      {/* Transcript */}
      <div className="text-base text-white mb-1">
        <span className="font-semibold">Transcript:</span> {analysis?.text ? analysis.text : <span className="italic text-gray-500">No transcript available</span>}
      </div>
      {/* Sentiment analysis (AI-driven, backend-powered) */}
      <div className="text-sm text-gray-300 mb-1">
        <span className="font-semibold">Sentiment:</span> {
          analysis?.sentiment_analysis_results?.[0]?.sentiment
          || backendResult?.sentiment
          || <span className="italic">N/A</span>
        }
      </div>
      {/* Emotion scores - show all available emotions, not just one */}
      <div className="text-sm text-gray-300 mb-1">
        <span className="font-semibold">Emotions:</span> {
          analysis?.emotion_scores && Object.keys(analysis.emotion_scores).length > 0
            ? Object.entries(analysis.emotion_scores)
                .map(([emotion, score]) => `${emotion}: ${score}`)
                .join(", ")
            : <span className="italic">N/A</span>
        }
      </div>
      {/* Archetype alignment for this response, if available or backend-driven */}
      {(analysis && ("archetype" in analysis) || backendResult?.archetype) && (
        <ArchetypeAlignment
          archetype={analysis?.archetype || backendResult?.archetype || ""}
          eqScore={analysis?.eqScore}
        />
      )}
    </li>
  );
}

import Sparkline from "./Sparkline";

import React, { useEffect, useState } from "react";
import { useAppState } from "./context/AppStateContext";
import ArchetypeAlignment from "./ArchetypeAlignment";
import AICoachPanel from "./AICoachPanel";
import { fetchSentiment, fetchArchetype } from "./api";
import { analytics } from './analytics';


interface Analysis {
  text?: string;
  eqScore?: number;
  sentiment_analysis_results?: { sentiment: string }[];
  emotion_scores?: Record<string, number>;
  voice_features?: { energy?: number };
  archetype?: string;
  feedback?: string;
}

interface SummaryScreenProps {
  responses: Array<{
    analysis: Analysis;
    prompt: string;
  }>;
  candidateName: string;
  onBack?: () => void;
}



// Example usage: compute and visualize metrics
// const metrics = analytics.computeAllMetrics(responses.map(r => r.analysis));
// const analyticsVisual = analytics.visualizeAll(metrics);

export default function SummaryScreen({ responses, candidateName, onBack }: SummaryScreenProps) {
  // Defensive: ensure responses is an array
  const safeResponses = Array.isArray(responses) ? responses : [];
  const hasAnyContent = safeResponses.some(r => r?.analysis && (r.analysis.text || typeof r.analysis.eqScore === 'number'));
  // If completely empty, render a minimal resilient shell so tests (and UX) still see the gratitude text.
  if (safeResponses.length === 0 || !hasAnyContent) {
    return (
      <div
        className="bg-black bg-opacity-90 rounded-2xl shadow-2xl p-10 max-w-2xl w-full flex flex-col items-center mt-8"
        style={{ boxShadow: '0 0 32px #00fff799, 0 0 8px #7f5cff', color: '#e6f7ff' }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Interview Summary</h2>
        <p className="mb-4 text-lg">Thank you, <span className="font-semibold" data-testid="candidate-name">{candidateName}</span>!</p>
        <div className="w-full mb-6 p-4 rounded-lg bg-gray-900 bg-opacity-70 flex flex-col items-center">
          <h3 className="font-semibold mb-2 text-cyan-300">Your Scoring Results</h3>
          <div className="flex flex-col gap-1 text-base text-white">
            <div><span className="font-semibold">Average EQ Score:</span> <span className="italic">N/A</span></div>
            <div><span className="font-semibold">Most Common Sentiment:</span> <span className="italic">N/A</span></div>
            <div><span className="font-semibold">Most Common Archetype:</span> <span className="italic">N/A</span></div>
          </div>
        </div>
        <div style={{ color: '#00fff7', fontWeight: 500, marginBottom: 24, textAlign: 'center' }}>
          <h3>AI Review & Role Fit Assessment</h3>
          <p>
            Not enough data was provided for a full analysis. Please answer more questions to generate analytics and recommendations tailored to Western &amp; Southern Financial Group.
          </p>
        </div>
        <section className="w-full mt-4 p-4 rounded-lg bg-gray-800 bg-opacity-80" key="analytics-section">
          <h2 className="text-xl font-semibold mb-2 text-cyan-300">Analytics</h2>
          <div className="text-gray-400 text-sm">No analytics available yet.</div>
        </section>
        {onBack && (
          <button
            onClick={onBack}
            className="animated-btn mt-6"
            aria-label="Back to main UI"
            style={{ background: '#222', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '0.7em 2em', border: '1px solid #00fff7', boxShadow: '0 0 8px #00fff7' }}
            title="Return to the main interview UI"
          >Back</button>
        )}
      </div>
    );
  }
  // const { dispatch } = useAppState();
  // --- Analytics integration ---
  const metrics = analytics.computeAllMetrics(safeResponses.map(r => r.analysis));
  const analyticsVisual = analytics.visualizeAll(metrics);
  // --- Export handlers ---
  function exportCSV() {
  const header = ['Prompt', 'Transcript', 'EQ Score', 'Sentiment', 'Emotions', 'Archetype', 'Feedback', 'Actionable Advice', 'Brand', 'EchoWorks Proprietary'];
  const metrics = analytics.computeAllMetrics(safeResponses.map(r => r.analysis));
    const emotionDiversity = metrics.find(m => m.name === 'Emotion Diversity')?.value;
    const avgSentiment = metrics.find(m => m.name === 'Average Sentiment (Positive %)')?.value;
    let advice = '';
    if (emotionDiversity && emotionDiversity > 4) {
      advice = 'Wide emotional intelligence. Strong asset for client-facing roles.';
    } else if (avgSentiment && avgSentiment > 70) {
      advice = 'Consistently positive. Valuable in advisory and client relations.';
    } else if (avgSentiment && avgSentiment < 40) {
      advice = 'Balance optimism with realism to build trust.';
    } else {
      advice = 'Leverage strengths and adapt for each client.';
    }
    const rows = responses.map(r => [
      r.prompt,
      r.analysis.text || '',
      r.analysis.eqScore ?? '',
      r.analysis.sentiment_analysis_results?.[0]?.sentiment || '',
      r.analysis.emotion_scores ? Object.entries(r.analysis.emotion_scores).map(([k, v]) => `${k}: ${v}`).join('; ') : '',
      r.analysis.archetype || '',
      r.analysis.feedback || '',
      advice,
      'Western & Southern Financial Group',
      'EchoWorks AI – Proprietary & Confidential'
    ]);
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EQ_Analytics_${candidateName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportJSON() {
  const metrics = analytics.computeAllMetrics(safeResponses.map(r => r.analysis));
    const emotionDiversity = metrics.find(m => m.name === 'Emotion Diversity')?.value;
    const avgSentiment = metrics.find(m => m.name === 'Average Sentiment (Positive %)')?.value;
    let advice = '';
    if (emotionDiversity && emotionDiversity > 4) {
      advice = 'Wide emotional intelligence. Strong asset for client-facing roles.';
    } else if (avgSentiment && avgSentiment > 70) {
      advice = 'Consistently positive. Valuable in advisory and client relations.';
    } else if (avgSentiment && avgSentiment < 40) {
      advice = 'Balance optimism with realism to build trust.';
    } else {
      advice = 'Leverage strengths and adapt for each client.';
    }
    const exportObj = {
      candidate: candidateName,
      brand: 'Western & Southern Financial Group',
      responses,
      advice,
      metrics,
      echoWorks: {
        proprietary: true,
        notice: 'EchoWorks AI – Proprietary & Confidential',
        differentiation: 'Sovereign, branded, actionable analytics. No third-party dilution.'
      }
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EQ_Analytics_${candidateName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportPDF() {
    // Dynamically import jsPDF only when user exports to reduce initial bundle size
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      // Add WS logo and EchoWorks proprietary branding
      doc.addImage('/ws-logo.svg', 'SVG', 10, 8, 18, 18);
      doc.setFontSize(16);
      doc.text(`EQ Analytics Summary for ${candidateName}`, 32, 15);
      doc.setFontSize(10);
      doc.setTextColor(127, 92, 255);
      doc.text('EchoWorks AI – Proprietary & Confidential', 32, 22);
      doc.setTextColor(0, 0, 0);
      let y = 25;
      responses.forEach((r, i) => {
        doc.setFontSize(12);
        doc.text(`Q${i + 1}: ${r.prompt}`, 10, y);
        y += 7;
        doc.text(`Transcript: ${r.analysis.text || ''}`, 12, y);
        y += 7;
        doc.text(`EQ Score: ${r.analysis.eqScore ?? 'N/A'}`, 12, y);
        y += 7;
        doc.text(`Sentiment: ${r.analysis.sentiment_analysis_results?.[0]?.sentiment || 'N/A'}`, 12, y);
        y += 7;
        // Add emotion scores
        const emotions = r.analysis.emotion_scores ? Object.entries(r.analysis.emotion_scores).map(([k, v]) => `${k}: ${v}`).join(", ") : 'N/A';
        doc.text(`Emotions: ${emotions}`, 12, y);
        y += 7;
        // Add archetype
        doc.text(`Archetype: ${r.analysis.archetype || 'N/A'}`, 12, y);
        y += 7;
        // Add feedback if available
        if (r.analysis.feedback) {
          doc.text(`Feedback: ${r.analysis.feedback}`, 12, y);
          y += 7;
        }
        y += 3;
        if (y > 270) { doc.addPage(); y = 15; }
      });
      // Add actionable advice and proprietary notice at the end
      y += 10;
      doc.setFontSize(13);
      doc.setTextColor(0, 255, 247);
      doc.text('Actionable Advice:', 10, y);
      y += 7;
      const metrics = analytics.computeAllMetrics(responses.map(r => r.analysis));
      const emotionDiversity = metrics.find(m => m.name === 'Emotion Diversity')?.value;
      const avgSentiment = metrics.find(m => m.name === 'Average Sentiment (Positive %)')?.value;
      let advice = '';
      if (emotionDiversity && emotionDiversity > 4) {
        advice = 'You demonstrated a wide range of emotional intelligence. This is a strong asset for client-facing roles.';
      } else if (avgSentiment && avgSentiment > 70) {
        advice = 'Your responses were consistently positive. This optimism is valuable in financial advisory and client relations.';
      } else if (avgSentiment && avgSentiment < 40) {
        advice = 'Consider balancing optimism with realism in your responses to build trust with clients.';
      } else {
        advice = 'Keep leveraging your strengths and continue to adapt your approach for each client scenario.';
      }
      doc.text(advice, 10, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(127, 92, 255);
      doc.text('EchoWorks AI – Proprietary & Confidential. Sovereign, branded, actionable analytics. No third-party dilution.', 10, y);
      doc.save(`EQ_Analytics_${candidateName.replace(/\s+/g, '_')}.pdf`);
    }).catch(err => {
      console.error('PDF export failed to load jsPDF', err);
    });
  }
  // --- Trend extraction config for extensibility and UI consistency ---
  const trendConfigs = [
    {
      key: 'eqTrend',
      label: 'EQ Score Trend',
      color: '#00fff7',
      min: undefined,
      max: undefined,
      extractor: (r: { analysis: Analysis }) => typeof r.analysis?.eqScore === 'number' ? r.analysis.eqScore : null,
    },
    {
      key: 'sentimentTrend',
      label: 'Sentiment Trend (−1=Neg, 0=Neutral, 1=Pos)',
      color: '#ff5c5c',
      min: -1,
      max: 1,
      extractor: (r: { analysis: Analysis }, i: number, backendResults: any) => {
        const s = r.analysis?.sentiment_analysis_results?.[0]?.sentiment || backendResults[i]?.sentiment;
        if (s === 'Positive') return 1;
        if (s === 'Negative') return -1;
        if (s === 'Neutral') return 0;
        return null;
      },
    },
    {
      key: 'joyTrend',
      label: 'Joy Trend (0-1)',
      color: '#ffd700',
      min: 0,
      max: 1,
      extractor: (r: { analysis: Analysis }) => r.analysis?.emotion_scores && typeof r.analysis.emotion_scores.joy === 'number' ? r.analysis.emotion_scores.joy : null,
    },
    {
      key: 'responseLengthTrend',
      label: 'Response Length Trend (chars)',
      color: '#00ff99',
      min: undefined,
      max: undefined,
      extractor: (r: { analysis: Analysis }) => typeof r.analysis?.text === 'string' ? r.analysis.text.length : null,
    },
    {
      key: 'voiceEnergyTrend',
      label: 'Voice Energy Trend (0-1)',
      color: '#1a8cff',
      min: 0,
      max: 1,
      extractor: (r: { analysis: Analysis }) => r.analysis?.voice_features && typeof r.analysis.voice_features.energy === 'number' ? r.analysis.voice_features.energy : null,
    },
    {
      key: 'angerTrend',
      label: 'Anger Trend (0-1)',
      color: '#ff4d6d',
      min: 0,
      max: 1,
      extractor: (r: { analysis: Analysis }) => r.analysis?.emotion_scores && typeof r.analysis.emotion_scores.anger === 'number' ? r.analysis.emotion_scores.anger : null,
    },
    {
      key: 'sadnessTrend',
      label: 'Sadness Trend (0-1)',
      color: '#7f5cff',
      min: 0,
      max: 1,
      extractor: (r: { analysis: Analysis }) => r.analysis?.emotion_scores && typeof r.analysis.emotion_scores.sadness === 'number' ? r.analysis.emotion_scores.sadness : null,
    },
  ];


  // Compute all trends in a single pass for efficiency
  // ...existing code...

  // Get the last analysis object for summary display
  const last = safeResponses.length > 0 ? safeResponses[safeResponses.length - 1].analysis : null;

  // State for backend-driven sentiment/archetype results
  const [backendResults, setBackendResults] = useState<{
    [idx: number]: { sentiment?: string; archetype?: string }
  }>({});

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // useEffect(() => {
  //   let isMounted = true;
  //   setLoading(false);
  //   setFetchError(null);
  //   const fetchAll = async () => {
  //     setLoading(true);
  //     try {
  //       await Promise.all(responses.map(async (r, i) => {
  //         const needsSentiment = !r.analysis?.sentiment_analysis_results?.[0]?.sentiment && r.analysis?.text;
  //         const needsArchetype = !r.analysis?.archetype && typeof r.analysis?.eqScore === 'number';
  //         if (needsSentiment || needsArchetype) {
  //           setBackendResults(prev => ({ ...prev, [i]: { ...prev[i] } }));
  //           if (needsSentiment) {
  //             try {
  //               const sentiment = await fetchSentiment(r.analysis.text ?? "");
  //               if (isMounted) setBackendResults(prev => ({ ...prev, [i]: { ...prev[i], sentiment } }));
  //             } catch (e) {
  //               if (isMounted) setFetchError('Error fetching sentiment');
  //               dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Error fetching sentiment' });
  //             }
  //           }
  //           if (needsArchetype) {
  //             try {
  //               const archetype = await fetchArchetype(r.analysis.eqScore ?? 0);
  //               if (isMounted) setBackendResults(prev => ({ ...prev, [i]: { ...prev[i], archetype } }));
  //             } catch (e) {
  //               if (isMounted) setFetchError('Error fetching archetype');
  //               dispatch({ type: 'SET_GLOBAL_ERROR', value: 'Error fetching archetype' });
  //             }
  //           }
  //         }
  //       }));
  //     } finally {
  //       if (isMounted) setLoading(false);
  //     }
  //   };
  //   fetchAll();
  //   return () => { isMounted = false; };
  // }, [responses]);

  // Aggregate scoring results
  const eqScores = safeResponses.map(r => r.analysis?.eqScore).filter(v => typeof v === 'number');
  const sentiments = safeResponses.map((r, i) => r.analysis?.sentiment_analysis_results?.[0]?.sentiment || backendResults[i]?.sentiment).filter((v): v is string => typeof v === 'string');
  const archetypes = safeResponses.map((r, i) => r.analysis?.archetype || backendResults[i]?.archetype).filter((v): v is string => typeof v === 'string');
  const avgEQ = eqScores.length ? Math.round(eqScores.reduce((a, b) => a + b, 0) / eqScores.length) : null;
  const sentimentCounts = sentiments.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostCommonSentiment = sentiments.length ? (Object.entries(sentimentCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] : null;
  const archetypeCounts = archetypes.reduce((acc, a) => { acc[a] = (acc[a] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostCommonArchetype = archetypes.length ? (Object.entries(archetypeCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] : null;

  // --- Advanced Reporting: Key Moments & Insights ---
  // Highest/lowest EQ
  const highestEQ = eqScores.length ? Math.max(...eqScores) : null;
  const lowestEQ = eqScores.length ? Math.min(...eqScores) : null;
  const highestEQIndex = eqScores.length ? responses.findIndex(r => r.analysis?.eqScore === highestEQ) : -1;
  const lowestEQIndex = eqScores.length ? responses.findIndex(r => r.analysis?.eqScore === lowestEQ) : -1;
  // Sentiment shifts
  let sentimentShift = null;
  if (sentiments.length > 1) {
    const first = sentiments[0];
    const last = sentiments[sentiments.length - 1];
    if (first !== last) sentimentShift = `${first} → ${last}`;
  }
  // Per-question archetype
  const perQuestionArchetype = safeResponses.map((r, i) => r.analysis?.archetype || backendResults[i]?.archetype || null);
  // Actionable insight example
  let actionableInsight = null;
  if (eqScores.length > 1 && highestEQIndex > -1 && lowestEQIndex > -1) {
    if (highestEQIndex > lowestEQIndex) {
      actionableInsight = "Your EQ improved as the interview progressed. Great adaptability!";
    } else if (highestEQIndex < lowestEQIndex) {
      actionableInsight = "Your strongest EQ moments were early on. Try to sustain that energy throughout.";
    }
  }

  // --- Modular trend extraction: compute all trends from config ---
  const trends: Record<string, number[]> = {};
  trendConfigs.forEach(cfg => {
  trends[cfg.key] = safeResponses.map((r, i) => cfg.extractor(r, i, backendResults)).filter((v: any) => v !== null) as number[];
  });

  // TTS: play summary aloud
  const speakSummary = () => {
    if ('speechSynthesis' in window) {
      let summary = `Interview summary for ${candidateName}. Average EQ Score: ${avgEQ ?? 'N/A'}. Most Common Sentiment: ${mostCommonSentiment ?? 'N/A'}. Most Common Archetype: ${mostCommonArchetype ?? 'N/A'}.`;
      window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(summary));
    }
  };

  // Animate summary reveal
  const [showAnim, setShowAnim] = useState(false);
  useEffect(() => {
    setShowAnim(false);
    const t = setTimeout(() => setShowAnim(true), 30);
    return () => clearTimeout(t);
  }, [responses, candidateName]);

  return (
    <div
      className="bg-black bg-opacity-90 rounded-2xl shadow-2xl p-10 max-w-2xl w-full flex flex-col items-center mt-8 animate-fade-in"
      style={{
        opacity: showAnim ? 1 : 0,
        transform: showAnim ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.9s cubic-bezier(.4,0,.2,1), transform 0.9s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 0 32px #00fff799, 0 0 8px #7f5cff',
        color: '#e6f7ff',
      }}
    >
      {/* Proprietary AI Coaching Panel */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <AICoachPanel eqScore={avgEQ ?? undefined} sentiment={mostCommonSentiment ?? undefined} archetype={mostCommonArchetype ?? undefined} />
      </div>
      {/* Always show a summary, even if responses are minimal */}
      {(!responses.length || responses.every(r => !r.analysis.text?.trim())) ? (
        <div style={{ color: '#00fff7', fontWeight: 500, marginBottom: 24, textAlign: 'center' }}>
          <h3>AI Review & Role Fit Assessment</h3>
          <p>
            Thank you for participating in the EQ Analytics Interview.<br />
            <b>AI Review:</b> Not enough data was provided for a full analysis. However, based on your engagement, you show willingness to participate and learn.<br />
            <b>Role Fit Recommendation:</b> Please complete more questions for a tailored assessment. At this stage, we recommend further participation to determine fit for client-facing, advisory, or analyst roles at Western & Southern Financial Group.
          </p>
        </div>
      ) : null}
      {/* Export and Back buttons */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={exportCSV}
          className="animated-btn"
          aria-label="Export as CSV"
          style={{ background: '#00fff7', color: '#222', fontWeight: 'bold', borderRadius: 8, padding: '0.7em 2em', boxShadow: '0 0 8px #00fff7' }}
          title="Download your analytics as a CSV file (Excel/Sheets compatible)"
        >Export CSV</button>
        <button
          onClick={exportJSON}
          className="animated-btn"
          aria-label="Export as JSON"
          style={{ background: '#7f5cff', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '0.7em 2em', boxShadow: '0 0 8px #7f5cff' }}
          title="Download your analytics as a JSON file (raw data)"
        >Export JSON</button>
        <button
          onClick={exportPDF}
          className="animated-btn"
          aria-label="Export as PDF"
          style={{ background: '#ffd700', color: '#222', fontWeight: 'bold', borderRadius: 8, padding: '0.7em 2em', boxShadow: '0 0 8px #ffd700' }}
          title="Download your analytics as a PDF report (print/share ready)"
        >Export PDF</button>
        {onBack && (
          <button
            onClick={onBack}
            className="animated-btn"
            aria-label="Back to main UI"
            style={{ background: '#222', color: '#fff', fontWeight: 'bold', borderRadius: 8, padding: '0.7em 2em', border: '1px solid #00fff7', boxShadow: '0 0 8px #00fff7' }}
            title="Return to the main interview UI"
          >Back</button>
        )}
      </div>
  {/* Advanced Reporting & Analytics Dashboard */}
      <div className="w-full mb-6 p-4 rounded-lg bg-gray-900 bg-opacity-70 flex flex-col items-center">
        <h3 className="font-semibold mb-2 text-cyan-300">Analytics Dashboard</h3>
        {loading && <div className="text-cyan-200 mb-2">Loading backend analysis...</div>}
        {fetchError && <div className="text-red-400 mb-2">{fetchError}</div>}
        {trendConfigs.map(cfg => (
          <React.Fragment key={cfg.key}>
            <div style={{ width: 200, marginBottom: 8 }} key={`${cfg.key}-sparkline`}>
              <Sparkline data={trends[cfg.key]} color={cfg.color} min={cfg.min} max={cfg.max} />
            </div>
            <div className="text-xs text-gray-400 mb-2" key={`${cfg.key}-label`}>{cfg.label}</div>
          </React.Fragment>
        ))}
      </div>
      {/* Advanced Reporting: Key Moments & Insights */}
      <div className="w-full mb-6 p-4 rounded-lg bg-gray-900 bg-opacity-80 flex flex-col items-center" style={{ boxShadow: '0 0 12px #ffd70055' }}>
        <h3 className="font-semibold mb-2 text-yellow-300" title="Key moments and actionable insights from your interview">Key Moments & Insights</h3>
        {typeof highestEQ === 'number' && highestEQIndex > -1 && (
          <div style={{ color: '#00fff7', marginBottom: 4 }} title="Your highest EQ moment">
            <b>Highest EQ:</b> Q{highestEQIndex + 1} ({highestEQ}) — "{responses[highestEQIndex]?.prompt}"
          </div>
        )}
        {typeof lowestEQ === 'number' && lowestEQIndex > -1 && (
          <div style={{ color: '#ff5c5c', marginBottom: 4 }} title="Your lowest EQ moment">
            <b>Lowest EQ:</b> Q{lowestEQIndex + 1} ({lowestEQ}) — "{responses[lowestEQIndex]?.prompt}"
          </div>
        )}
        {sentimentShift && (
          <div style={{ color: '#ffd700', marginBottom: 4 }} title="How your sentiment changed during the interview">
            <b>Sentiment Shift:</b> {sentimentShift}
          </div>
        )}
        {perQuestionArchetype.some(a => a) && (
          <div style={{ color: '#7f5cff', marginBottom: 4 }} title="Archetype alignment for each question">
            <b>Per-Question Archetype:</b> {perQuestionArchetype.map((a, i) => a ? `Q${i + 1}: ${a}` : null).filter(Boolean).join(", ")}
          </div>
        )}
        {actionableInsight && (
          <div style={{ color: '#00ff99', marginTop: 8, fontWeight: 600 }} title="Personalized insight based on your performance">{actionableInsight}</div>
        )}
        {/* AI-powered actionable advice and role fit recommendations based on advanced metrics */}
        <div style={{ color: '#00fff7', marginTop: 12, fontWeight: 500, fontSize: 16 }}>
          {(() => {
            // Example: If emotion diversity is high, praise adaptability
            const metrics = analytics.computeAllMetrics(safeResponses.map(r => r.analysis));
            const emotionDiversity = metrics.find(m => m.name === 'Emotion Diversity')?.value;
            const avgSentiment = metrics.find(m => m.name === 'Average Sentiment (Positive %)')?.value;
            const archetype = mostCommonArchetype || '';
            let advice = '';
            let roleFit = '';
            if (emotionDiversity && emotionDiversity > 4) {
              advice = 'You demonstrated a wide range of emotional intelligence.';
              roleFit = 'Strong asset for client-facing and advisory roles.';
            } else if (avgSentiment && avgSentiment > 70) {
              advice = 'Your responses were consistently positive.';
              roleFit = 'Valuable in financial advisory and client relations.';
            } else if (avgSentiment && avgSentiment < 40) {
              advice = 'Consider balancing optimism with realism in your responses to build trust with clients.';
              roleFit = 'May need to develop realism for analyst or compliance roles.';
            } else {
              advice = 'Keep leveraging your strengths and continue to adapt your approach for each client scenario.';
              roleFit = 'Potential for multiple roles; further assessment recommended.';
            }
            // Archetype-based refinement
            if (archetype === 'The Resonant Eye') {
              roleFit += ' Excellent fit for leadership and strategy roles.';
            } else if (archetype === 'The Discordant') {
              roleFit += ' May need coaching for team-based environments.';
            } else if (archetype === 'Street Mage') {
              roleFit += ' Creative roles or innovation teams recommended.';
            }
            return (
              <>
                <div><b>AI Review:</b> {advice}</div>
                <div style={{ marginTop: 6 }}><b>Role Fit Recommendation:</b> {roleFit} <span style={{ color: '#ffd700' }}>Western & Southern Financial Group</span></div>
              </>
            );
          })()}
        </div>
      </div>
      {/* Header and candidate name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
        <h2 className="text-2xl font-bold mb-4 text-center">Interview Summary</h2>
        <button
          onClick={speakSummary}
          style={{
            background: '#7f5cff',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 0 4px #7f5cff88',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Play summary aloud"
        >🔊</button>
      </div>
  <p className="mb-2 text-lg">Thank you, <span className="font-semibold" data-testid="candidate-name">{candidateName}</span>!</p>

      {/* Scoring Results Summary */}
      <div className="w-full mb-6 p-4 rounded-lg bg-gray-900 bg-opacity-70 flex flex-col items-center">
        <h3 className="font-semibold mb-2 text-cyan-300">Your Scoring Results</h3>
        <div className="flex flex-col gap-1 text-base text-white">
          <div><span className="font-semibold">Average EQ Score:</span> {avgEQ ?? <span className="italic">N/A</span>}</div>
          <div><span className="font-semibold">Most Common Sentiment:</span> {mostCommonSentiment ?? <span className="italic">N/A</span>}</div>
          <div><span className="font-semibold">Most Common Archetype:</span> {mostCommonArchetype ?? <span className="italic">N/A</span>}</div>
        </div>
      </div>

      {/* Show final archetype alignment if available */}
      {last && "archetype" in last && (
        <div className="mb-6 w-full">
          <ArchetypeAlignment archetype={last.archetype ?? ""} eqScore={last.eqScore} />
        </div>
      )}

      {/* List all responses with analysis */}
      <div className="w-full">
        <h3 className="font-semibold mb-2">Your Responses:</h3>
        <ul className="space-y-4">
          {safeResponses.map((r, i) => (
            <ResponseListItem key={`response-${r.prompt}-${r.analysis.text ?? ''}-${i}`} response={r} index={i} backendResult={backendResults[i] || {}} />
          ))}
        </ul>
      </div>

      {/* Analytics section */}
  <section className="w-full mt-8 p-4 rounded-lg bg-gray-800 bg-opacity-80" key="analytics-section">
    <h2 className="text-xl font-semibold mb-4 text-cyan-300">Analytics</h2>
    {analyticsVisual.map((visual, idx) => (
      <React.Fragment key={`analytics-plugin-${idx}`}>{visual}</React.Fragment>
    ))}
  </section>
    </div>
  );
}
