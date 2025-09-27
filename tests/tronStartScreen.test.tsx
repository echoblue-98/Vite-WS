import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TronStartScreen from '../src/TronStartScreen';

// In Jest environment, component should immediately set phase to done and show Start Interview

describe('TronStartScreen (test mode shortcut)', () => {
  it('shows start button immediately in test env and calls onStart when clicked', () => {
    const onStart = jest.fn();
    render(<TronStartScreen onStart={onStart} />);
    const status = screen.getByTestId('preamble-status');
    expect(status.textContent).toMatch(/narration skipped/i);
    const startBtn = screen.getByTestId('start-interview');
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
