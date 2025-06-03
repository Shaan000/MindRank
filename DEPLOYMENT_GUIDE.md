# 🚀 MindRank Deployment Guide

This guide will help you deploy your MindRank logic puzzle app using **Vercel** for the frontend and **Render** for the backend.

## 📋 Prerequisites

- GitHub account (for code hosting)
- Vercel account (free tier available)
- Render account (free tier available)
- Supabase project (for database and authentication)

## 🗂️ Project Structure

```
logic-app/
├── logic-frontend-react/    # React frontend → Deploy to Vercel
├── logic-backend-flask/     # Flask backend → Deploy to Render
└── DEPLOYMENT_GUIDE.md     # This file
```

## 🏗️ Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Create Render Web Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Build & Deploy Settings:**
   - **Name**: `mindrank-backend`
   - **Root Directory**: `logic-backend-flask`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

### 2.2 Set Environment Variables

In Render, go to **Environment** tab and add:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
PYTHON_VERSION=3.11.0
```

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. **Copy your backend URL** (e.g., `https://mindrank-backend.onrender.com`)

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure the project:

   **Framework Preset:** `Create React App`
   **Root Directory:** `logic-frontend-react`

### 3.2 Set Environment Variables

In Vercel, go to **Settings** → **Environment Variables** and add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

*Replace with your actual Render backend URL from Step 2.3*

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. **Copy your frontend URL** (e.g., `https://mindrank.vercel.app`)

## 🔧 Step 4: Configure Supabase for Production

### 4.1 Update CORS Settings

In your Supabase dashboard:

1. Go to **Authentication** → **Settings** → **URL Configuration**
2. Add your production URLs:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app`

### 4.2 Update Database Policies (if needed)

Ensure your RLS policies allow production domain access.

## 🧪 Step 5: Test Your Deployment

1. **Visit your frontend URL**
2. **Test authentication** (Google sign-in)
3. **Generate puzzles** in all modes
4. **Check leaderboard** functionality
5. **Verify practice/ranked modes** work

## 🔄 Step 6: Automatic Deployments

### Frontend (Vercel)
- **Automatic**: Deploys on every push to `main` branch
- **Manual**: Use Vercel dashboard to redeploy

### Backend (Render)
- **Automatic**: Deploys on every push to `main` branch
- **Manual**: Use Render dashboard to redeploy

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Render logs for Python/dependency errors
- Verify all environment variables are set
- Ensure `requirements.txt` is correct

**Frontend can't connect to API:**
- Verify `REACT_APP_API_URL` environment variable
- Check backend is running and accessible
- Verify CORS settings in Flask app

**Authentication not working:**
- Check Supabase URL configuration
- Verify JWT secret is correct
- Ensure redirect URLs match production domain

### Debugging Commands

**Check backend health:**
```bash
curl https://your-backend-url.onrender.com/
```

**View logs:**
- **Render**: Dashboard → Services → Your Service → Logs
- **Vercel**: Dashboard → Projects → Your Project → Functions → View Logs

## 📊 Performance Tips

1. **Render Free Tier**: Service spins down after inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading for production use

2. **Vercel Optimization**: 
   - Already optimized for React apps
   - CDN and edge caching included

## 🔒 Security Checklist

- [ ] Environment variables set (never commit secrets)
- [ ] Supabase RLS policies configured
- [ ] CORS properly configured
- [ ] JWT secret is secure and unique
- [ ] Service role key is properly protected

## 🎉 You're Live!

Your MindRank app should now be fully deployed and accessible worldwide!

**Your URLs:**
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

## 📧 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs for errors
3. Verify all environment variables are correct 