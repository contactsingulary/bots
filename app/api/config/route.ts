import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agent_id = searchParams.get('agent_id') || 'default';

  const scriptContent = `window.embedApp = window.embedApp || {};
window.embedApp.config = {
  color: "#FFFFFF",
  variant: "solid",
  themeMode: "light",
  fontFamily: "inter",
  agent_id: "${agent_id}",
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