import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthSyncProvider } from "@/components/providers/auth-sync-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Koutoubi AI - Plateforme d'apprentissage",
  description: "Plateforme éducative pour les élèves mauritaniens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>
          <AuthSyncProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </AuthSyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}