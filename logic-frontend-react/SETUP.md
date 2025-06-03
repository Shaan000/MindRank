# MindRank Frontend Setup Guide

## Prerequisites

1. Node.js and npm installed
2. A Supabase project set up with Google OAuth configured

## Environment Configuration

1. Create a `.env.local` file in the `logic-frontend-react` directory
2. Add your Supabase configuration:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

## Installation

```bash
cd logic-frontend-react
npm install
```

## Running the Application

```bash
npm start
```

The application will start on http://localhost:3000

## Application Structure

- `/` - Landing page with Google sign-in (unchanged from original)
- `/app` - Authenticated dashboard with three tiles:
  - **Practice Mode**: Generate puzzles with custom difficulty and player count
  - **Ranked Mode**: Generate ranked puzzles that affect ELO rating
  - **ELO**: View current rating, tier, and match history

## Sign-In Pages

The three footer buttons on the landing page now navigate to dedicated sign-in pages:

- `/practice-signin` - Practice Mode sign-in page with Google authentication
- `/ranked-signin` - Ranked Mode sign-in page with Google authentication  
- `/leaderboard-signin` - Leaderboard sign-in page with Google authentication

Each page features:
- Professional green-black chess.com theme
- Dedicated "Continue with Google" button
- Mode-specific descriptions and features
- Back to home navigation

## Authentication Flow

1. User visits landing page at `/`
2. Clicks "Continue with Google" button (redirects to `/app` after auth)
3. **OR** clicks footer buttons (🎯 Practice Mode, 🏆 Ranked Mode, 📊 Leaderboard)
4. Footer buttons lead to dedicated sign-in pages with contextual information
5. After successful authentication from any sign-in page, automatically redirected to `/app`
6. If user tries to access `/app` without authentication, redirected back to `/`

## API Endpoints

The frontend expects these backend endpoints to be available:

- `GET /puzzle/generate?mode={difficulty}&players={count}` - Generate practice puzzles
- `POST /puzzle/generate` with `{mode: "ranked"}` - Generate ranked puzzles
- `GET /user/elo` - Get user's ELO rating and history

All authenticated endpoints require `Authorization: Bearer {jwt_token}` header. 