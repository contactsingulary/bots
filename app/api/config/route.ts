import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const scriptContent = `window.embedApp = window.embedApp || {};
window.embedApp.config = {
  color: "#3B82F6",
  variant: "solid",
  themeMode: "light",
  fontFamily: "inter",
  timestamp: "${new Date().toISOString()}"
};`;

  return new NextResponse(scriptContent, {
    headers: {
      'Content-Type': 'text/javascript',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}