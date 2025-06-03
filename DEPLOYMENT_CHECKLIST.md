# ✅ MindRank Deployment Checklist

Follow this checklist to deploy your app step by step.

## 🏁 Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Supabase project ready with environment variables
- [ ] Render account created
- [ ] Vercel account created

## 🖥️ Backend Deployment (Render)

- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `logic-backend-flask`
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `gunicorn app:app`
- [ ] Add Environment Variables:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `SUPABASE_JWT_SECRET`
  - [ ] `PYTHON_VERSION=3.11.0`
- [ ] Deploy and wait for completion
- [ ] Copy backend URL (save for frontend setup)
- [ ] Test backend health: `curl https://your-backend-url.onrender.com/`

## 🌐 Frontend Deployment (Vercel)

- [ ] Create new Project on Vercel
- [ ] Import GitHub repository
- [ ] Set Framework Preset: `Create React App`
- [ ] Set Root Directory: `logic-frontend-react`
- [ ] Add Environment Variable:
  - [ ] `REACT_APP_API_URL=https://your-backend-url.onrender.com`
- [ ] Deploy and wait for completion
- [ ] Copy frontend URL

## 🔧 Supabase Configuration

- [ ] Go to Supabase Dashboard
- [ ] Authentication → Settings → URL Configuration
- [ ] Set Site URL: `https://your-frontend-url.vercel.app`
- [ ] Add Redirect URL: `https://your-frontend-url.vercel.app`

## 🧪 Testing

- [ ] Visit frontend URL
- [ ] Test Google sign-in
- [ ] Generate puzzle on landing page
- [ ] Try practice mode
- [ ] Try ranked mode (if signed in)
- [ ] Check leaderboard
- [ ] Test all puzzle difficulties

## 🎉 Launch Complete!

Your app is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

## 🚨 If Something Goes Wrong

1. Check deployment logs on Render/Vercel
2. Verify all environment variables are set correctly
3. Ensure Supabase URLs are configured
4. Test backend endpoint directly
5. Check browser console for frontend errors 