import { NextRequest, NextResponse } from 'next/server';

const LOAD_SERVICE_URL = process.env.LOAD_SERVICE_URL || 'http://load_singulary_dev:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const web_user_id = searchParams.get('web_user_id');

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!web_user_id || typeof web_user_id !== 'string') {
      return NextResponse.json(
        { error: 'Web User ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Call the load service to get chat memory
    const loadUrl = `${LOAD_SERVICE_URL}/chat_memory_load`;
    const params = new URLSearchParams({
      session_id: session_id,
      web_user_id: web_user_id,
    });

    console.log(`📞 Calling load service: ${loadUrl}?${params}`);

    const loadResponse = await fetch(`${loadUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!loadResponse.ok) {
      throw new Error(`Load service error: ${loadResponse.status} ${loadResponse.statusText}`);
    }

    const loadData = await loadResponse.json();

    console.log(`📊 Memory loaded: ${loadData.count} interactions for session ${session_id}`);

    // Return the memory data with success flag
    return NextResponse.json({
      success: true,
      session_id: session_id,
      web_user_id: web_user_id,
      session_exists: loadData.session_exists || false,
      memory: loadData.memory || [],
      count: loadData.count || 0
    });

  } catch (error) {
    console.error('Memory API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load chat memory',
      message: error instanceof Error ? error.message : 'Unknown error',
      memory: [],
      count: 0
    }, { status: 500 });
  }
}

export async function POST() {
  // Memory API is read-only for now
  return NextResponse.json(
    { error: 'Method not allowed. Memory API is read-only.' },
    { status: 405 }
  );
}

// API status endpoint
export async function OPTIONS() {
  return NextResponse.json({
    message: 'Memory API is running',
    load_service_url: LOAD_SERVICE_URL,
    endpoint: '/chat_memory_load',
    description: 'Load session memory for a specific user_id + session_id combination',
    parameters: {
      session_id: 'string (required) - Session identifier',
      web_user_id: 'string (required) - Web User identifier'
    },
    response_format: {
      success: 'boolean',
      session_id: 'string',
      web_user_id: 'string', 
      session_exists: 'boolean',
      memory: 'array of interactions',
      count: 'number of interactions'
    }
  });
} 