# 🚀 Forever Free Deployment Guide

This guide describes how to deploy the **Gatherly** project using a "Forever Free" stack. This is ideal if you need deployments to last longer than Railway's trial period.

## The Stack
- **Frontend**: [Vercel](https://vercel.com/) (Free, optimized for Next.js)
- **Backend**: [Render](https://render.com/) (Free Web Services)
- **Database**: [Neon](https://neon.tech/) (Free Serverless PostgreSQL)
- **Cache**: [Upstash](https://upstash.com/) (Free Serverless Redis)

---

## Step 1: Database (Neon)
1. Go to [Neon.tech](https://neon.tech/) and sign up.
2. Create a **New Project** (e.g., `gatherly-db`).
3. It will give you a **Connection String** that looks like: `postgres://user:password@cloud-url.neon.tech/neondb`.
   - **Save this**; this is your `DATABASE_URL`.

## Step 2: Redis Cache (Upstash)
1. Go to [Upstash.com](https://upstash.com/) and sign up.
2. Create a **New Database** -> **Redis**.
3. Name it `gatherly-cache`.
4. In the database details, find the **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**, or simply the standard `redis://` URL with password.
   - **Save the Host and Port**. (e.g., `global-redis.upstash.io` and `6379`)
   - **Save the Password**.

## Step 3: Backend Deployment (Render)
1. Go to [Render.com](https://render.com/) and sign up.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Geatherlyyy`).
4. **Configuration**:
   - **Name**: `gatherly-backend`
   - **Root Directory**: `backend` (Important!)
   - **Runtime**: `Docker` (Render will use your `backend/Dockerfile`).
   - **Region**: Choose one close to you.
   - **Instance Type**: **Free**.
5. **Environment Variables**:
   Click "Advanced" or "Environment" and add:
   - `PORT`: `5000` (Optional, Render sets `PORT` automatically usually, but good to be safe)
   - `DATABASE_URL`: (Paste your Neon URL from Step 1)
   - `REDIS_HOST`: (Your Upstash Host)
   - `REDIS_PORT`: (Your Upstash Port, e.g., 6379)
   - `REDIS_PASSWORD`: (Your Upstash Password)
   - `JWT_SECRET`: (Create a random secure string)
   - `GOOGLE_CLIENT_ID`: (From Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET`: (From Google Cloud Console)
   - `FRONTEND_URL`: (You will update this later, or set to `https://your-vercel-app.vercel.app`)
6. Click **Create Web Service**.
   - Wait for the build to finish.
   - Once deployed, copy the **Service URL** (e.g., `https://gatherly-backend.onrender.com`).

## Step 4: Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and sign up.
2. Click **Add New ...** -> **Project**.
3. Import your `Geatherlyyy` repository.
4. **Project Settings**:
   - **Framework Preset**: Next.js (Auto-detected).
   - **Root Directory**: Click "Edit" and select `frontend`.
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Paste your **Render Backend URL** (e.g., `https://gatherly-backend.onrender.com`).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: (Same as backend).
6. Click **Deploy**.

## Step 5: Final Configuration
1. **Google Cloud Console**:
   - Add your new Vercel domain (e.g., `https://gatherly-frontend.vercel.app`) to "Authorized JavaScript origins".
   - Add `https://gatherly-backend.onrender.com/api/auth/google/callback` to "Authorized redirect URIs".
2. **Backend Update**:
   - Go back to Render -> Environment.
   - Update `FRONTEND_URL` to your new Vercel domain.
   - Redeploy if necessary.

## Summary
- **Frontend**: Hosted on Vercel.
- **Backend**: Hosted on Render.
- **Data**: Stored safely in Neon and Upstash.

This setup is robust and free for standard hobby use!
