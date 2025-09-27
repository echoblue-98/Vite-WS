import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { analytics } from '../src/analytics';

// Directly exercise analytics plugins with edge inputs

describe('Analytics edge cases', () => {
  it('handles empty data gracefully', () => {
    const metrics = analytics.computeAllMetrics([] as any);
    // Average EQ Score should exist and be 0
    const avg = metrics.find(m => m.name === 'Average EQ Score');
    expect(avg).toBeTruthy();
    expect(avg?.value).toBe(0);
  });

  it('handles missing fields without throwing', () => {
    const partial = [{}, { eqScore: undefined as any }, { sentiment_analysis_results: [] }];
    const metrics = analytics.computeAllMetrics(partial as any);
    expect(Array.isArray(metrics)).toBe(true);
  });

  it('computes sentiment percentage correctly', () => {
    const data = [
      { sentiment_analysis_results: [{ sentiment: 'Positive' }] },
      { sentiment_analysis_results: [{ sentiment: 'Neutral' }] },
      { sentiment_analysis_results: [{ sentiment: 'Positive' }] },
      { sentiment_analysis_results: [{ sentiment: 'Negative' }] }
    ];
    const metrics = analytics.computeAllMetrics(data as any);
    const m = metrics.find(x => x.name.startsWith('Average Sentiment'));
    expect(m?.value).toBe(50); // 2 of 4 positive
  });

  it('counts emotion diversity across responses', () => {
    const data = [
      { emotion_scores: { joy: 0.5, anger: 0.1 } },
      { emotion_scores: { sadness: 0.2, joy: 0.4 } },
      { emotion_scores: { fear: 0.3 } }
    ];
    const metrics = analytics.computeAllMetrics(data as any);
    const diversity = metrics.find(m => m.name === 'Emotion Diversity');
    expect(diversity?.value).toBe(4); // joy, anger, sadness, fear
  });

  it('averages emotion intensity correctly', () => {
    const data = [
      { emotion_scores: { joy: 0.5, anger: 0.5 } },
      { emotion_scores: { joy: 1.0 } }
    ];
    const metrics = analytics.computeAllMetrics(data as any);
    const avg = metrics.find(m => m.name === 'Average Emotion Intensity');
    // Values: 0.5,0.5,1.0 -> avg = 0.666...
    expect(Math.abs((avg?.value || 0) - (2.0/3.0))).toBeLessThan(0.0001);
  });
});
