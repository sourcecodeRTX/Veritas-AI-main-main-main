#!/usr/bin/env node
/**
 * Configuration checker for Veritas AI Vercel deployment
 * Run this script to verify your setup before deploying
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Veritas AI configuration for Vercel deployment...\n');

const checks = [];

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.mjs', 
  'vercel.json',
  'app/api/analyze/route.ts'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  checks.push({
    name: `${file} exists`,
    status: exists ? '✅' : '❌',
    success: exists
  });
});

// Check package.json dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@ai-sdk/google',
    'ai', 
    'next',
    'react',
    'zod',
    'cheerio'
  ];
  
  requiredDeps.forEach(dep => {
    const hasDepOrDev = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    checks.push({
      name: `${dep} dependency`,
      status: hasDepOrDev ? '✅' : '❌',
      success: !!hasDepOrDev
    });
  });
} catch (error) {
  checks.push({
    name: 'package.json readable',
    status: '❌',
    success: false
  });
}

// Check vercel.json configuration
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  checks.push({
    name: 'vercel.json has framework setting',
    status: vercelConfig.framework === 'nextjs' ? '✅' : '❌',
    success: vercelConfig.framework === 'nextjs'
  });
  
  checks.push({
    name: 'vercel.json has API functions config',
    status: vercelConfig.functions ? '✅' : '❌',
    success: !!vercelConfig.functions
  });
} catch (error) {
  checks.push({
    name: 'vercel.json readable',
    status: '❌',
    success: false
  });
}

// Check next.config.mjs
try {
  const nextConfigContent = fs.readFileSync('next.config.mjs', 'utf8');
  
  checks.push({
    name: 'next.config.mjs has Gemini API key config',
    status: nextConfigContent.includes('GOOGLE_GENERATIVE_AI_API_KEY') ? '✅' : '❌',
    success: nextConfigContent.includes('GOOGLE_GENERATIVE_AI_API_KEY')
  });
} catch (error) {
  checks.push({
    name: 'next.config.mjs readable',
    status: '❌',
    success: false
  });
}

// Check API route
try {
  const apiRouteContent = fs.readFileSync('app/api/analyze/route.ts', 'utf8');
  
  checks.push({
    name: 'API route has Gemini integration',
    status: apiRouteContent.includes('@ai-sdk/google') ? '✅' : '❌',
    success: apiRouteContent.includes('@ai-sdk/google')
  });
  
  checks.push({
    name: 'API route has environment variable check',
    status: apiRouteContent.includes('process.env.GOOGLE_GENERATIVE_AI_API_KEY') ? '✅' : '❌',
    success: apiRouteContent.includes('process.env.GOOGLE_GENERATIVE_AI_API_KEY')
  });
} catch (error) {
  checks.push({
    name: 'API route readable',
    status: '❌',
    success: false
  });
}

// Check environment variable example
const hasEnvExample = fs.existsSync('.env.local.example');
checks.push({
  name: '.env.local.example exists',
  status: hasEnvExample ? '✅' : '❌',
  success: hasEnvExample
});

// Display results
console.log('Configuration Check Results:');
console.log('================================');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
});

const allPassed = checks.every(check => check.success);
const passedCount = checks.filter(check => check.success).length;

console.log('\n================================');
console.log(`Status: ${passedCount}/${checks.length} checks passed`);

if (allPassed) {
  console.log('🎉 All checks passed! Your project is ready for Vercel deployment.');
  console.log('\nNext steps:');
  console.log('1. Get your Google Gemini API key from: https://aistudio.google.com/app/apikey');
  console.log('2. Push your code to GitHub/GitLab/Bitbucket');
  console.log('3. Import your project to Vercel');
  console.log('4. Add GOOGLE_GENERATIVE_AI_API_KEY environment variable');
  console.log('5. Deploy!');
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  console.log('\nFailed checks need to be resolved for proper deployment.');
}

console.log('\nFor detailed deployment instructions, see DEPLOYMENT.md');
