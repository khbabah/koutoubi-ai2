"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Brain,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Trophy,
  Zap,
  BookMarked,
  Timer,
  BarChart3,
  Sparkles
} from 'lucide-react';

interface LearnModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  pageContent?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface LearningSection {
  id: string;
  title: string;
  content: string;
  type: 'concept' | 'example' | 'practice' | 'summary';
  completed: boolean;
  duration: number; // minutes
}

export default function LearnModeModal({
  isOpen,
  onClose,
  courseTitle,
  pageContent = '',
  currentPage,
  totalPages,
  onPageChange
}: LearnModeModalProps) {
  const [activeTab, setActiveTab] = useState('guided');
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [studyTime, setStudyTime] = useState(0);
  const [streakDays, setStreakDays] = useState(7);
  const [totalPoints, setTotalPoints] = useState(1250);
  const [showHint, setShowHint] = useState(false);

  // Generate learning sections from content
  const learningSections: LearningSection[] = [
    {
      id: '1',
      title: 'Introduction aux Concepts',
      content: pageContent.slice(0, 500) || 'Découvrez les concepts fondamentaux de cette leçon...',
      type: 'concept',
      completed: false,
      duration: 5
    },
    {
      id: '2',
      title: 'Exemples Pratiques',
      content: 'Voici des exemples concrets pour mieux comprendre...',
      type: 'example',
      completed: false,
      duration: 8
    },
    {
      id: '3',
      title: 'Exercices Guidés',
      content: 'Pratiquons ensemble avec ces exercices...',
      type: 'practice',
      completed: false,
      duration: 10
    },
    {
      id: '4',
      title: 'Résumé et Points Clés',
      content: 'Les points essentiels à retenir de cette leçon...',
      type: 'summary',
      completed: false,
      duration: 3
    }
  ];

  const currentSectionData = learningSections[currentSection];
  const progress = (completedSections.size / learningSections.length) * 100;

  useEffect(() => {
    // Start study timer
    const timer = setInterval(() => {
      setStudyTime(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleSectionComplete = () => {
    if (!currentSectionData) return;

    const newCompleted = new Set(completedSections);
    newCompleted.add(currentSectionData.id);
    setCompletedSections(newCompleted);
    
    // Award points
    const points = currentSectionData.type === 'practice' ? 50 : 25;
    setTotalPoints(prev => prev + points);
    
    toast.success(`Section complétée! +${points} points`);

    // Move to next section or complete
    if (currentSection < learningSections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      toast.success('🎉 Page complétée! Excellent travail!');
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setCurrentSection(0);
      setCompletedSections(new Set());
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setCurrentSection(0);
      setCompletedSections(new Set());
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'concept': return <Lightbulb className="w-5 h-5" />;
      case 'example': return <BookOpen className="w-5 h-5" />;
      case 'practice': return <Brain className="w-5 h-5" />;
      case 'summary': return <BookMarked className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'concept': return 'bg-blue-500';
      case 'example': return 'bg-green-500';
      case 'practice': return 'bg-purple-500';
      case 'summary': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mode Apprentissage Intelligent
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {courseTitle} - Page {currentPage}/{totalPages}
                </DialogDescription>
              </div>
              <div className="flex gap-4">
                {/* Study Stats */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{studyTime} min</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">{streakDays} jours</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{totalPoints} pts</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                <TabsTrigger value="guided">Apprentissage Guidé</TabsTrigger>
                <TabsTrigger value="practice">Pratique Active</TabsTrigger>
                <TabsTrigger value="review">Révision Rapide</TabsTrigger>
              </TabsList>

              <TabsContent value="guided" className="h-full px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                  {/* Progress Sidebar */}
                  <div className="lg:col-span-1">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Progression
                          <Badge variant="secondary">{Math.round(progress)}%</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={progress} className="mb-4" />
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {learningSections.map((section, index) => (
                              <button
                                key={section.id}
                                onClick={() => setCurrentSection(index)}
                                className={`w-full text-left p-3 rounded-lg transition-all ${
                                  index === currentSection
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : completedSections.has(section.id)
                                    ? 'bg-green-50 border border-green-300'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-full text-white ${getSectionColor(section.type)}`}>
                                    {getSectionIcon(section.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{section.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {section.duration} min
                                    </p>
                                  </div>
                                  {completedSections.has(section.id) && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-3">
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full text-white ${getSectionColor(currentSectionData?.type || '')}`}>
                              {getSectionIcon(currentSectionData?.type || '')}
                            </div>
                            <div>
                              <CardTitle>{currentSectionData?.title}</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                Section {currentSection + 1} sur {learningSections.length}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {currentSectionData?.duration} min estimées
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[350px] mb-6">
                          <div className="prose max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {currentSectionData?.content}
                            </p>
                          </div>
                        </ScrollArea>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowHint(!showHint)}
                            >
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Indice
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success('Exemple supplémentaire ajouté!')}
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              Plus d'exemples
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => currentSection > 0 && setCurrentSection(prev => prev - 1)}
                              disabled={currentSection === 0}
                            >
                              <ChevronLeft className="w-4 h-4 mr-2" />
                              Précédent
                            </Button>
                            <Button
                              onClick={handleSectionComplete}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {currentSection === learningSections.length - 1 ? 'Terminer' : 'Suivant'}
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>

                        {showHint && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              💡 <strong>Astuce:</strong> Concentrez-vous sur les mots-clés et essayez de reformuler le concept avec vos propres mots.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="practice" className="h-full px-6 pb-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Pratique Active</CardTitle>
                    <DialogDescription>
                      Testez votre compréhension avec des exercices interactifs
                    </DialogDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                          <h3 className="font-semibold mb-2">Quiz Rapide</h3>
                          <p className="text-sm text-gray-600 mb-4">5 questions sur cette page</p>
                          <Button size="sm" className="w-full">Commencer</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                          <Target className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                          <h3 className="font-semibold mb-2">Exercices Ciblés</h3>
                          <p className="text-sm text-gray-600 mb-4">Pratiquez les concepts clés</p>
                          <Button size="sm" className="w-full">Commencer</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                          <h3 className="font-semibold mb-2">Problèmes Avancés</h3>
                          <p className="text-sm text-gray-600 mb-4">Défiez-vous davantage</p>
                          <Button size="sm" className="w-full">Commencer</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="h-full px-6 pb-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Révision Rapide</CardTitle>
                    <DialogDescription>
                      Récapitulatif des points importants
                    </DialogDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Points Clés
                          </h4>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Concept principal maîtrisé</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Exemples pratiques compris</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Exercices résolus avec succès</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Target className="w-5 h-5 text-yellow-600" />
                            À Revoir
                          </h4>
                          <ul className="space-y-2">
                            <li className="text-sm">• Applications avancées du concept</li>
                            <li className="text-sm">• Cas particuliers et exceptions</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-green-600" />
                            Progrès Réalisés
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Maîtrise du chapitre</span>
                                <span className="font-medium">75%</span>
                              </div>
                              <Progress value={75} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Exercices complétés</span>
                                <span className="font-medium">12/15</span>
                              </div>
                              <Progress value={80} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Page précédente
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Page suivante
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <Button onClick={onClose} variant="ghost">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}