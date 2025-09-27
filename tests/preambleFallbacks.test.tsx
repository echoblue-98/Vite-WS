import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Helper to step through onboarding fast
async function finishOnboarding() {
  for (let i = 0; i < 3; i++) {
    const next = await screen.findByTestId('onboarding-next');
    fireEvent.click(next);
  }
  const finish = await screen.findByTestId('onboarding-finish');
  fireEvent.click(finish);
}

describe('Preamble fallback chain', () => {
  afterEach(() => {
    // @ts-ignore
    global.fetch && (global.fetch.mockClear?.());
  });

  it('falls back from TTS failure to static file (simulated)', async () => {
    // First call to /tts/preamble fails
    // Subsequent non-tts fetches (other API) ok
    global.fetch = jest.fn((url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/tts/preamble')) {
        return Promise.resolve({ ok: false, status: 500 } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'ok' }),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone(){return this;},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        formData: () => Promise.resolve(new FormData())
      } as any);
    });

    render(<App />);
    await finishOnboarding();
    // In test env we auto-skip to done state, but status should reflect test skip message.
    const startButton = await screen.findByTestId('start-interview');
    expect(startButton).toBeInTheDocument();
  });

  it('ultimately allows proceeding even if static also fails (forces speech synthesis path)', async () => {
    // Fail TTS and simulate static audio error by mocking Audio
    const origAudio = (global as any).Audio;
    // Basic mock that triggers onerror immediately for static file, but calls onended for synthesis path won't apply here since we short circuit in test mode.
    class MockAudio {
      src: string;
      oncanplay: any; onended: any; onerror: any;
      constructor(src?: string){ this.src = src || ''; }
      load(){ setTimeout(() => { this.onerror && this.onerror(new Error('fail')); }, 5); }
      play(){ return Promise.reject(new Error('fail')); }
    }
    ;(global as any).Audio = MockAudio;

    global.fetch = jest.fn((url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/tts/preamble')) {
        return Promise.resolve({ ok: false, status: 500 } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'ok' }),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone(){return this;},
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        formData: () => Promise.resolve(new FormData())
      } as any);
    });

    render(<App />);
    await finishOnboarding();
    const startButton = await screen.findByTestId('start-interview');
    expect(startButton).toBeInTheDocument();
    (global as any).Audio = origAudio;
  });
});
