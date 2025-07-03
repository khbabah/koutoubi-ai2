'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <BookOpen className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">Koutoubi AI</span>
      </Link>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">{session?.user?.name || session?.user?.email}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}