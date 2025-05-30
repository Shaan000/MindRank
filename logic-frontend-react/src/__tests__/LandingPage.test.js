// 🔒 FROZEN LANDING PAGE SNAPSHOT TEST v1.0
// This test will FAIL if the LandingPage component's rendered output changes
// Run 'npm test -- --updateSnapshot' ONLY if intentional changes are made

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

// Mock fetch for the puzzle generation
global.fetch = jest.fn();

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn()
    }
  }
}));

describe('🔒 LandingPage Snapshot Test - v1.0', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful puzzle fetch
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        statement_data: [
          'A is a truth-teller',
          'B is a liar'
        ],
        num_truth_tellers: 2
      })
    });

    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('🚨 CRITICAL: Landing page UI must remain EXACTLY the same', async () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // This snapshot test will fail if ANY visual changes are made
    expect(container.firstChild).toMatchSnapshot();
  });

  test('🚨 CRITICAL: Landing page structure verification', () => {
    const { getByText, getByRole } = render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Verify critical elements exist exactly as designed
    expect(getByText('Welcome to MindRank')).toBeInTheDocument();
    expect(getByText('Master the Art of Logic Puzzles')).toBeInTheDocument();
    expect(getByText('Continue with Google')).toBeInTheDocument();
    expect(getByText('Try a Sample Puzzle')).toBeInTheDocument();
    expect(getByText('🎲 Generate New Puzzle')).toBeInTheDocument();
    expect(getByText('🎯 Practice Mode')).toBeInTheDocument();
    expect(getByText('🏆 Ranked Mode')).toBeInTheDocument();
    expect(getByText('📊 Leaderboard')).toBeInTheDocument();

    // Verify slider exists
    expect(getByRole('slider')).toBeInTheDocument();
  });

  test('🚨 CRITICAL: Console log verification', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(console.log).toHaveBeenCalledWith('💥 New Landing Page Loaded - v1.0');
  });
}); 