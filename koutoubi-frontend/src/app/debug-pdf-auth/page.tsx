'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DebugPDFAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Collecter les infos de debug
    const info: any = {
      sessionStatus: status,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'NO TOKEN',
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      cookies: document.cookie,
      localStorage: {
        hasAuthToken: !!localStorage.getItem('auth-token'),
        authToken: localStorage.getItem('auth-token')?.substring(0, 20) + '...' || 'NONE'
      }
    };
    setDebugInfo(info);
  }, [session, status]);

  const testPDFAccess = async () => {
    const results: any = {};
    
    // Test 1: API directe avec token NextAuth
    try {
      const res1 = await fetch('http://localhost:8000/api/v1/content/courses', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      results.apiWithNextAuthToken = {
        status: res1.status,
        ok: res1.ok,
        message: res1.ok ? 'SUCCESS' : await res1.text()
      };
    } catch (e: any) {
      results.apiWithNextAuthToken = { error: e.message };
    }

    // Test 2: Vérifier l'accès PDF avec token dans l'URL
    try {
      const pdfUrl = `http://localhost:8000/api/v1/pdf-viewer/secondaire1/1ere/mathematiques?token=${session?.access_token || ''}`;
      const res2 = await fetch(pdfUrl, {
        method: 'HEAD',
        redirect: 'manual'
      });
      results.pdfWithTokenInUrl = {
        status: res2.status,
        redirected: res2.type === 'opaqueredirect',
        headers: {
          location: res2.headers.get('location') || 'NONE'
        }
      };
    } catch (e: any) {
      results.pdfWithTokenInUrl = { error: e.message };
    }

    // Test 3: Navigation vers un cours
    results.navigationTest = {
      wouldNavigateTo: '/cours/secondaire1/1ere/mathematiques',
      middlewareWouldCheck: 'YES - /cours/* is in matcher',
      expectedBehavior: status === 'authenticated' ? 'ALLOW' : 'REDIRECT to /login'
    };

    setTestResults(results);
  };

  const navigateToCourse = () => {
    router.push('/cours/secondaire1/1ere/mathematiques');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug PDF Authentication</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Session Information</h2>
          <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Results */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Results</h2>
          <button 
            onClick={testPDFAccess}
            className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Run PDF Access Tests
          </button>
          {Object.keys(testResults).length > 0 && (
            <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(testResults, null, 2)}
            </pre>
          )}
        </div>

        {/* Navigation Test */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🚀 Navigation Test</h2>
          <p className="mb-4">Click below to navigate to a PDF course:</p>
          <button 
            onClick={navigateToCourse}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Go to Mathematics Course
          </button>
        </div>

        {/* Solutions */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">💡 Diagnostic</h2>
          {status === 'unauthenticated' && (
            <div className="text-red-700">
              <p className="font-semibold">❌ Not authenticated!</p>
              <p>You need to login first.</p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
              >
                Go to Login
              </button>
            </div>
          )}
          {status === 'authenticated' && !session?.access_token && (
            <div className="text-orange-700">
              <p className="font-semibold">⚠️ Session exists but no access token!</p>
              <p>This is a NextAuth configuration issue.</p>
            </div>
          )}
          {status === 'authenticated' && session?.access_token && (
            <div className="text-green-700">
              <p className="font-semibold">✅ Authentication looks good!</p>
              <p>If PDFs still redirect, check:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Middleware configuration</li>
                <li>Token expiration</li>
                <li>CORS settings</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}