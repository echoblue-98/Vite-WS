import React from 'react';
jest.mock('../src/ParticleBackground', () => () => null);
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { AppStateProvider } from '../src/context/AppStateContext';
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
  bytes: () => Promise.resolve(new Uint8Array())
    })
  );
});

describe('Onboarding Modal', () => {
  it('shows onboarding modal on first load', async () => {
    render(<App />);
    // Advance through onboarding steps using async findByTestId
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    // Now the last step should show 'Start Interview'
    expect(await screen.findByTestId('onboarding-finish')).toBeInTheDocument();
  });

  it('allows user to proceed to questions', async () => {
    render(<App />);
    // Advance through onboarding steps using testid
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    // Click 'Start Interview'
    const startButton = await screen.findByTestId('onboarding-finish');
    fireEvent.click(startButton);
    // Click Start Interview on TronStartScreen now that narration is done in test mode
    const startInterview = await screen.findByTestId('start-interview');
    fireEvent.click(startInterview);
    // Wait for first question to appear
    await waitFor(() => {
      expect(screen.getByText(/describe a time you demonstrated leadership in a financial context/i)).toBeInTheDocument();
    });
  });

  it('shows error message if backend fails', async () => {
    // Simulate backend failure
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      status: 500,
      redirected: false,
      statusText: 'Internal Server Error',
      type: 'basic',
      url: '',
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
      text: () => Promise.resolve('Internal Server Error'),
  headers: new Headers(),
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      bytes: () => Promise.resolve(new Uint8Array())
    }));
    render(<App />);
    // Advance through onboarding steps using async findByTestId
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      fireEvent.click(nextButton);
    }
    // Click Finish in onboarding modal
    const finishButton = await screen.findByTestId('onboarding-finish');
    fireEvent.click(finishButton);
    // Wait for TronStartScreen to appear and click Start Interview
    const startButton = await screen.findByTestId('start-interview');
    fireEvent.click(startButton);
    // Enter a response to trigger backend call
    const input = await screen.findByTestId('adaptive-question-input');
    fireEvent.change(input, { target: { value: 'Test error response' } });
    const nextButton = await screen.findByTestId('adaptive-question-next');
    fireEvent.click(nextButton);
    // Assert error banner is shown
    const errorBanner = await screen.findByTestId('global-error-banner');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent(/feedback fetch failed|next question fetch failed|backend error/i);
  });
});
