'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import EducatorDashboard from '@/components/educator/EducatorDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Users, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EducatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await authApi.getProfile();
      const user = response.data;
      
      if (!user.role || !['teacher', 'parent', 'admin'].includes(user.role)) {
        setUserRole(user.role || 'student');
        setLoading(false);
        return;
      }
      
      setUserRole(user.role);
      setLoading(false);
    } catch (error) {
      toast.error('Erreur lors de la vérification des droits');
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userRole || !['teacher', 'parent', 'admin'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Accès restreint</h2>
          <p className="text-gray-600 mb-6">
            Cette section est réservée aux enseignants et parents.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Enseignants</h3>
              <p className="text-sm text-gray-600">
                Créez des quiz et flashcards personnalisés pour vos élèves
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Parents</h3>
              <p className="text-sm text-gray-600">
                Accompagnez vos enfants avec du contenu éducatif sur mesure
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
            <p className="text-sm text-gray-500">
              Contactez l'administrateur pour obtenir les droits d'accès
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <EducatorDashboard />;
}