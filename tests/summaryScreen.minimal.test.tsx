import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('../src/Sparkline', () => () => null);
jest.mock('../src/ArchetypeAlignment', () => () => null);
jest.mock('../src/analytics', () => ({
  analytics: {
    computeAllMetrics: jest.fn(() => []),
    visualizeAll: jest.fn(() => []),
  }
}));
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    setTextColor: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  }));
});
jest.mock('../src/api', () => ({
  fetchSentiment: jest.fn(() => Promise.resolve('Positive')),
  fetchArchetype: jest.fn(() => Promise.resolve('The Resonant Eye')),
}));
import SummaryScreen from '../src/SummaryScreen';

test('minimal: renders candidate name without provider', () => {
  const candidateName = 'MinimalCandidate';
  const minimalResponses = [
    {
      analysis: {
        text: 'Minimal answer',
        eqScore: 1,
        sentiment_analysis_results: [{ sentiment: 'Neutral' }],
        emotion_scores: { joy: 0.1 },
        voice_features: { energy: 0.2 },
        archetype: 'Minimalist',
      },
      prompt: 'Minimal prompt'
    }
  ];
  const { container } = render(
    <SummaryScreen responses={minimalResponses} candidateName={candidateName} />
  );
  // eslint-disable-next-line no-console
  console.log('Rendered minimal HTML:', container.innerHTML);
  const candidateNameSpan = screen.getByTestId('candidate-name');
  expect(candidateNameSpan).toHaveTextContent(new RegExp(candidateName, 'i'));
});
