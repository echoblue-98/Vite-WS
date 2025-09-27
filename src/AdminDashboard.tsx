import React, { useState } from 'react';
import { useAppState } from './context/AppStateContext';
import { analytics } from './analytics';

// Admin dashboard for managing questions and reviewing analytics
const AdminDashboard: React.FC = () => {
  const { state, dispatch } = useAppState();

  // --- Cohort analytics summary & trends ---
  const responses = state.responses || [];
  const eqScores = responses.map(r => typeof r.eqScore === 'number' ? r.eqScore : null).filter(v => typeof v === 'number') as number[];
  const avgEQ = eqScores.length ? Math.round(eqScores.reduce((a, b) => a + b, 0) / eqScores.length) : null;
  const sentiments = responses.map(r => r.sentiment).filter((v): v is string => typeof v === 'string' && v.length > 0);
  const sentimentCounts = sentiments.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostCommonSentiment = sentiments.length ? (Object.entries(sentimentCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] : null;
  const archetypes = responses.map(r => r.archetype).filter((v): v is string => typeof v === 'string' && v.length > 0);
  const archetypeCounts = archetypes.reduce((acc, a) => { acc[a] = (acc[a] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostCommonArchetype = archetypes.length ? (Object.entries(archetypeCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0] : null;
  const emotionDiversity = responses.map(r => r.emotion_scores ? Object.keys(r.emotion_scores).length : 0).reduce((a, b) => a + b, 0);

  // --- Benchmarking and trend visualizations ---
  // Simple sparkline for EQ trend
  const eqTrend = eqScores.length ? eqScores : [];
  // Sentiment trend: map to numbers
  const sentimentTrend = sentiments.map(s => s === 'Positive' ? 1 : s === 'Negative' ? -1 : 0);
  // Archetype trend: assign each archetype a color
  const archetypeColors: Record<string, string> = {
    'The Resonant Eye': '#00fff7',
    'The Discordant': '#ff5c5c',
    'Street Mage': '#ffd700',
    '': '#888'
  };
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Example: List all questions and allow editing
  const questions = [
    "Describe how you would advise a client on balancing investment growth with risk management in today’s market.",
    "How do you evaluate and recommend insurance products to meet the unique needs of high-net-worth individuals?",
    "Share an example of how you helped a client navigate a major life event (e.g., retirement, inheritance, business sale) with financial planning.",
    "What strategies do you use to stay informed about regulatory changes affecting investment and insurance products?",
    "How do you build trust and long-term relationships with clients in a competitive financial services environment?"
  ];

  const handleEdit = (idx: number) => {
    setSelectedQuestion(idx);
    setEditText(questions[idx]);
  };

  const handleSave = () => {
    // In a real app, update backend or context
    setSelectedQuestion(null);
  };

  // Example: Export analytics data
  const handleExport = () => {
    const metrics = analytics.computeAllMetrics(state.responses);
    const exportObj = {
      candidate: state.candidateName,
      responses: state.responses,
      metrics
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Admin_Analytics_${state.candidateName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
  <div style={{ background: '#181f2b', color: '#e6f7ff', borderRadius: 16, padding: 32, maxWidth: 700, margin: '2rem auto', boxShadow: '0 0 24px #00fff799' }}>
      {/* Benchmarking & Trends */}
      <div style={{ background: '#22223b', borderRadius: 12, padding: 20, marginBottom: 28, boxShadow: '0 0 12px #00fff799' }}>
        <h3 style={{ color: '#00fff7', marginBottom: 10 }}>Cohort Benchmarking & Trends</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          {/* EQ Score Trend */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>EQ Score Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 40, gap: 2 }}>
              {eqTrend.map((v, i) => (
                <div key={i} style={{ width: 12, height: `${Math.max(8, v)}px`, background: '#00fff7', borderRadius: 4, opacity: 0.8 }} title={`Q${i + 1}: ${v}`} />
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <b>Group Avg EQ:</b> <span style={{ color: '#00fff7' }}>{avgEQ ?? 'N/A'}</span>
              {' | '}
              <b>Top EQ:</b> <span style={{ color: '#ffd700' }}>{eqScores.length ? Math.max(...eqScores) : 'N/A'}</span>
              {' | '}
              <b>Lowest EQ:</b> <span style={{ color: '#ff5c5c' }}>{eqScores.length ? Math.min(...eqScores) : 'N/A'}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <b>Voice Energy (Inflection):</b>
              {' Avg: '}
              <span style={{ color: '#00ff99' }}>{(() => {
                const energies = responses.map(r => r.voice_features?.energy).filter(e => typeof e === 'number');
                return energies.length ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(2) : 'N/A';
              })()}</span>
              {' | Top: '}
              <span style={{ color: '#ffd700' }}>{(() => {
                const energies = responses.map(r => r.voice_features?.energy).filter(e => typeof e === 'number');
                return energies.length ? Math.max(...energies).toFixed(2) : 'N/A';
              })()}</span>
              {' | Lowest: '}
              <span style={{ color: '#ff5c5c' }}>{(() => {
                const energies = responses.map(r => r.voice_features?.energy).filter(e => typeof e === 'number');
                return energies.length ? Math.min(...energies).toFixed(2) : 'N/A';
              })()}</span>
            </div>
          </div>
          {/* Sentiment Trend */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Sentiment Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 40, gap: 2 }}>
              {sentimentTrend.map((v, i) => (
                <div key={i} style={{ width: 12, height: `${Math.abs(v) * 32 + 8}px`, background: v === 1 ? '#ffd700' : v === -1 ? '#ff5c5c' : '#888', borderRadius: 4, opacity: 0.8 }} title={`Q${i + 1}: ${sentiments[i]}`} />
              ))}
            </div>
          </div>
          {/* Archetype Trend */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Archetype Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 40, gap: 2 }}>
              {archetypes.map((a, i) => (
                <div key={i} style={{ width: 12, height: '32px', background: archetypeColors[a] || '#888', borderRadius: 4, opacity: 0.8 }} title={`Q${i + 1}: ${a || 'N/A'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <h2 style={{ color: '#00fff7', marginBottom: 24 }}>Admin Dashboard</h2>
      {/* Cohort Analytics Summary */}
      <div style={{ background: '#22223b', borderRadius: 12, padding: 20, marginBottom: 28, boxShadow: '0 0 12px #ffd70055' }}>
        <h3 style={{ color: '#ffd700', marginBottom: 10 }}>Cohort Analytics Summary</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div><b>Avg EQ:</b> <span style={{ color: '#00fff7' }}>{avgEQ ?? 'N/A'}</span></div>
          <div><b>Most Common Sentiment:</b> <span style={{ color: '#ffd700' }}>{mostCommonSentiment ?? 'N/A'}</span></div>
          <div><b>Most Common Archetype:</b> <span style={{ color: '#7f5cff' }}>{mostCommonArchetype ?? 'N/A'}</span></div>
          <div><b>Emotion Diversity (total):</b> <span style={{ color: '#00ff99' }}>{emotionDiversity}</span></div>
        </div>
      </div>
      <h3 style={{ color: '#ffd700', marginBottom: 12 }}>Manage Interview Questions</h3>
      <ul style={{ marginBottom: 24 }}>
        {questions.map((q, idx) => (
          <li key={idx} style={{ marginBottom: 10 }}>
            {selectedQuestion === idx ? (
              <>
                <input value={editText} onChange={e => setEditText(e.target.value)} style={{ width: '80%' }} />
                <button onClick={handleSave} style={{ marginLeft: 8, background: '#00fff7', color: '#222', borderRadius: 6, padding: '0.3em 1em', fontWeight: 'bold' }}>Save</button>
              </>
            ) : (
              <>
                {q}
                <button onClick={() => handleEdit(idx)} style={{ marginLeft: 8, background: '#ffd700', color: '#222', borderRadius: 6, padding: '0.3em 1em', fontWeight: 'bold' }}>Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <h3 style={{ color: '#ffd700', marginBottom: 12 }}>Export Analytics Data</h3>
      <button onClick={handleExport} style={{ background: '#00fff7', color: '#222', borderRadius: 8, padding: '0.7em 2em', fontWeight: 'bold', boxShadow: '0 0 8px #00fff7' }}>Export JSON</button>
    </div>
  );
};

export default AdminDashboard;
