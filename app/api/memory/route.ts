import { NextRequest, NextResponse } from 'next/server';

const LOAD_SERVICE_URL = process.env.LOAD_SERVICE_URL || 'http://load_dev:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const user_id = searchParams.get('user_id');

    // Validate required parameters
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

    // Call the load service to get memory
    const loadUrl = `${LOAD_SERVICE_URL}/chat_memory_load`;
    const params = new URLSearchParams({
      session_id: session_id,
      user_id: user_id,
    });

    console.log(`Calling load service: ${loadUrl}?${params}`);

    const loadResponse = await fetch(`${loadUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!loadResponse.ok) {
      console.error(`Load service error: ${loadResponse.status} ${loadResponse.statusText}`);
      throw new Error(`Load service error: ${loadResponse.status}`);
    }

    const loadData = await loadResponse.json();
    console.log('Load service response:', loadData);

    // Return the memory data directly from the load service
    return NextResponse.json({
      success: true,
      session_id: loadData.session_id,
      user_id: loadData.user_id,
      session_exists: loadData.session_exists || false,
      memory: loadData.memory || [],
      count: loadData.count || 0,
      error: loadData.error || null
    });

  } catch (error) {
    console.error('Memory API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load session memory'
    }, { status: 500 });
  }
}

export async function POST() {
  // Memory loading only supports GET requests
  return NextResponse.json({
    error: 'Method not allowed. Use GET to retrieve memory.',
    supported_methods: ['GET']
  }, { status: 405 });
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
      user_id: 'string (required) - User identifier'
    },
    response_format: {
      success: 'boolean',
      session_id: 'string',
      user_id: 'string', 
      session_exists: 'boolean',
      memory: 'array of interactions',
      count: 'number of interactions',
      error: 'string or null'
    }
  });
} 