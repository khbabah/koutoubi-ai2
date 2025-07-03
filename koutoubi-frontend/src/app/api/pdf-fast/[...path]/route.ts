import { NextRequest, NextResponse } from 'next/server';

// Cache pour stocker les PDFs temporairement
const pdfCache = new Map<string, { data: ArrayBuffer; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return new NextResponse('Not authenticated', { status: 401 });
    }

    const pdfPath = params.path.join('/');
    const cacheKey = `${token.substring(0, 10)}_${pdfPath}`;

    // Check cache
    const cached = pdfCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'private, max-age=300', // 5 min browser cache
        },
      });
    }

    // Fetch from backend
    const backendUrl = `http://localhost:8000/api/v1/${pdfPath}`;
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new NextResponse('PDF not found', { status: response.status });
    }

    const pdfData = await response.arrayBuffer();

    // Cache the PDF
    pdfCache.set(cacheKey, {
      data: pdfData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    for (const [key, value] of pdfCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        pdfCache.delete(key);
      }
    }

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('PDF fetch error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}