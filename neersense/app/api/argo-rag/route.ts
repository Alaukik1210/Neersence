// app/api/argo/route.ts
import { NextRequest, NextResponse } from 'next/server';

// FastAPI backend URL - adjust this to match your FastAPI server
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Forward the request to your FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        n_results: body.n_results || 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to query FastAPI backend', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the response from FastAPI
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Health check endpoint
    const response = await fetch(`${FASTAPI_URL}/health`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'FastAPI backend is not responding' },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: 'healthy',
      backend: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Cannot connect to FastAPI backend', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}