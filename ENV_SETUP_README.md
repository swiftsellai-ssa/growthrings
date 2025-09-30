# 🔐 Environment Setup Guide

Quick guide to set up environment variables for Growth Rings.

## Quick Setup (Recommended)

Run the interactive setup wizard:

```bash
npm run setup
```

This will guide you through setting up all required environment variables.

## Manual Setup

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` and fill in your values**

3. **Validate your configuration:**
   ```bash
   npm run env:validate
   ```

## Required Variables

### NEXTAUTH_SECRET (Required)

Generate a secure random secret:

```bash
openssl rand -base64 32
```

Or let the setup script generate one for you.

### X API Authentication (Choose One)

#### Option 1: Bearer Token (Easiest for testing)

```env
X_API_BEARER_TOKEN=your_bearer_token_here
```

**Get it from:** [X Developer Portal](https://developer.x.com/en/portal/dashboard) → Your App → Keys and Tokens

**Limitations:**
- ✅ Quick and easy setup
- ✅ Perfect for testing
- ❌ Only your account data
- ❌ 450 requests per 15 minutes

#### Option 2: OAuth (Recommended for production)

```env
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here
X_CALLBACK_URL=http://localhost:3000/auth/callback
```

**Get them from:** [X Developer Portal](https://developer.x.com/en/portal/dashboard) → Your App → Keys and Tokens

**Benefits:**
- ✅ Access other users' data (with permission)
- ✅ Higher rate limits
- ✅ More features available

## Optional Variables

### ConvertKit (Email Collection)

```env
CONVERTKIT_API_KEY=your_api_key
CONVERTKIT_FORM_ID=your_form_id
```

Sign up at [ConvertKit](https://convertkit.com/) to get these.

### Google Analytics

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Get from [Google Analytics](https://analytics.google.com/)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Interactive environment setup wizard |
| `npm run env:validate` | Validate environment configuration |
| `npm run dev` | Start development server (validates env automatically) |

## Troubleshooting

### "NEXTAUTH_SECRET is not defined"

1. Make sure `.env.local` exists in your project root
2. Restart your development server after adding variables
3. Check the variable name spelling

### "X API authentication failed"

1. Verify your credentials are correct
2. Check callback URL matches exactly in X Developer Portal
3. Ensure your X app has the required permissions

### "Module not found" errors

Run `npm install` to install dependencies.

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit `.env.local` to version control
- [ ] Use different secrets for dev/staging/production
- [ ] Rotate secrets regularly
- [ ] Don't share secrets in Slack, email, etc.

## Need More Help?

📖 **Full Documentation:** [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)

🐛 **Issues:** Open an issue on GitHub

💬 **Questions:** Check existing issues or create a new one

---

**Next Steps After Setup:**

1. Run `npm run dev` to start the development server
2. Open http://localhost:3000
3. Click "Connect X API" and enter your credentials
4. Start creating growth rings! 🎨