'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Camera,
  Edit2,
  Shield,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    {
      icon: User,
      label: 'Mon profil',
      onClick: () => router.push('/profile'),
    },
    // Add educator mode for teachers and parents
    ...(user?.role && ['teacher', 'parent', 'admin', 'super_admin'].includes(user.role) ? [{
      icon: GraduationCap,
      label: 'Mode éducateur',
      onClick: () => router.push('/educator'),
      className: 'text-purple-600 hover:bg-purple-50',
    }] : []),
    {
      icon: Settings,
      label: 'Paramètres',
      onClick: () => router.push('/settings'),
    },
    {
      icon: Shield,
      label: 'Sécurité',
      onClick: () => router.push('/security'),
    },
    {
      icon: HelpCircle,
      label: 'Aide',
      onClick: () => router.push('/help'),
    },
    {
      divider: true,
    },
    {
      icon: LogOut,
      label: 'Déconnexion',
      onClick: handleLogout,
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {user.name ? getInitials(user.name) : <User className="h-5 w-5" />}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-gray-900">
            {user.name || 'Utilisateur'}
          </p>
          <p className="text-xs text-gray-500">
            {user.role === 'super_admin' ? 'Super Admin' :
             user.role === 'admin' ? 'Administrateur' : 
             user.role === 'teacher' ? 'Enseignant' :
             user.role === 'parent' ? 'Parent' : 'Étudiant'}
          </p>
        </div>
        
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name ? getInitials(user.name) : <User className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {user.name || 'Utilisateur'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                if (item.divider) {
                  return <div key={index} className="my-1 border-t border-gray-200" />;
                }

                const Icon = item.icon!;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                      item.className || ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}