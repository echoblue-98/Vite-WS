import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { AppStateProvider } from '../src/context/AppStateContext';

// Mock fetchNextQuestion to simulate backend response and error
jest.mock('../src/api', () => ({
  fetchNextQuestion: jest.fn((params: any) => {
    if (params.text === 'error') return Promise.reject(new Error('Next Question API error'));
    return Promise.resolve('Mocked next question for: ' + (params.text || 'no text'));
  })
}));

describe('AdaptiveQuestion (integration)', () => {
  it('renders next question from backend', async () => {
    render(<App />);
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    const finishButton = await screen.findByTestId('onboarding-finish');
    fireEvent.click(finishButton);
    const startButton = await screen.findByTestId('start-interview');
    fireEvent.click(startButton);
    // Render with initialStateOverride to set transcript to 'hello'
    const customInitialState = {
      started: true,
      currentQuestion: 0,
      responses: Array(5).fill({ text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' }),
      candidateName: '',
      globalError: '',
      showSummary: false,
      selectedArchetype: '',
      voiceTranscript: 'hello',
      isAnalyzing: false,
    };
    render(
      <AppStateProvider initialStateOverride={customInitialState}>
        <App />
      </AppStateProvider>
    );
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    const finishButton1 = await screen.findByTestId('onboarding-finish');
    fireEvent.click(finishButton1);
    const startButton1 = await screen.findByTestId('start-interview');
    fireEvent.click(startButton1);
    // Now interact with question UI
  const inputs = await screen.findAllByTestId('adaptive-question-input');
  const input = inputs[0];
  fireEvent.change(input, { target: { value: 'hello' } });
  const nextButtons = await screen.findAllByTestId('adaptive-question-next');
  fireEvent.click(nextButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/mocked next question for: hello/i)).toBeInTheDocument();
    });
  });

  it('shows error message on backend failure and calls onError', async () => {
    // Custom initial state with voiceTranscript set to 'error'
    const customInitialState = {
      started: true,
      currentQuestion: 0,
      responses: [
        { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
        { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
        { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
        { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' },
        { text: '', sentiment: '', eqScore: undefined, emotion_scores: {}, voice_features: {}, archetype: '' }
      ],
      candidateName: '',
      globalError: '',
      showSummary: false,
      selectedArchetype: '',
      voiceTranscript: 'error',
      isAnalyzing: false,
    };
    render(
      <AppStateProvider initialStateOverride={customInitialState}>
        <App />
      </AppStateProvider>
    );
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    const finishButton2 = await screen.findByTestId('onboarding-finish');
    fireEvent.click(finishButton2);
    const startButton2 = await screen.findByTestId('start-interview');
    fireEvent.click(startButton2);
    // Enter 'error' to trigger backend failure
  const inputs = await screen.findAllByTestId('adaptive-question-input');
  const input = inputs[0];
  fireEvent.change(input, { target: { value: 'error' } });
  const nextButtons = await screen.findAllByTestId('adaptive-question-next');
  fireEvent.click(nextButtons[0]);
    // Assert error banner is shown
    const errorBanner = await screen.findByTestId('global-error-banner');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent(/next question fetch failed/i);
  });

  it('does not fetch next question if button is not clicked', async () => {
    render(<App />);
    // Advance through onboarding steps
    for (let i = 0; i < 3; i++) {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
    }
    // Click Finish to complete onboarding
    const finishButton = await screen.findByTestId('onboarding-finish');
    fireEvent.click(finishButton);
    // Click Start Interview in TronStartScreen
    const startButton = await screen.findByTestId('start-interview');
    fireEvent.click(startButton);
    // Now interact with question UI
    expect(screen.queryByText(/mocked next question/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next question fetch failed/i)).not.toBeInTheDocument();
  });
});
