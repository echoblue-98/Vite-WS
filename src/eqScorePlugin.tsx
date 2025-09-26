// eqScorePlugin.tsx
import React from 'react';
import { Metric, AnalyticsPlugin } from './analytics';

const eqScorePlugin: AnalyticsPlugin = {
  computeMetrics: (data: Array<{ eqScore?: number }> | any) => {
    const safeArray = Array.isArray(data) ? data : [];
    const scores = safeArray
      .map(r => (r && typeof r.eqScore === 'number' && isFinite(r.eqScore) ? r.eqScore : null))
      .filter((v): v is number => typeof v === 'number');
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return [
      { name: 'Average EQ Score', value: Number(avg.toFixed(2)), description: 'Mean EQ score across all responses' }
    ];
  },
  exportData: (metrics, format) => {
    if (format === 'json') {
      return JSON.stringify(metrics);
    }
    return metrics;
  },
  visualize: (metrics) => (
    <div>
      <h3>Analytics</h3>
      {metrics.map((m: Metric) => (
        <div key={m.name}>
          <strong>{m.name}:</strong> {m.value}
        </div>
      ))}
    </div>
  )
};

export default eqScorePlugin;
