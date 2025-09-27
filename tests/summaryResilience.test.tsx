import React from 'react';
import { render } from '@testing-library/react';
import SummaryScreen from '../src/SummaryScreen';

// Minimal props shape imitation
describe('SummaryScreen resilience', () => {
  it('renders with missing analysis gracefully', () => {
  const { getByText } = render(<SummaryScreen responses={[]} candidateName="Test" />);
    expect(getByText(/Thank you/)).toBeTruthy();
  });
});
