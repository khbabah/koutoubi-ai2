import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get token from multiple sources
    let token = null;
    
    // Try to get from cookies first
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    token = tokenMatch ? tokenMatch[1] : null;
    
    // If no cookie, try Authorization header (for debugging)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    console.log('PDF Direct - Cookie header:', cookieHeader);
    console.log('PDF Direct - Token found:', !!token);
    console.log('PDF Direct - Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'None');

    if (!token) {
      return new NextResponse('Not authenticated. Please login first.', { 
        status: 401,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Construct the backend URL
    const pdfPath = params.path.join('/');
    const backendUrl = `http://localhost:8000/api/v1/${pdfPath}`;
    
    console.log('PDF Direct - Backend URL:', backendUrl);

    // Fetch from backend
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
    });

    console.log('PDF Direct - Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF Direct - Backend error:', errorText);
      return new NextResponse(errorText, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Stream the PDF response
    const pdfData = await response.arrayBuffer();
    
    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="chapter.pdf"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('PDF Direct - Error:', error);
    return new NextResponse('Internal server error: ' + (error as Error).message, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
}