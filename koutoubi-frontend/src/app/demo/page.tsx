'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  HelpCircle, 
  ChevronRight, 
  Settings, 
  Menu,
  Sparkles,
  Target,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DemoPage() {
  const router = useRouter();
  const [showQuizModal, setShowQuizModal] = useState(false);

  const chapters = [
    {
      id: '1',
      chapter_number: 11,
      title: 'Le Bachagha Si Khelladi Ben Miloud',
      flashcard_count: 15,
      quiz_count: 10,
      progress: {
        completed_flashcards: 8,
        completion_rate: 53
      }
    },
    {
      id: '2',
      chapter_number: 12,
      title: 'La colonisation française en Afrique',
      flashcard_count: 20,
      quiz_count: 12,
      progress: {
        completed_flashcards: 20,
        completion_rate: 100
      }
    },
    {
      id: '3',
      chapter_number: 13,
      title: 'Les mouvements de résistance',
      flashcard_count: 18,
      quiz_count: 8,
      progress: {
        completed_flashcards: 5,
        completion_rate: 28
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-semibold">Koutoubi AI</span>
              </div>
              
              <nav className="hidden md:flex space-x-1">
                <Button variant="secondary" size="sm" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Learn</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Flashcards</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Quiz</span>
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button onClick={() => router.push('/login')}>
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tableau de bord - Mode Démo
            </h1>
            <p className="text-gray-600">
              Découvrez l'interface moderne de Koutoubi AI avec le style our
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center justify-between">
                  <span>Chapitres</span>
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">3</div>
                <p className="text-sm text-gray-600 mt-1">disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center justify-between">
                  <span>Flashcards</span>
                  <FileText className="h-5 w-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">53</div>
                <p className="text-sm text-gray-600 mt-1">à réviser</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center justify-between">
                  <span>Progression</span>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">62%</div>
                <p className="text-sm text-gray-600 mt-1">complété</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center justify-between">
                  <span>Points</span>
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">450</div>
                <p className="text-sm text-gray-600 mt-1">XP gagnés</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chapter List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vos chapitres</h2>
            
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Chapitre {chapter.chapter_number}: {chapter.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {chapter.flashcard_count} flashcards
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <HelpCircle className="h-4 w-4 mr-1" />
                              {chapter.quiz_count} questions
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progression</span>
                              <span className="font-medium">{chapter.progress.completion_rate}%</span>
                            </div>
                            <Progress value={chapter.progress.completion_rate} className="h-2" />
                          </div>

                          <div className="flex items-center space-x-3">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => setShowQuizModal(true)}
                            >
                              <Brain className="h-4 w-4 mr-2" />
                              Learn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Flashcards
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Quiz
                            </Button>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="bg-[#e6f2ff] rounded-xl p-6 text-center">
              <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generate a Quiz
              </h3>
              <p className="text-gray-600 mb-6">
                Generate a multiple-choice quiz from this source.
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                onClick={() => setShowQuizModal(false)}
              >
                Generate Quiz
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <button
              onClick={() => setShowQuizModal(false)}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              Annuler
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}