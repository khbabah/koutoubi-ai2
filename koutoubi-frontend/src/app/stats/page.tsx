'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PremiumStats from '@/components/PremiumStats';

export default function StatsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Statistiques détaillées</h1>
          <p className="text-gray-600">
            Analysez votre progression et optimisez votre apprentissage
          </p>
        </div>

        {/* Stats Component */}
        <PremiumStats />
      </div>
    </div>
  );
}