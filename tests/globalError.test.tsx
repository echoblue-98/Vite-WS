import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock fetch to always fail for feedback and next question
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    const baseResponse = {
      redirected: false,
      statusText: '',
      type: 'basic',
      url: url.toString(),
  headers: new Headers(),
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      bytes: () => Promise.resolve(new Uint8Array())
    };
    if (url.toString().includes('/feedback') || url.toString().includes('/next_question')) {
      return Promise.resolve({
        ...baseResponse,
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
        text: () => Promise.resolve('Internal Server Error'),
      } as any);
    }
    // Default: succeed
    return Promise.resolve({
      ...baseResponse,
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'Mocked backend response' }),
      text: () => Promise.resolve(''),
    } as any);
  });
});

describe('Global Error Handling', () => {
  it('surfaces backend errors in the global error banner', async () => {
    render(<App />);
    // Advance through all onboarding steps using testid
    for (let i = 0; i < 3; i++) {
      const nextButton = await screen.findByTestId('onboarding-next');
      await act(async () => { fireEvent.click(nextButton); });
    }
    // Click Finish in onboarding modal
    const finishButton = await screen.findByTestId('onboarding-finish');
    await act(async () => { fireEvent.click(finishButton); });
    // Wait for TronStartScreen to appear and click Start Interview
    const startButton = await screen.findByTestId('start-interview');
    await act(async () => { fireEvent.click(startButton); });
    // Set transcript to 'error' to trigger backend error
    // Simulate entering 'error' response before clicking Next
    const transcriptInput = screen.getByTestId('adaptive-question-input');
    fireEvent.change(transcriptInput, { target: { value: 'error' } });
    const adaptiveNextButton = await screen.findByTestId('adaptive-question-next');
    await act(async () => { fireEvent.click(adaptiveNextButton); });
    await waitFor(async () => {
      // Wait for the error banner to appear (allow extra time for UI update)
      const errorBanner = await screen.findByTestId('global-error-banner');
      expect(errorBanner).not.toBeNull();
      expect(errorBanner).toHaveTextContent(/next question fetch failed|internal server error/i);
    }, { timeout: 2000 });
  });
});
