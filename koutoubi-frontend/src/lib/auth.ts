import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  access_token: string;
  refresh_token?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          return null;
        }

        try {
          console.log('[NextAuth] Attempting login for:', credentials.email);
          
          // Call our FastAPI backend
          const res = await fetch(`${API_URL}/api/v1/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              username: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('[NextAuth] Token response status:', res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error('[NextAuth] Token error:', errorText);
            return null;
          }

          const data = await res.json();
          console.log('[NextAuth] Token received:', data.access_token ? 'Yes' : 'No');
          
          // Get user profile with the token
          const profileRes = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });

          console.log('[NextAuth] Profile response status:', profileRes.status);

          if (!profileRes.ok) {
            const errorText = await profileRes.text();
            console.error('[NextAuth] Profile error:', errorText);
            return null;
          }

          const profile = await profileRes.json();
          console.log('[NextAuth] Profile data:', { email: profile.email, role: profile.role });

          // Return user object with token
          const user = {
            id: profile.id,
            email: profile.email,
            name: profile.username || profile.email,
            role: profile.role,
            is_active: profile.is_active,
            access_token: data.access_token,
          } as User;
          
          console.log('[NextAuth] Returning user:', { email: user.email, role: user.role });
          return user;
        } catch (error) {
          console.error('[NextAuth] Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as User).role,
          is_active: (user as User).is_active,
          access_token: (user as User).access_token,
        };
      }

      // Update session
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      // Return previous token if no update
      return token;
    },
    async session({ session, token }) {
      // Add user properties to session
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
        is_active: token.is_active as boolean,
      };
      
      // Add access token to session for API calls
      session.access_token = token.access_token as string;
      
      return session;
    },
  },
  events: {
    async signOut() {
      // Optional: Invalidate token on backend
      // await fetch(`${API_URL}/api/v1/auth/logout`, { method: 'POST' });
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Type augmentation for TypeScript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      is_active: boolean;
    };
    access_token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    is_active: boolean;
    access_token: string;
  }
}