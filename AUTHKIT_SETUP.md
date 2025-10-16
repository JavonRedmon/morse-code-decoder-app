# WorkOS AuthKit Integration Guide

## ✅ Setup Complete!

I've integrated WorkOS AuthKit into your Morse Code Converter app!

### 🔑 What You Need to Do

1. **Update Environment Variables** in `.env.local`:
   ```bash
   WORKOS_CLIENT_ID=client_01K6JRDGE12S07JVVDYWHT8KWW
   WORKOS_API_KEY=sk_test_a2V5XzAxSzZKUkRGNkNINTJTQ1pSDNG...  # Copy your full API key
   WORKOS_REDIRECT_URI=http://localhost:3001/api/auth/callback
   NEXT_PUBLIC_WORKOS_CLIENT_ID=client_01K6JRDGE12S07JVVDYWHT8KWW
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

2. **In WorkOS Dashboard**:
   - Go to Redirects section
   - Add callback URL: `http://localhost:3001/api/auth/callback`
   - For production, add: `https://your-domain.com/api/auth/callback`

### 🎨 What Was Added

#### New Files Created:
- `src/lib/workos.ts` - WorkOS client configuration
- `src/hooks/useAuth.ts` - Authentication hook
- `src/app/api/auth/callback/route.ts` - OAuth callback handler
- `src/app/api/auth/logout/route.ts` - Logout endpoint
- `src/app/api/auth/me/route.ts` - Get current user

#### UI Updates:
- ✅ Sign In/Sign Out button (top-right, next to theme toggle)
- ✅ Shows user email when logged in
- ✅ Responsive design (hides email on mobile)
- ✅ Smooth animations

### 🚀 How It Works

1. **User clicks "Sign In"**
   - Redirects to WorkOS AuthKit
   - User signs in (email/password, SSO, etc.)
   - Redirects back to your app

2. **After Login**
   - User info stored in secure cookies
   - Email displayed in top-right
   - Click to sign out

3. **Protected Features** (optional - you can add later):
   - Save conversion history to database
   - Sync settings across devices
   - Premium features

### 🧪 Testing Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:3001**

3. **Click "Sign In" button** (top-right)

4. **You'll be redirected to WorkOS AuthKit**

5. **Sign in and you'll be redirected back**

6. **Your email appears in the button!**

### 🌐 For Production (Vercel)

1. **Add environment variables in Vercel:**
   - `WORKOS_CLIENT_ID`
   - `WORKOS_API_KEY`
   - `WORKOS_REDIRECT_URI` (use your production URL)
   - `NEXT_PUBLIC_WORKOS_CLIENT_ID`
   - `NEXT_PUBLIC_APP_URL` (your production URL)

2. **Update WorkOS Dashboard:**
   - Add production callback URL
   - Example: `https://morse-code.vercel.app/api/auth/callback`

### 🔒 Security Features

- ✅ HTTP-only cookies (can't be accessed by JavaScript)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite protection
- ✅ 7-day session expiration

### 📦 What's Next (Optional)

You can now add features like:
- Save user's conversion history to database
- Sync settings across devices
- Add premium features for authenticated users
- User profiles
- Social sharing

### 🎯 Quick Reference

**Sign In Flow:**
```
User clicks Sign In 
→ Redirect to WorkOS 
→ User authenticates 
→ Callback to /api/auth/callback 
→ Set cookies 
→ Redirect to home 
→ User is logged in!
```

**Sign Out Flow:**
```
User clicks email/Sign Out 
→ POST to /api/auth/logout 
→ Clear cookies 
→ Redirect to home 
→ User is logged out!
```

---

**Status:** ✅ Ready to test!
**Test URL:** http://localhost:3001
**Docs:** https://workos.com/docs/user-management
