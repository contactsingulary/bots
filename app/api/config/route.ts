import { NextResponse } from 'next/server';

export async function GET() {
  const scriptContent = `window.embedApp = window.embedApp || {};
window.embedApp.config = {
  color: "#FFFFFF",
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