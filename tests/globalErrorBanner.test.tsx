import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppStateContext } from '../src/context/AppStateContext';
import App from '../src/App';
import { AppStateProvider } from '../src/context/AppStateContext';

describe('Global Error Banner', () => {
  it('renders the global error banner when globalError is set', () => {
    const mockState = {
      started: true,
      currentQuestion: 0,
      responses: [],
      candidateName: '',
      globalError: 'Test error banner',
      showSummary: false,
      selectedArchetype: '',
      voiceTranscript: '',
      isAnalyzing: false,
      promptOverrides: {},
    };
    render(
      <AppStateProvider initialStateOverride={mockState}>
        <App />
      </AppStateProvider>
    );
    (async () => {
      const dismissButton = await screen.findByTestId('global-error-dismiss');
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton.parentElement).toHaveTextContent('Test error banner');
    })();
  });
});
