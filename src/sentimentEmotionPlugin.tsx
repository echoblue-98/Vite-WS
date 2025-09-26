// sentimentEmotionPlugin.tsx
import React from 'react';
import { Metric, AnalyticsPlugin } from './analytics';

const sentimentEmotionPlugin: AnalyticsPlugin = {
  computeMetrics: (data: Array<any>) => {
    const safeArray = Array.isArray(data) ? data : [];
    const sentiments = safeArray
      .map(r => r && r.sentiment_analysis_results?.[0]?.sentiment)
      .filter((v: any): v is string => typeof v === 'string');
    const emotions = safeArray.flatMap(r => {
      if (!r || !r.emotion_scores || typeof r.emotion_scores !== 'object') return [];
      return Object.values(r.emotion_scores).filter(e => typeof e === 'number' && isFinite(e));
    }) as number[];
    const uniqueEmotions = safeArray.flatMap(r => r && r.emotion_scores && typeof r.emotion_scores === 'object' ? Object.keys(r.emotion_scores) : []);
    const positiveCount = sentiments.filter(s => s === 'Positive').length;
    const avgSentiment = sentiments.length ? positiveCount / sentiments.length : 0;
    const emotionDiversity = new Set(uniqueEmotions).size;
    const avgEmotionIntensity = emotions.length ? emotions.reduce((a, b) => a + b, 0) / emotions.length : 0;
    // Clamp values and round where appropriate
    const safeAvgSentimentPct = Math.min(100, Math.max(0, Math.round(avgSentiment * 100)));
    const safeEmotionDiversity = Math.max(0, emotionDiversity);
    const safeAvgEmotionIntensity = Math.min(1, Math.max(0, Number(avgEmotionIntensity.toFixed(4))));
    return [
      { name: 'Average Sentiment (Positive %)', value: safeAvgSentimentPct, description: 'Percent of responses with positive sentiment' },
      { name: 'Emotion Diversity', value: safeEmotionDiversity, description: 'Number of unique emotions detected across all responses' },
      { name: 'Average Emotion Intensity', value: safeAvgEmotionIntensity, description: 'Mean intensity of all detected emotions (0-1)' }
    ];
  },
  visualize: (metrics) => (
    <div>
      <h3>Sentiment & Emotion Analytics</h3>
      {metrics.map((m: Metric) => (
        <div key={m.name}>
          <strong>{m.name}:</strong> {m.value} <span style={{ color: '#888', fontSize: 12 }}>{m.description}</span>
        </div>
      ))}
    </div>
  )
};

export default sentimentEmotionPlugin;
