'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Users, BookOpen, BrainCircuit, BarChart3,
  Share2, Settings, Search, Filter, Grid, List,
  Calendar, Award, TrendingUp, Clock
} from 'lucide-react';
import QuizEditor from './QuizEditor';
import FlashcardEditor from './FlashcardEditor';
import GroupsTab from './GroupsTab';
import StudentProgress from './StudentProgress';
import { educatorApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface ContentItem {
  id: string;
  title: string;
  type: 'quiz' | 'flashcard';
  created_at: string;
  updated_at: string;
  is_public: boolean;
  chapter_id?: string;
  course_id?: string;
  creator_name?: string;
  // Pour les quiz
  questions_count?: number;
  attempts_count?: number;
  average_score?: number;
  difficulty?: string;
  // Pour les flashcards
  cards_count?: number;
}

export default function EducatorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showFlashcardEditor, setShowFlashcardEditor] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalFlashcards: 0,
    totalStudents: 0,
    avgQuizScore: 0,
    weeklyActivity: []
  });

  useEffect(() => {
    loadContent();
    loadStats();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [quizzesRes, flashcardsRes] = await Promise.all([
        educatorApi.getQuizzes({ my_quizzes: true }),
        educatorApi.getFlashcardDecks({ my_decks: true })
      ]);

      const items: ContentItem[] = [
        ...quizzesRes.data.map((quiz: any) => ({
          ...quiz,
          type: 'quiz' as const,
          questions_count: quiz.questions?.length || 0
        })),
        ...flashcardsRes.data.map((deck: any) => ({
          ...deck,
          type: 'flashcard' as const
        }))
      ];

      // Trier par date de mise à jour
      items.sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - 
        new Date(a.updated_at || a.created_at).getTime()
      );

      setContentItems(items);
    } catch (error) {
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Simuler le chargement des statistiques
    // Dans une vraie implémentation, ces données viendraient de l'API
    setStats({
      totalQuizzes: 12,
      totalFlashcards: 8,
      totalStudents: 45,
      avgQuizScore: 78,
      weeklyActivity: [
        { day: 'Lun', value: 12 },
        { day: 'Mar', value: 19 },
        { day: 'Mer', value: 15 },
        { day: 'Jeu', value: 25 },
        { day: 'Ven', value: 22 },
        { day: 'Sam', value: 8 },
        { day: 'Dim', value: 5 }
      ]
    });
  };

  const handleCreateQuiz = () => {
    setSelectedQuizId(null);
    setShowQuizEditor(true);
    setActiveTab('content');
  };

  const handleCreateFlashcard = () => {
    setSelectedDeckId(null);
    setShowFlashcardEditor(true);
    setActiveTab('content');
  };

  const handleEditQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setShowQuizEditor(true);
  };

  const handleEditFlashcard = (deckId: string) => {
    setSelectedDeckId(deckId);
    setShowFlashcardEditor(true);
  };

  const handleDeleteContent = async (item: ContentItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ?`)) {
      return;
    }

    try {
      if (item.type === 'quiz') {
        await educatorApi.deleteQuiz(item.id);
      } else {
        await educatorApi.deleteFlashcardDeck(item.id);
      }
      toast.success('Contenu supprimé');
      loadContent();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredContent = contentItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.type.includes(query)
    );
  });

  if (showQuizEditor) {
    return (
      <QuizEditor
        quizId={selectedQuizId || undefined}
        onSave={() => {
          setShowQuizEditor(false);
          loadContent();
        }}
        onCancel={() => setShowQuizEditor(false)}
      />
    );
  }

  if (showFlashcardEditor) {
    return (
      <FlashcardEditor
        deckId={selectedDeckId || undefined}
        onSave={() => {
          setShowFlashcardEditor(false);
          loadContent();
        }}
        onCancel={() => setShowFlashcardEditor(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord éducateur</h1>
        <p className="text-gray-600">
          Créez et gérez vos contenus pédagogiques personnalisés
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed"
          onClick={handleCreateQuiz}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BrainCircuit className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Créer un quiz</h3>
              <p className="text-sm text-gray-600">
                Concevez des quiz personnalisés pour vos étudiants
              </p>
            </div>
            <Plus className="h-6 w-6 ml-auto text-gray-400" />
          </div>
        </Card>

        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed"
          onClick={handleCreateFlashcard}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Créer des cartes</h3>
              <p className="text-sm text-gray-600">
                Développez des decks de flashcards pour la mémorisation
              </p>
            </div>
            <Plus className="h-6 w-6 ml-auto text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="content">Mes contenus</TabsTrigger>
          <TabsTrigger value="students">Étudiants</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BrainCircuit className="h-8 w-8 text-blue-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">{stats.totalQuizzes}</h3>
              <p className="text-sm text-gray-600">Quiz créés</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 text-green-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">{stats.totalFlashcards}</h3>
              <p className="text-sm text-gray-600">Decks de cartes</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-purple-500" />
                <Badge variant="secondary">+12%</Badge>
              </div>
              <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
              <p className="text-sm text-gray-600">Étudiants actifs</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-8 w-8 text-yellow-500" />
                <Badge variant="secondary">{stats.avgQuizScore}%</Badge>
              </div>
              <h3 className="text-2xl font-bold">Score moyen</h3>
              <p className="text-sm text-gray-600">Sur tous les quiz</p>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <BrainCircuit className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Quiz "Équations du second degré"</p>
                    <p className="text-sm text-gray-600">15 tentatives aujourd'hui</p>
                  </div>
                </div>
                <Badge variant="secondary">78% réussite</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded">
                    <BookOpen className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Deck "Vocabulaire anglais"</p>
                    <p className="text-sm text-gray-600">243 cartes révisées</p>
                  </div>
                </div>
                <Badge variant="secondary">92% maîtrisé</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans vos contenus..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : filteredContent.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? "Aucun contenu trouvé pour cette recherche"
                    : "Vous n'avez pas encore créé de contenu"
                  }
                </p>
                {!searchQuery && (
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleCreateQuiz}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un quiz
                    </Button>
                    <Button variant="outline" onClick={handleCreateFlashcard}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer des cartes
                    </Button>
                  </div>
                )}
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'quiz' ? (
                          <BrainCircuit className="h-5 w-5 text-blue-500" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-green-500" />
                        )}
                        <Badge variant={item.is_public ? 'default' : 'secondary'}>
                          {item.is_public ? 'Public' : 'Privé'}
                        </Badge>
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>

                    <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      {item.type === 'quiz' ? (
                        <>
                          <p>{item.questions_count} questions</p>
                          <p>{item.attempts_count || 0} tentatives</p>
                          {item.average_score && (
                            <p>Score moyen: {Math.round(item.average_score * 100)}%</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>{item.cards_count} cartes</p>
                          <p className="text-xs mt-1">
                            Créé le {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          item.type === 'quiz' 
                            ? handleEditQuiz(item.id)
                            : handleEditFlashcard(item.id)
                        }
                        className="flex-1"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContent(item)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'quiz' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {item.type === 'quiz' ? (
                            <BrainCircuit className="h-5 w-5 text-blue-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {item.type === 'quiz' ? (
                              <>
                                <span>{item.questions_count} questions</span>
                                <span>{item.attempts_count || 0} tentatives</span>
                                {item.difficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.difficulty}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <>
                                <span>{item.cards_count} cartes</span>
                                <span>Mis à jour le {new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.is_public ? 'default' : 'secondary'}>
                          {item.is_public ? 'Public' : 'Privé'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            item.type === 'quiz' 
                              ? handleEditQuiz(item.id)
                              : handleEditFlashcard(item.id)
                          }
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContent(item)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <GroupsTab />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <StudentProgress />
        </TabsContent>
      </Tabs>
    </div>
  );
}