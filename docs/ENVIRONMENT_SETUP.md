# Environment Variables Setup Guide

This guide explains how to configure environment variables for the Growth Rings application.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Generate a secure NextAuth secret:**
   ```bash
   openssl rand -base64 32
   ```

3. **Get X API credentials** from [X Developer Portal](https://developer.x.com/en/portal/dashboard)

## Required Environment Variables

### X API Configuration

#### Option 1: OAuth (Recommended for Production)

```env
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here
X_CALLBACK_URL=http://localhost:3000/auth/callback
```

**How to get these:**
1. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a new app or select existing app
3. Navigate to "Keys and Tokens"
4. Copy your Client ID and Client Secret
5. Add callback URL in app settings

#### Option 2: Bearer Token (For Development/Testing)

```env
X_API_BEARER_TOKEN=your_bearer_token_here
```

**How to get this:**
1. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Navigate to your app's "Keys and Tokens" section
3. Generate a Bearer Token
4. Copy and paste into `.env.local`

**Note:** Bearer tokens have limitations:
- Only access your own account data
- Limited to 450 requests per 15-minute window
- Cannot access other users' data

### NextAuth Configuration

```env
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**NEXTAUTH_SECRET:**
- Must be a long, random string
- Generate with: `openssl rand -base64 32`
- Never commit this to version control
- Use different secrets for dev/staging/production

**NEXTAUTH_URL:**
- Local development: `http://localhost:3000`
- Production: `https://yourdomain.com`

## Optional Environment Variables

### Email Collection (ConvertKit)

```env
CONVERTKIT_API_KEY=your_convertkit_api_key
CONVERTKIT_FORM_ID=your_form_id
```

**How to get these:**
1. Sign up at [ConvertKit](https://convertkit.com/)
2. Go to Settings → Account
3. Copy your API Key
4. Create a form and copy its Form ID

### Analytics (Google Analytics)

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**How to get this:**
1. Set up [Google Analytics](https://analytics.google.com/)
2. Create a new property
3. Copy the Measurement ID (starts with "G-")

## Environment-Specific Configuration

### Development (.env.local)

```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
X_CALLBACK_URL=http://localhost:3000/auth/callback
```

### Production (.env.production)

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
X_CALLBACK_URL=https://yourdomain.com/auth/callback
```

## Security Best Practices

### ✅ Do:
- Keep `.env.local` in `.gitignore`
- Use different secrets for each environment
- Rotate secrets regularly
- Use environment-specific callback URLs
- Store production secrets in secure secret managers (Vercel, AWS Secrets Manager, etc.)

### ❌ Don't:
- Commit `.env.local` to version control
- Share secrets in public channels
- Use the same secrets across environments
- Hardcode secrets in your application code
- Use weak or predictable secrets

## Validation

The application includes automatic environment validation. If required variables are missing, you'll see helpful error messages:

```
❌ Missing required environment variable: NEXTAUTH_SECRET
💡 Generate one with: openssl rand -base64 32
```

## Troubleshooting

### "NEXTAUTH_SECRET is not defined"
- Make sure `.env.local` exists
- Restart your development server after adding variables
- Check that the variable name is spelled correctly

### "X API authentication failed"
- Verify your Client ID and Secret are correct
- Check that callback URL matches exactly
- Ensure your X app has the required permissions

### "Cannot read properties of undefined"
- Variables must be accessed via `process.env`
- Client-side variables must start with `NEXT_PUBLIC_`
- Server-side variables don't need the prefix

## Testing Your Configuration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check the console for validation messages**

3. **Test X API connection:**
   - Click "Connect X API" in the app
   - Enter your bearer token or complete OAuth flow
   - Verify connection status shows "Connected"

## Production Deployment

### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables
4. Redeploy your application

### Other Platforms
Refer to your platform's documentation for setting environment variables:
- **Netlify:** Environment variables in site settings
- **Railway:** Environment variables in project settings
- **AWS:** Use AWS Secrets Manager or Parameter Store

## Need Help?

- X API Documentation: https://developer.x.com/en/docs
- NextAuth Documentation: https://next-auth.js.org/
- Open an issue: [GitHub Issues](https://github.com/yourusername/growth-rings/issues)