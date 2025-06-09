import { NextRequest, NextResponse } from 'next/server';

const ROUTER_SERVICE_URL = process.env.ROUTER_SERVICE_URL || 'http://agent_router_dev:8000';

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

    // Call the router service first to get routing decision and agent response
    const routerUrl = `${ROUTER_SERVICE_URL}/router`;
    const params = new URLSearchParams({
      question: message,
      session_id: session_id,
      user_id: user_id,
    });

    const routerResponse = await fetch(`${routerUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!routerResponse.ok) {
      throw new Error(`Router service error: ${routerResponse.status}`);
    }

    const routerData = await routerResponse.json();

    // Check if router successfully called an agent
    if (!routerData.agent?.success) {
      return NextResponse.json({
        success: false,
        error: 'Agent service unavailable',
        response: 'Entschuldigung, der Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.',
        router_info: {
          route: routerData.router?.route || 'unknown',
          confidence: routerData.router?.confidence || 0,
          reasoning: routerData.router?.reasoning || 'Unknown routing error'
        }
      }, { status: 503 });
    }

    // Extract agent response data
    const agentData = routerData.agent.agent_response;

    // Transform the response for the frontend - maintaining compatibility
    return NextResponse.json({
      success: true,
      response: agentData.response || 'Entschuldigung, ich konnte keine passende Antwort finden.',
      search_results: agentData.search_results || null,
      highlight_ids: agentData.highlighted_pages || [],
      assessment: agentData.assessment || '',
      count: agentData.count || 0,
      session_id: agentData.session_id || session_id,
      user_id: agentData.user_id || user_id,
      session_exists: agentData.session_exists || false,
      // Additional router information
      router_info: {
        route: routerData.router.route,
        confidence: routerData.router.confidence,
        reasoning: routerData.router.reasoning,
        extracted_entities: routerData.router.extracted_entities || [],
        enhanced_question: routerData.router.enhanced_question,
        original_question: routerData.router.original_question
      }
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
    message: 'Chat API is running with Router',
    router_url: ROUTER_SERVICE_URL,
    features: [
      'Intelligent question routing',
      'Product vs General classification', 
      'Entity extraction and enhancement',
      'Automatic agent selection',
      'Session management across agents'
    ]
  });
} 