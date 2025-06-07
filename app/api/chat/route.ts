import { NextRequest, NextResponse } from 'next/server';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent_dev:8000';

export async function POST(request: NextRequest) {
  try {
    const { message, search_limit = 50, ranked_limit = 10 } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Call the agent service
    const agentUrl = `${AGENT_SERVICE_URL}/ki-search-bm25-highlights`;
    const params = new URLSearchParams({
      question: message,
      search_limit: search_limit.toString(),
      ranked_limit: ranked_limit.toString(),
    });

    const agentResponse = await fetch(`${agentUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent service error: ${agentResponse.status}`);
    }

    const agentData = await agentResponse.json();

    // Transform the response for the frontend
    return NextResponse.json({
      success: true,
      response: agentData.response || 'Entschuldigung, ich konnte keine passende Antwort finden.',
      search_results: agentData.search_results || null,
      highlight_ids: agentData.highlight_ids || [],
      assessment: agentData.assessment || '',
      count: agentData.count || 0
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      response: 'Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat API is running',
    agent_url: AGENT_SERVICE_URL
  });
} 