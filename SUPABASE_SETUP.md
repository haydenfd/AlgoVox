# Supabase Setup Guide

This guide walks you through setting up Supabase authentication for AlgoVox.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `algovox` (or any name you prefer)
   - **Database Password**: Generate a secure password (save it somewhere safe)
   - **Region**: Choose closest to you
4. Click "Create new project" (takes ~2 minutes to provision)

## 2. Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values to your `.env` file:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

Your `.env` should look like:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Set Up Redirect URLs

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   - **Site URL**: `http://localhost:1420`
   - **Redirect URLs**: Add `http://localhost:1420`

## 4. Enable Google OAuth

### Create Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   (Replace `xxxxxxxxxxxxx` with your Supabase project reference ID)
7. Copy **Client ID** and **Client Secret**

### Configure in Supabase:
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and enable it
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

## 5. Enable GitHub OAuth

### Create GitHub OAuth App:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `AlgoVox` (or any name)
   - **Homepage URL**: `http://localhost:1420`
   - **Authorization callback URL**:
     ```
     https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     (Replace `xxxxxxxxxxxxx` with your Supabase project reference ID)
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Configure in Supabase:
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** and enable it
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

## 6. Test Authentication

1. Run your app: `npm run tauri dev`
2. Click "Continue with Google" or "Continue with GitHub"
3. You should be redirected to the OAuth provider
4. After authentication, you'll be redirected back to the app
5. Check the browser console for any errors

## Troubleshooting

### "Invalid redirect URL" error
- Make sure you added `http://localhost:1420` to Supabase Redirect URLs
- Ensure your OAuth apps use the correct Supabase callback URL

### Authentication popup doesn't redirect back
- Check that your Supabase project URL is correct in `.env`
- Verify OAuth redirect URIs match your Supabase callback URL

### "Session not found" error
- Clear browser localStorage: `localStorage.clear()`
- Restart the app

## Production Setup

When deploying to production:
1. Update Site URL in Supabase to your production domain
2. Add production domain to Redirect URLs
3. Update OAuth apps with production callback URLs
4. Use environment-specific `.env` files
