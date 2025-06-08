import { NextRequest, NextResponse } from 'next/server';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent_dev:8000';

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      session_id, 
      user_id, 
      search_limit = 50, 
      ranked_limit = 10 
    } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Call the agent service with session history
    const agentUrl = `${AGENT_SERVICE_URL}/chat-with-history`;
    const params = new URLSearchParams({
      question: message,
      session_id: session_id,
      user_id: user_id,
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
      count: agentData.count || 0,
      session_id: agentData.session_id,
      user_id: agentData.user_id,
      session_exists: agentData.session_exists || false
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
  // Basic API status endpoint
  return NextResponse.json({
    message: 'Chat API is running',
    agent_url: AGENT_SERVICE_URL,
    features: [
      'Chat with session history',
      'Vector similarity search', 
      'BM25 text matching',
      'AI-powered product recommendations',
      'Automatic session management'
    ]
  });
} 