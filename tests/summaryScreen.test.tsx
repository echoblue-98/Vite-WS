// --- Mock browser APIs for test environment ---
beforeAll(() => {
  // Mock window.speechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speak: jest.fn(),
    },
  });
  // Mock SpeechSynthesisUtterance with correct constructor signature
  class MockSpeechSynthesisUtterance {
    text: string;
    constructor(text?: string) {
      this.text = text ?? '';
    }
  }
  window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
  // Mock Blob with correct constructor signature
  class MockBlob {
    content: BlobPart[];
    options?: BlobPropertyBag;
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
      this.content = blobParts ?? [];
      this.options = options;
    }
  }
  global.Blob = MockBlob as any;
  global.URL.createObjectURL = jest.fn(() => 'blob:url');
  global.URL.revokeObjectURL = jest.fn();
  // Mock jsPDF
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
});
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
// --- Mock browser APIs for test environment ---
beforeAll(() => {
  // Mock window.speechSynthesis
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speak: jest.fn(),
    },
  });
  // Mock SpeechSynthesisUtterance with correct constructor signature
  class MockSpeechSynthesisUtterance {
    text: string;
    constructor(text?: string) {
      this.text = text ?? '';
    }
  }
  window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;
  // Mock Blob with correct constructor signature
  class MockBlob {
    content: BlobPart[];
    options?: BlobPropertyBag;
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
      this.content = blobParts ?? [];
      this.options = options;
    }
  }
  global.Blob = MockBlob as any;
  global.URL.createObjectURL = jest.fn(() => 'blob:url');
  global.URL.revokeObjectURL = jest.fn();
  // Mock jsPDF
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
});

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
    prompt: 'Describe a time you demonstrated leadership in a financial context.'
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
    prompt: 'How do you approach ethical dilemmas in client relationships?'
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
    prompt: 'Share an example of adapting to regulatory changes.'
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
    prompt: 'How do you communicate complex financial concepts to non-experts?'
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
    prompt: 'Tell us about a time you resolved a conflict within a team.'
  }
];

describe('SummaryScreen', () => {
  // it('renders candidate name with minimal valid props', async () => {
  //   const candidateName = 'TestCandidate';
  //   const minimalResponses = [
  //     {
  //       analysis: {
  //         text: 'Minimal answer',
  //         eqScore: 1,
  //         sentiment_analysis_results: [{ sentiment: 'Neutral' }],
  //         emotion_scores: { joy: 0.1 },
  //         voice_features: { energy: 0.2 },
  //         archetype: 'Minimalist',
  //       },
  //       prompt: 'Minimal prompt'
  //     }
  //   ];
  //   // Debug: log before render
  //   // eslint-disable-next-line no-console
  //   console.log('Rendering minimal SummaryScreen...');
  //   const { container } = render(
  //     <AppStateProvider>
  //       <SummaryScreen responses={minimalResponses} candidateName={candidateName} />
  //     </AppStateProvider>
  //   );
  //   // Debug: log after render
  //   // eslint-disable-next-line no-console
  //   console.log('Rendered minimal HTML:', container.innerHTML);
  //   const candidateNameSpan = await screen.findByTestId('candidate-name');
  //   expect(candidateNameSpan).toHaveTextContent(new RegExp(candidateName, 'i'));
  // });
  it.only('renders candidate summary and responses with one response', async () => {
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
    const { container } = render(
      <SummaryScreen responses={singleResponse} candidateName={candidateName} onBack={() => {}} />
    );
    expect(container.innerHTML).not.toBe('<div />');
    const candidateNameSpan = screen.getByTestId('candidate-name');
    expect(candidateNameSpan).toHaveTextContent(new RegExp(candidateName, 'i'));
    // Check parent <p> structure
    expect(candidateNameSpan.parentElement?.tagName.toLowerCase()).toBe('p');
    // Use getByText for summary
    expect(screen.getByText(/summary/i)).toBeInTheDocument();
    // Select the response list item and check its textContent for the prompt substring
    const responseItems = container.querySelectorAll('li');
    expect(responseItems.length).toBeGreaterThan(0);
    const foundPrompt = Array.from(responseItems).some(li =>
      li.textContent && li.textContent.match(/leadership in a financial context/i)
    );
    expect(foundPrompt).toBe(true);
    // Check for the answer text
    const foundAnswer = Array.from(responseItems).some(li =>
      li.textContent && li.textContent.match(/single answer/i)
    );
    expect(foundAnswer).toBe(true);
  }, 15000);
});
