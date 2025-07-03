import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple test to return a basic PDF response
  return new NextResponse('This is a test PDF endpoint. If you see this text, the iframe is loading HTML instead of PDF.', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}