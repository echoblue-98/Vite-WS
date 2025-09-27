import React from 'react';
jest.mock('../src/ParticleBackground', () => () => null);
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { AppStateProvider, initialState } from '../src/context/AppStateContext';
jest.mock('../src/ParticleBackground', () => () => null);

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

describe('Question Answering Flow', () => {
  it('renders first question and allows navigation', async () => {
    // Set initial transcript in context so Next button is enabled
    const customState = {
      ...initialState,
      voiceTranscript: 'Test response',
    };
    render(
      <AppStateProvider initialStateOverride={customState}>
        <App />
      </AppStateProvider>
    );
    // Advance through onboarding steps using testid
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      await act(async () => {
        fireEvent.click(nextButton);
      });
    }
    // Click Finish in onboarding modal
    const finishButton = await screen.findByTestId('onboarding-finish');
    await act(async () => {
      fireEvent.click(finishButton);
    });
    // Wait for TronStartScreen to appear and click Start Interview
    const startButton = await screen.findByTestId('start-interview');
    await act(async () => {
      fireEvent.click(startButton);
    });
    // Check first question is rendered
  expect(await screen.findByText((content) => content.toLowerCase().includes('describe a time you demonstrated leadership in a financial context'))).toBeInTheDocument();
      // Simulate entering a valid response before clicking Next
      const input = await screen.findByTestId('adaptive-question-input');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Test response' } });
      });
      const adaptiveNextButton = await screen.findByTestId('adaptive-question-next');
      await act(async () => {
        fireEvent.click(adaptiveNextButton);
      });
    // Check second question appears
  expect(await screen.findByText((content) => content.toLowerCase().includes('how do you approach ethical dilemmas in client relationships'))).toBeInTheDocument();
    // Click Previous
    const prevButton = await screen.findByTestId('adaptive-question-prev');
    await act(async () => {
      fireEvent.click(prevButton);
    });
    // First question should be visible again
  expect(await screen.findByText((content) => content.toLowerCase().includes('describe a time you demonstrated leadership in a financial context'))).toBeInTheDocument();
  });
});
