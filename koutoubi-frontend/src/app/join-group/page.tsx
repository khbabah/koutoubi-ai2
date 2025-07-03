'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, CheckCircle } from 'lucide-react';
import { educatorApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
    }
  }, [searchParams]);

  const handleJoinGroup = async () => {
    if (!code || code.length !== 6) {
      toast.error('Veuillez entrer un code valide (6 caractères)');
      return;
    }

    setLoading(true);
    try {
      const response = await educatorApi.joinStudyGroup(code);
      toast.success(response.data.message || 'Groupe rejoint avec succès !');
      
      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Code invalide ou groupe inactif');
      } else if (error.response?.status === 400) {
        toast.error('Vous êtes déjà membre de ce groupe');
      } else {
        toast.error('Erreur lors de la tentative de rejoindre le groupe');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Rejoindre un groupe</h1>
          <p className="text-gray-600">
            Entrez le code d'invitation fourni par votre enseignant
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Code d'invitation
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD12"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-wider"
            />
          </div>

          <Button
            onClick={handleJoinGroup}
            disabled={loading || !code}
            className="w-full"
          >
            {loading ? 'Connexion en cours...' : 'Rejoindre le groupe'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Pas de code ?</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:underline"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}