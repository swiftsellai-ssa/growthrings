#!/usr/bin/env node

/**
 * Interactive Environment Setup Script
 *
 * This script helps developers set up their .env.local file
 * with proper validation and helpful prompts.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
  });
}

function generateNextAuthSecret() {
  try {
    return execSync('openssl rand -base64 32').toString().trim();
  } catch (error) {
    // Fallback if openssl is not available
    return require('crypto').randomBytes(32).toString('base64');
  }
}

async function main() {
  log('\n' + '='.repeat(80), 'bright');
  log('Growth Rings - Environment Setup', 'bright');
  log('='.repeat(80) + '\n', 'bright');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.local.example');

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    log('⚠️  .env.local already exists!', 'yellow');
    const overwrite = await question('Do you want to overwrite it? (y/N): ');

    if (overwrite.toLowerCase() !== 'y') {
      log('\n✅ Keeping existing .env.local file', 'green');
      rl.close();
      return;
    }
  }

  // Check if example file exists
  if (!fs.existsSync(envExamplePath)) {
    log('❌ .env.local.example not found!', 'red');
    log('Please create it first or run this script from the project root.', 'red');
    rl.close();
    process.exit(1);
  }

  log('This wizard will help you set up your environment variables.\n', 'blue');

  const config = {};

  // NextAuth Secret
  log('━'.repeat(80), 'bright');
  log('1. NextAuth Configuration', 'bright');
  log('━'.repeat(80), 'bright');

  const useAutoSecret = await question('\nGenerate random NEXTAUTH_SECRET automatically? (Y/n): ');

  if (useAutoSecret.toLowerCase() !== 'n') {
    config.NEXTAUTH_SECRET = generateNextAuthSecret();
    log(`✅ Generated: ${config.NEXTAUTH_SECRET.substring(0, 20)}...`, 'green');
  } else {
    config.NEXTAUTH_SECRET = await question('Enter NEXTAUTH_SECRET (or press Enter to generate): ');
    if (!config.NEXTAUTH_SECRET) {
      config.NEXTAUTH_SECRET = generateNextAuthSecret();
      log(`✅ Generated: ${config.NEXTAUTH_SECRET.substring(0, 20)}...`, 'green');
    }
  }

  config.NEXTAUTH_URL = await question('Enter NEXTAUTH_URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // X API Configuration
  log('\n' + '━'.repeat(80), 'bright');
  log('2. X API Configuration', 'bright');
  log('━'.repeat(80), 'bright');
  log('\nYou can use either OAuth (Client ID/Secret) OR Bearer Token', 'blue');

  const xApiMethod = await question('\nWhich method do you want to use? (1=OAuth, 2=Bearer Token, 0=Skip): ');

  if (xApiMethod === '1') {
    config.X_CLIENT_ID = await question('Enter X_CLIENT_ID: ');
    config.X_CLIENT_SECRET = await question('Enter X_CLIENT_SECRET: ');
    config.X_CALLBACK_URL = await question('Enter X_CALLBACK_URL (default: http://localhost:3000/auth/callback): ')
      || 'http://localhost:3000/auth/callback';

    if (config.X_CLIENT_ID && config.X_CLIENT_SECRET) {
      log('✅ OAuth configuration set', 'green');
    } else {
      log('⚠️  OAuth configuration incomplete', 'yellow');
    }
  } else if (xApiMethod === '2') {
    config.X_API_BEARER_TOKEN = await question('Enter X_API_BEARER_TOKEN: ');

    if (config.X_API_BEARER_TOKEN) {
      log('✅ Bearer Token set', 'green');
    } else {
      log('⚠️  Bearer Token not set', 'yellow');
    }
  } else {
    log('⏭️  Skipping X API configuration', 'yellow');
  }

  // Optional: ConvertKit
  log('\n' + '━'.repeat(80), 'bright');
  log('3. ConvertKit Configuration (Optional)', 'bright');
  log('━'.repeat(80), 'bright');

  const setupConvertKit = await question('\nDo you want to set up ConvertKit? (y/N): ');

  if (setupConvertKit.toLowerCase() === 'y') {
    config.CONVERTKIT_API_KEY = await question('Enter CONVERTKIT_API_KEY: ');
    config.CONVERTKIT_FORM_ID = await question('Enter CONVERTKIT_FORM_ID: ');

    if (config.CONVERTKIT_API_KEY && config.CONVERTKIT_FORM_ID) {
      log('✅ ConvertKit configuration set', 'green');
    }
  } else {
    log('⏭️  Skipping ConvertKit configuration', 'yellow');
  }

  // Optional: Google Analytics
  log('\n' + '━'.repeat(80), 'bright');
  log('4. Google Analytics (Optional)', 'bright');
  log('━'.repeat(80), 'bright');

  const setupGA = await question('\nDo you want to set up Google Analytics? (y/N): ');

  if (setupGA.toLowerCase() === 'y') {
    config.NEXT_PUBLIC_GA_MEASUREMENT_ID = await question('Enter GA Measurement ID (G-XXXXXXXXXX): ');

    if (config.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      log('✅ Google Analytics configuration set', 'green');
    }
  } else {
    log('⏭️  Skipping Google Analytics configuration', 'yellow');
  }

  // Node Environment
  config.NODE_ENV = 'development';

  // Generate .env.local content
  let envContent = '# Growth Rings Environment Configuration\n';
  envContent += `# Generated on ${new Date().toISOString()}\n\n`;

  envContent += '# NextAuth Configuration\n';
  envContent += `NEXTAUTH_SECRET=${config.NEXTAUTH_SECRET}\n`;
  envContent += `NEXTAUTH_URL=${config.NEXTAUTH_URL}\n\n`;

  if (config.X_CLIENT_ID || config.X_CLIENT_SECRET || config.X_CALLBACK_URL) {
    envContent += '# X API OAuth Configuration\n';
    if (config.X_CLIENT_ID) envContent += `X_CLIENT_ID=${config.X_CLIENT_ID}\n`;
    if (config.X_CLIENT_SECRET) envContent += `X_CLIENT_SECRET=${config.X_CLIENT_SECRET}\n`;
    if (config.X_CALLBACK_URL) envContent += `X_CALLBACK_URL=${config.X_CALLBACK_URL}\n`;
    envContent += '\n';
  }

  if (config.X_API_BEARER_TOKEN) {
    envContent += '# X API Bearer Token\n';
    envContent += `X_API_BEARER_TOKEN=${config.X_API_BEARER_TOKEN}\n\n`;
  }

  if (config.CONVERTKIT_API_KEY || config.CONVERTKIT_FORM_ID) {
    envContent += '# ConvertKit Configuration\n';
    if (config.CONVERTKIT_API_KEY) envContent += `CONVERTKIT_API_KEY=${config.CONVERTKIT_API_KEY}\n`;
    if (config.CONVERTKIT_FORM_ID) envContent += `CONVERTKIT_FORM_ID=${config.CONVERTKIT_FORM_ID}\n`;
    envContent += '\n';
  }

  if (config.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    envContent += '# Google Analytics\n';
    envContent += `NEXT_PUBLIC_GA_MEASUREMENT_ID=${config.NEXT_PUBLIC_GA_MEASUREMENT_ID}\n\n`;
  }

  envContent += '# Environment\n';
  envContent += `NODE_ENV=${config.NODE_ENV}\n`;

  // Write to .env.local
  try {
    fs.writeFileSync(envPath, envContent);
    log('\n' + '='.repeat(80), 'bright');
    log('✅ .env.local created successfully!', 'green');
    log('='.repeat(80), 'bright');
    log(`\n📁 Location: ${envPath}`, 'blue');
    log('\n📝 Next steps:', 'bright');
    log('   1. Review your .env.local file', 'cyan');
    log('   2. Start the development server: npm run dev', 'cyan');
    log('   3. Check the console for any validation warnings\n', 'cyan');
  } catch (error) {
    log('\n❌ Failed to create .env.local', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled', 'yellow');
  rl.close();
  process.exit(0);
});

main().catch((error) => {
  log('\n❌ Error during setup:', 'red');
  log(error.message, 'red');
  rl.close();
  process.exit(1);
});