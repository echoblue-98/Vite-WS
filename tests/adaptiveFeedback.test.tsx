import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdaptiveFeedback from '../src/AdaptiveFeedback';

// Mock fetchFeedback to simulate backend response and error
jest.mock('../src/api', () => ({
  fetchFeedback: jest.fn((text: string) => {
    if (text === 'error') throw new Error('Feedback API error');
    return Promise.resolve('Mocked feedback for: ' + text);
  })
}));

describe('AdaptiveFeedback', () => {
  it('renders feedback from backend', async () => {
    render(<AdaptiveFeedback text="hello" />);
    await waitFor(() => {
      expect(screen.getByText(/mocked feedback for: hello/i)).toBeInTheDocument();
    });
  });

  it('shows error message on backend failure and calls onError', async () => {
    const onError = jest.fn();
    render(<AdaptiveFeedback text="error" onError={onError} />);
    await waitFor(() => {
      expect(screen.getByText(/feedback fetch failed/i)).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith('Feedback fetch failed');
    });
  });

  it('does not fetch feedback if text is empty', () => {
    render(<AdaptiveFeedback text="" />);
    expect(screen.queryByText(/mocked feedback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/feedback fetch failed/i)).not.toBeInTheDocument();
  });
});
