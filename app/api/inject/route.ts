import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { minify } from 'terser';

export async function GET(request: Request) {
  try {
    const filePath = resolve(process.cwd(), 'lib/inject.js');
    
    const fileContent = readFileSync(filePath, 'utf-8');
    const result = await minify(fileContent, { 
      compress: true, 
      mangle: true 
    });
        
    return new NextResponse(result.code || fileContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new NextResponse('Error serving script', { status: 500 });
  }
}

