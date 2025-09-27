import { analytics } from '../src/analytics';
import sentimentEmotionPlugin from '../src/sentimentEmotionPlugin';

describe('Analytics sanitization', () => {
  it('handles empty array safely', () => {
  const metrics = analytics.computeAllMetrics([]);
  // De-duplicate by metric name for assertions
  const byName: Record<string, any> = {};
  for (const m of metrics) { if (!(m.name in byName)) byName[m.name] = m; }
  const avgSent = byName['Average Sentiment (Positive %)'];
  const diversity = byName['Emotion Diversity'];
  const intensity = byName['Average Emotion Intensity'];
    expect(avgSent?.value).toBe(0);
    expect(diversity?.value).toBe(0);
    expect(intensity?.value).toBe(0);
  });

  it('ignores malformed entries', () => {
    const data: any = [
      null,
      { sentiment_analysis_results: [{}], emotion_scores: { joy: 'bad' } },
      { sentiment_analysis_results: [{ sentiment: 'Positive' }], emotion_scores: { joy: 0.9, anger: 0.1 } },
      { sentiment_analysis_results: [{ sentiment: 'Negative' }], emotion_scores: { sadness: 0.3 } },
    ];
  const metrics = analytics.computeAllMetrics(data);
  const byName: Record<string, any> = {};
  for (const m of metrics) { if (!(m.name in byName)) byName[m.name] = m; }
  const avgSent = byName['Average Sentiment (Positive %)'];
    expect(avgSent?.value).toBe(50); // one positive out of 2 valid sentiments
  });
});
