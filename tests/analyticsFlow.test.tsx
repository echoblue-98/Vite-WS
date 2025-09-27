import React from 'react';
jest.mock('../src/ParticleBackground', () => () => null);
jest.mock('../src/Sparkline', () => () => null);
jest.mock('../src/ArchetypeAlignment', () => () => null);
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('../src/ParticleBackground', () => () => null);
import SummaryScreen from '../src/SummaryScreen';

// Mock fetch for backend API calls
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      redirected: false,
      statusText: '',
      type: 'basic',
      url: '',
      json: () => Promise.resolve({ message: 'Mocked backend response' }),
      text: () => Promise.resolve(''),
  headers: new Headers(),
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      bytes: () => Promise.resolve(new Uint8Array()),
    })
  );
});

describe('Feedback and Analytics Flow', () => {
  it('shows feedback and analytics after answering questions', async () => {
    // Use mock responses to render SummaryScreen directly
    const mockResponses = [
      {
        analysis: {
          text: 'Answer 1',
          eqScore: 5,
          sentiment_analysis_results: [{ sentiment: 'Positive' }],
          emotion_scores: { joy: 0.8, sadness: 0.2, calm: 0.5, anger: 0.1 },
          voice_features: { pitch: 120, energy: 0.7 },
          archetype: 'The Resonant Eye',
        },
        prompt: 'Tell us about a time you overcame a challenge.'
      },
      {
        analysis: {
          text: 'Answer 2',
          eqScore: 4,
          sentiment_analysis_results: [{ sentiment: 'Neutral' }],
          emotion_scores: { joy: 0.5, sadness: 0.3, calm: 0.6, anger: 0.2 },
          voice_features: { pitch: 110, energy: 0.6 },
          archetype: 'The Discordant',
        },
        prompt: 'How do you handle feedback?'
      },
      {
        analysis: {
          text: 'Answer 3',
          eqScore: 3,
          sentiment_analysis_results: [{ sentiment: 'Negative' }],
          emotion_scores: { joy: 0.2, sadness: 0.7, calm: 0.4, anger: 0.3 },
          voice_features: { pitch: 105, energy: 0.5 },
          archetype: 'Street Mage',
        },
        prompt: 'Describe a situation where you showed empathy.'
      },
      {
        analysis: {
          text: 'Answer 4',
          eqScore: 5,
          sentiment_analysis_results: [{ sentiment: 'Positive' }],
          emotion_scores: { joy: 0.9, sadness: 0.1, calm: 0.8, anger: 0.05 },
          voice_features: { pitch: 130, energy: 0.8 },
          archetype: 'The Resonant Eye',
        },
        prompt: 'What motivates you at work?'
      },
      {
        analysis: {
          text: 'Answer 5',
          eqScore: 4,
          sentiment_analysis_results: [{ sentiment: 'Neutral' }],
          emotion_scores: { joy: 0.6, sadness: 0.3, calm: 0.7, anger: 0.15 },
          voice_features: { pitch: 115, energy: 0.65 },
          archetype: 'The Discordant',
        },
        prompt: 'How do you manage stress?'
      }
    ];
      await act(async () => {
        render(<SummaryScreen responses={mockResponses} candidateName="Candidate" onBack={() => {}} />);
      });
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});
