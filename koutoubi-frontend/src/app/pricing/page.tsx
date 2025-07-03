'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Zap, 
  Download, 
  Brain, 
  Star,
  ArrowLeft,
  Loader2,
  School
} from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuthStore } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/useSubscription';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number;
  features: {
    [key: string]: boolean;
  };
  limits: {
    ai_summaries: number | null;
    ai_questions_daily: number | null;
    quiz_generation_weekly: number | null;
    mindmap_generation_monthly: number | null;
    favorites: number | null;
  };
}

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { status: subStatus, isPremium } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionsApi.getPlans();
      const formattedPlans = response.data.map((plan: any) => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : {},
        limits: {
          ai_summaries: plan.ai_summaries_limit,
          ai_questions_daily: plan.ai_questions_daily_limit,
          quiz_generation_weekly: plan.quiz_generation_weekly_limit,
          mindmap_generation_monthly: plan.mindmap_generation_monthly_limit,
          favorites: plan.favorites_limit
        }
      }));
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour souscrire');
      router.push('/login');
      return;
    }

    setSubscribing(planId);
    try {
      // TODO: Intégrer avec système de paiement réel
      await subscriptionsApi.subscribe(planId, 'demo', 'demo-ref-' + Date.now());
      toast.success('Abonnement activé avec succès !');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Erreur lors de la souscription');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const freePlan = plans.find(p => p.type === 'free');
  const monthlyPlan = plans.find(p => p.type === 'premium_monthly');
  const yearlyPlan = plans.find(p => p.type === 'premium_yearly');
  const studentPlan = plans.find(p => p.type === 'student_yearly');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Tarification</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Débloquez tout le potentiel de Koutoubi AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Accédez à des outils IA illimités pour transformer votre apprentissage
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            {freePlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {freePlan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">Gratuit</span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Lecture des PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {freePlan.limits.ai_summaries} résumés IA/mois
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {freePlan.limits.ai_questions_daily} questions IA/jour
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {freePlan.limits.favorites} favoris max
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Téléchargement PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Mode hors-ligne</span>
                  </div>
                </div>
                
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Plan actuel
                </button>
              </motion.div>
            )}

            {/* Monthly Plan */}
            {monthlyPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border-2 border-blue-500 p-6 relative"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {monthlyPlan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {monthlyPlan.price} MAD
                  </span>
                  <span className="text-gray-600">/mois</span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">
                      Tout illimité
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Résumés IA illimités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Questions IA illimitées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Quiz personnalisés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Mindmaps interactives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Téléchargement PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Mode hors-ligne</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleSubscribe(monthlyPlan.id)}
                  disabled={subscribing === monthlyPlan.id || isPremium}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {subscribing === monthlyPlan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPremium ? (
                    'Déjà abonné'
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Souscrire
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Yearly Plan */}
            {yearlyPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    2 mois offerts
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {yearlyPlan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {yearlyPlan.price} MAD
                  </span>
                  <span className="text-gray-600">/an</span>
                  <p className="text-sm text-green-600 mt-1">
                    Économisez {(monthlyPlan!.price * 12 - yearlyPlan.price).toFixed(0)} MAD
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">
                      Tout du Premium
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Accès anticipé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Support prioritaire</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleSubscribe(yearlyPlan.id)}
                  disabled={subscribing === yearlyPlan.id || isPremium}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {subscribing === yearlyPlan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPremium ? (
                    'Déjà abonné'
                  ) : (
                    'Économiser 17%'
                  )}
                </button>
              </motion.div>
            )}

            {/* Student Plan */}
            {studentPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <School className="h-5 w-5 text-blue-600" />
                  {studentPlan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {studentPlan.price} MAD
                  </span>
                  <span className="text-gray-600">/an</span>
                  <p className="text-sm text-blue-600 mt-1">
                    Avec justificatif étudiant
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">
                      Tout du Premium
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Prix réduit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Vérification requise</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleSubscribe(studentPlan.id)}
                  disabled={subscribing === studentPlan.id || isPremium}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {subscribing === studentPlan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPremium ? (
                    'Déjà abonné'
                  ) : (
                    'Tarif étudiant'
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Features Comparison */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Comparaison des fonctionnalités
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-medium text-gray-900">
                      Fonctionnalité
                    </th>
                    <th className="text-center p-4 font-medium text-gray-900">
                      Gratuit
                    </th>
                    <th className="text-center p-4 font-medium text-gray-900">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Lecture des PDF</td>
                    <td className="p-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Résumés IA</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      3/mois
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">Illimité</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Questions IA</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      5/jour
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">Illimité</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Quiz personnalisés</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      1/semaine
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">Illimité</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Mindmaps</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      2/mois
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">Illimité</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Téléchargement PDF</td>
                    <td className="p-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">Mode hors-ligne</td>
                    <td className="p-4 text-center">
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-600">Support</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      Standard
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-blue-600 font-medium">Prioritaire</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Questions fréquentes
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Puis-je changer de plan à tout moment ?
                </h4>
                <p className="text-gray-600 text-sm">
                  Oui, vous pouvez passer à un plan supérieur à tout moment. 
                  Le montant déjà payé sera déduit au prorata.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Comment fonctionne le tarif étudiant ?
                </h4>
                <p className="text-gray-600 text-sm">
                  Envoyez-nous votre carte étudiant valide et bénéficiez de 25% 
                  de réduction sur le plan annuel.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Puis-je annuler mon abonnement ?
                </h4>
                <p className="text-gray-600 text-sm">
                  Oui, vous pouvez annuler à tout moment. Vous conserverez l'accès 
                  jusqu'à la fin de votre période payée.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Quels moyens de paiement acceptez-vous ?
                </h4>
                <p className="text-gray-600 text-sm">
                  Nous acceptons les cartes bancaires, PayPal, et les virements 
                  bancaires pour les établissements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}