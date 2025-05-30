# MindRank - Logic Puzzle Challenge

A modern, full-stack puzzle application built with Next.js, Flask, and Supabase. Challenge your logic skills with dynamic puzzles and compete on the global leaderboard.

## 🏗️ Architecture

```
mindrank-monorepo/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── mobile/              # Expo React Native app (future)
│   └── puzzle-service/      # Flask + Z3 API service
├── packages/
│   └── shared/              # Shared types and utilities
└── supabase/                # Database schema and migrations
```

## 🚀 Features

- **Modern UI**: Clean, responsive design inspired by Duolingo and Chess.com
- **Google OAuth**: Seamless authentication via Supabase
- **Dynamic Puzzles**: AI-generated logic puzzles using Z3 theorem prover
- **ELO System**: Competitive ranking with tier progression
- **Real-time Leaderboards**: Live ranking updates
- **Mobile Ready**: Responsive design with future mobile app support

## 🛠️ Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: Supabase Auth (Google OAuth)
- **State Management**: React hooks with Supabase real-time subscriptions

### Backend (Flask)
- **API**: Flask with CORS support
- **Logic Engine**: Z3 SMT solver for puzzle generation and validation
- **Authentication**: Supabase JWT verification
- **Database**: Supabase (PostgreSQL) for user profiles and match history

### Database (Supabase)
- **Auth**: Google OAuth integration
- **Tables**: `profiles`, `matches` for user data and game history
- **Real-time**: Live leaderboard updates

## 📋 Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- Google OAuth app

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd mindrank-monorepo
npm install
```

### 2. Environment Configuration

#### Web App (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Flask API (`apps/puzzle-service/.env`):
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
PORT=5000
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth in Authentication settings
3. Run the database migrations:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  elo INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  mode TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, elo)
  VALUES (new.id, new.id, new.email, 1000);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase Auth settings

## 🚀 Development

### Start All Services

```bash
# Terminal 1: Start Flask API
cd apps/puzzle-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python app.py

# Terminal 2: Start Next.js web app
cd apps/web
npm run dev
```

### Using Turborepo (Recommended)

```bash
# Start all development servers
npm run dev

# Build all packages
npm run build

# Type check all packages
npm run type-check
```

## 📱 Usage

### Authentication Flow

1. **Landing Page** (`/`) - Sign in with Google or try sample puzzles
2. **Auth Callback** (`/auth/callback`) - Handles OAuth redirect
3. **Dashboard** (`/dashboard`) - Main hub after authentication

### Game Modes

- **Practice Mode**: Unlimited puzzles without ELO impact
- **Ranked Mode**: Competitive puzzles with ELO progression  
- **ELO Page**: View your ranking and tier progression

### API Endpoints

- `GET /health` - Health check
- `GET /me` - Current user profile
- `POST /puzzle/generate` - Generate new puzzle
- `POST /puzzle/check_solution` - Validate puzzle solution
- `POST /puzzle/solution` - Get puzzle solution (give up)

## 🎯 Routing & State Management

### Protected Routes
- `/dashboard` - Requires authentication
- `/elo` - Requires authentication  
- `/leaderboard` - Requires authentication
- `/puzzle?mode=ranked` - Requires authentication

### Public Routes
- `/` - Landing page
- `/puzzle?mode=easy|medium|hard` - Practice puzzles

### State Persistence
- Authentication state persists across page refreshes
- Puzzle state maintained during gameplay
- Real-time leaderboard updates via Supabase subscriptions

## 🔐 Security

- **JWT Verification**: All protected API endpoints verify Supabase JWTs
- **CORS Configuration**: Restricted to localhost development and production domains
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: Content Security Policy headers in Next.js

## 🚢 Deployment

### Web App (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from apps/web directory
cd apps/web
vercel --prod
```

### API Service (Docker)

```bash
# Build and run Docker container
cd apps/puzzle-service
docker build -t mindrank-api .
docker run -p 5000:5000 --env-file .env mindrank-api
```

### Environment Variables for Production

Set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `NEXT_PUBLIC_API_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET`

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**: Check API URL environment variables
2. **OAuth redirect loops**: Verify Google OAuth redirect URIs
3. **JWT verification fails**: Check Supabase JWT secret configuration
4. **Puzzle generation errors**: Ensure Z3 is properly installed

### Debug Mode

```bash
# Enable Flask debug mode
cd apps/puzzle-service
FLASK_DEBUG=1 python app.py

# Enable Next.js debug mode
cd apps/web
DEBUG=1 npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Z3 Theorem Prover for logic puzzle generation
- Supabase for authentication and database
- Tailwind CSS for styling
- Vercel for hosting 