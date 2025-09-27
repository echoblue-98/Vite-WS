import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
import { AppStateProvider } from '../src/context/AppStateContext';

test('isolated: renders candidate summary and responses with one response', async () => {
  const candidateName = 'Candidate';
  const singleResponse = [
    {
      analysis: {
        text: 'Single answer',
        eqScore: 5,
        sentiment_analysis_results: [{ sentiment: 'Positive' }],
        emotion_scores: { joy: 0.8 },
        voice_features: { pitch: 120, energy: 0.7 },
        archetype: 'The Resonant Eye',
      },
      prompt: 'Describe a time you demonstrated leadership in a financial context.'
    }
  ];
  // Debug: log before render
  // eslint-disable-next-line no-console
  console.log('Rendering isolated SummaryScreen...');
  const { container } = render(
    <AppStateProvider>
      <SummaryScreen responses={singleResponse} candidateName={candidateName} onBack={() => {}} />
    </AppStateProvider>
  );
  // Debug: log after render
  // eslint-disable-next-line no-console
  console.log('Rendered isolated HTML:', container.innerHTML);
  expect(container.innerHTML).not.toBe('<div />');
  const candidateNameSpan = screen.getByTestId('candidate-name');
  expect(candidateNameSpan).toHaveTextContent(new RegExp(candidateName, 'i'));
  // Check parent <p> structure
  expect(candidateNameSpan.parentElement?.tagName.toLowerCase()).toBe('p');
  expect(screen.getByText(/summary/i)).toBeInTheDocument();
  expect(screen.getByText('Q1: Describe a time you demonstrated leadership in a financial context.')).toBeInTheDocument();
  expect(screen.getByText(/single answer/i)).toBeInTheDocument();
}, 15000);
