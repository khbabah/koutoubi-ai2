'use client';

import { useState } from 'react';
import { useAuthenticatedSWR, useApiMutation } from '@/hooks/useApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  BrainCircuit, 
  FileText,
  Trash2,
  Eye,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [search, setSearch] = useState('');
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string; title: string } | null>(null);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  // Build the query string for content
  const queryParams = new URLSearchParams();
  queryParams.append('skip', String(page * limit));
  queryParams.append('limit', String(limit));
  if (search) queryParams.append('search', search);

  // Fetch content stats
  const { data: contentStats, mutate: mutateStats } = useAuthenticatedSWR<any>(
    '/admin/content/stats',
    {
      revalidateOnFocus: false,
    }
  );

  // Fetch content based on active tab
  const contentEndpoint = activeTab === 'quizzes' ? '/admin/content/quizzes' :
                         activeTab === 'flashcards' ? '/admin/content/flashcards' :
                         '/admin/content/summaries';

  const { data: contentData, error: contentError, isLoading, mutate: mutateContent } = useAuthenticatedSWR<any>(
    `${contentEndpoint}?${queryParams.toString()}`,
    {
      revalidateOnFocus: false,
    }
  );

  // Extract content from response
  const quizzes = activeTab === 'quizzes' ? (contentData?.quizzes || []) : [];
  const flashcards = activeTab === 'flashcards' ? (contentData?.flashcards || []) : [];
  const summaries = activeTab === 'summaries' ? (contentData?.summaries || []) : [];

  // API mutations
  const { delete: deleteApi } = useApiMutation();

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const endpoint = deletingItem.type === 'quiz' ? `/admin/content/quizzes/${deletingItem.id}` :
                      deletingItem.type === 'flashcard' ? `/admin/content/flashcards/${deletingItem.id}` :
                      `/admin/content/summaries/${deletingItem.id}`;
      
      await deleteApi(endpoint);
      toast.success('Contenu supprimé avec succès');
      setDeletingItem(null);
      mutateContent();
      mutateStats();
    } catch (error) {
      // Error handled by useApiMutation
    }
  };

  const handleExportCSV = async (contentType: 'quiz' | 'flashcard' | 'summary') => {
    try {
      // Use the API directly for file download
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/reports/export/content?type=${contentType}`, {
        headers: {
          Authorization: `Bearer ${(await import('next-auth/react')).getSession()?.then(s => s?.access_token)}`,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contentType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  if (contentError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement du contenu
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    mutateContent();
    mutateStats();
    toast.success('Données rafraîchies');
  };

  return (
    <div className="space-y-6">
      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total_content?.quizzes || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{contentStats?.recent_content?.quizzes || 0} récents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total_content?.flashcards || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{contentStats?.recent_content?.flashcards || 0} récentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résumés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total_content?.summaries || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{contentStats?.recent_content?.summaries || 0} récents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion du contenu</CardTitle>
              <CardDescription>Gérer tout le contenu éducatif de la plateforme</CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Rafraîchir les données"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quizzes">Quiz</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="summaries">Résumés</TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="my-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleExportCSV(activeTab === 'quizzes' ? 'quiz' : activeTab === 'flashcards' ? 'flashcard' : 'summary')}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="quizzes">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Chapitre</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((quiz) => (
                        <TableRow key={quiz.id || quiz._id}>
                          <TableCell className="font-medium">{quiz.title}</TableCell>
                          <TableCell>{quiz.chapter?.title || 'N/A'}</TableCell>
                          <TableCell>{quiz.created_by?.username || 'Système'}</TableCell>
                          <TableCell>
                            {new Date(quiz.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingItem({ 
                                type: 'quiz', 
                                id: quiz.id, 
                                title: quiz.title 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="flashcards">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recto</TableHead>
                        <TableHead>Verso</TableHead>
                        <TableHead>Chapitre</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flashcards.map((card) => (
                        <TableRow key={card.id || card._id}>
                          <TableCell className="max-w-xs truncate">{card.front}</TableCell>
                          <TableCell className="max-w-xs truncate">{card.back}</TableCell>
                          <TableCell>{card.chapter?.title || 'N/A'}</TableCell>
                          <TableCell>{card.created_by?.username || 'Système'}</TableCell>
                          <TableCell>
                            {new Date(card.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingItem({ 
                                type: 'flashcard', 
                                id: card.id, 
                                title: card.front 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="summaries">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chapitre</TableHead>
                        <TableHead>Points clés</TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaries.map((summary) => (
                        <TableRow key={summary.id || summary._id}>
                          <TableCell>{summary.chapter?.title || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {summary.key_points?.split(',').length || 0} points
                            </Badge>
                          </TableCell>
                          <TableCell>{summary.user?.username || 'Système'}</TableCell>
                          <TableCell>
                            {new Date(summary.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingItem({ 
                                type: 'summary', 
                                id: summary.id, 
                                title: summary.chapter?.title || 'Résumé' 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">Page {page + 1}</span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={
                      (activeTab === 'quizzes' && quizzes.length < limit) ||
                      (activeTab === 'flashcards' && flashcards.length < limit) ||
                      (activeTab === 'summaries' && summaries.length < limit)
                    }
                  >
                    Suivant
                  </Button>
                </div>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Creators */}
      {contentStats?.top_creators && contentStats.top_creators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créateurs les plus actifs</CardTitle>
            <CardDescription>Utilisateurs ayant créé le plus de contenu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentStats.top_creators.map((creator: any, index: number) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <p className="font-medium">{creator.username || creator.email}</p>
                      <p className="text-sm text-gray-500">{creator.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{creator.content_count} contenus</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le contenu "{deletingItem?.title}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}