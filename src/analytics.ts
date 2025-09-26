// analytics.ts
// Centralized, extensible analytics module for EQ prototype
// Supports new metrics, visualizations, export formats, and candidate attributes

import eqScorePlugin from './eqScorePlugin';

export type Metric = {
  name: string;
  value: number;
  description?: string;
};

export type CandidateAttribute = {
  key: string;
  value: string | number;
};

export interface AnalyticsPlugin {
  computeMetrics?: (data: any) => Metric[];
  exportData?: (metrics: Metric[], format: string) => string | object;
  visualize?: (metrics: Metric[]) => React.ReactNode;
}

export class Analytics {
  private plugins: AnalyticsPlugin[] = [];

  registerPlugin(plugin: AnalyticsPlugin) {
    this.plugins.push(plugin);
  }

  computeAllMetrics(data: any): Metric[] {
    return this.plugins.flatMap(p => p.computeMetrics ? p.computeMetrics(data) : []);
  }

  exportAllData(metrics: Metric[], format: string): Array<string | object> {
    return this.plugins.map(p => p.exportData ? p.exportData(metrics, format) : metrics);
  }

  visualizeAll(metrics: Metric[]): React.ReactNode[] {
    return this.plugins.map(p => p.visualize ? p.visualize(metrics) : null);
  }
}

export const analytics = new Analytics();
import sentimentEmotionPlugin from './sentimentEmotionPlugin';
analytics.registerPlugin(eqScorePlugin);
analytics.registerPlugin(sentimentEmotionPlugin);
