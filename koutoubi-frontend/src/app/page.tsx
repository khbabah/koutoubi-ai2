'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Trophy, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const features = [
    {
      icon: BookOpen,
      title: 'Manuels scolaires',
      description: 'Accédez à tous vos manuels du programme mauritanien en ligne',
    },
    {
      icon: Brain,
      title: 'Mode Learn intelligent',
      description: 'Résumés IA, cartes mentales, flashcards et quiz personnalisés',
    },
    {
      icon: Trophy,
      title: 'Suivi de progression',
      description: 'Visualisez vos progrès et optimisez votre apprentissage',
    },
    {
      icon: Zap,
      title: 'Répétition espacée',
      description: 'Mémorisez efficacement avec notre algorithme intelligent',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Koutoubi AI</span>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link href="/register">
            <Button>S'inscrire</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Apprenez plus intelligemment, réussissez plus facilement
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La plateforme d'apprentissage conçue pour les élèves mauritaniens.
            Accédez à vos manuels, révisez avec l'IA et suivez votre progression.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à transformer votre apprentissage ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez des milliers d'élèves qui réussissent avec Koutoubi AI
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Créer mon compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 Koutoubi AI. Tous droits réservés.</p>
      </footer>
    </div>
  );
}