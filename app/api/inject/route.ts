import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the inject.js file
    const injectPath = path.join(process.cwd(), 'lib', 'inject.js');
    let injectContent = fs.readFileSync(injectPath, 'utf8');
    
    // Get the origin URL from environment variable
    const originUrl = process.env.NEXT_PUBLIC_ORIGIN_URL;
    
    // Replace the placeholder with the environment variable value
    injectContent = injectContent.replace(
      "origin: '__ORIGIN_URL__',",
      `origin: '${originUrl}',`
    );
    
    // Return the modified JavaScript with correct content type
    return new NextResponse(injectContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving inject.js:', error);
    return NextResponse.json(
      { error: 'Failed to load inject script' },
      { status: 500 }
    );
  }
}

