import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    environment: process.env.NODE_ENV,
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'NOT CONFIGURED',
      keyConfigured: !!process.env.NEXT_PUBLIC_API_KEY,
      frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'NOT CONFIGURED',
    },
    status: {
      apiUrlConfigured: !!process.env.NEXT_PUBLIC_API_URL,
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_API_KEY,
      allConfigured: !!process.env.NEXT_PUBLIC_API_URL && !!process.env.NEXT_PUBLIC_API_KEY,
    },
    instructions: {
      local: 'Run: npm run env:setup && npm run dev:php',
      production: 'Set environment variables in your hosting platform',
    }
  };

  return NextResponse.json(config, { status: 200 });
}