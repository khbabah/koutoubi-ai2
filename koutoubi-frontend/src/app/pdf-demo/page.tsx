"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Brain, 
  MessageSquare, 
  ListChecks, 
  CreditCard,
  Network,
  Search,
  RefreshCw,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PDFSummary from '@/components/PDFSummary';
import { pdfApi, pdfSummaryApi, explainApi } from '@/lib/api';

export default function PDFDemoPage() {
  const [loading, setLoading] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageContent, setPageContent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPdfInfo();
  }, []);

  const loadPdfInfo = async () => {
    try {
      const response = await pdfApi.getInfo();
      setPdfInfo(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du PDF');
    }
  };

  const loadPage = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await pdfApi.getPage(pageNum);
      setPageContent(response.data);
      setCurrentPage(pageNum);
    } catch (error) {
      toast.error('Erreur lors du chargement de la page');
    } finally {
      setLoading(false);
    }
  };

  const searchPdf = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await pdfApi.search(searchQuery);
      setSearchResults(response.data.results);
      toast.success(`${response.data.total_results} résultats trouvés`);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const response = await pdfApi.ask({
        question,
        page_number: currentPage,
        context_pages: 1
      });
      setAnswer(response.data.answer);
    } catch (error) {
      toast.error('Erreur lors de la génération de la réponse');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await pdfApi.generateQuiz(currentPage, 5, 'medium');
      setQuiz(response.data);
      setSelectedAnswers({});
    } catch (error) {
      toast.error('Erreur lors de la génération du quiz');
    } finally {
      setLoading(false);
    }
  };

  const checkQuizAnswers = () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach((q: any) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });
    
    toast.success(`Score: ${correct}/${quiz.questions.length}`);
  };

  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Contenu copié!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Koutoubi AI - Démonstration PDF</h1>
        <p className="text-gray-600">
          Explorez toutes les fonctionnalités AI avec le manuel scolaire MS2 2023
        </p>
      </div>

      {/* PDF Info */}
      {pdfInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Information du Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Fichier</Label>
                <p className="font-medium">{pdfInfo.filename}</p>
              </div>
              <div>
                <Label>Pages</Label>
                <p className="font-medium">{pdfInfo.total_pages}</p>
              </div>
              <div>
                <Label>Taille</Label>
                <p className="font-medium">{pdfInfo.file_size_mb?.toFixed(1)} MB</p>
              </div>
              <div>
                <Label>Page actuelle</Label>
                <Select value={currentPage.toString()} onValueChange={(v) => loadPage(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(20, pdfInfo.total_pages) }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Page {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="summary">Résumés</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="mindmap">Mindmap</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenu de la Page {currentPage}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin mr-2" />
                  <span>Chargement...</span>
                </div>
              ) : pageContent ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{pageContent.word_count} mots</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyContent(pageContent.content)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{pageContent.content}</p>
                  </div>
                </div>
              ) : (
                <Button onClick={() => loadPage(currentPage)}>
                  Charger la page
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Recherche dans le document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPdf()}
                />
                <Button onClick={searchPdf} disabled={loading}>
                  Rechercher
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">Page {result.page}</span>
                        <span className="text-sm text-gray-500">Score: {result.score}</span>
                      </div>
                      <p className="text-sm">{result.context}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <PDFSummary pageNumbers={[1, 2, 3, 4, 5]} />
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Questions & Réponses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Votre question</Label>
                <Textarea
                  placeholder="Posez une question sur le contenu..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button onClick={askQuestion} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" />}
                Obtenir une réponse
              </Button>
              
              {answer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Réponse:</h4>
                  <p className="whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Quiz Interactif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={generateQuiz} disabled={loading} className="mb-4">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                Générer un nouveau quiz
              </Button>
              
              {quiz && (
                <div className="space-y-4">
                  {quiz.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">{idx + 1}. {q.question}</h4>
                      <div className="space-y-2">
                        {q.choices.map((choice: string, choiceIdx: number) => (
                          <label key={choiceIdx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={choiceIdx}
                              onChange={() => setSelectedAnswers({
                                ...selectedAnswers,
                                [q.id]: choiceIdx
                              })}
                            />
                            <span>{choice}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={checkQuizAnswers} variant="outline">
                    Vérifier les réponses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Flashcards (Bientôt disponible)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                La génération de flashcards sera bientôt disponible...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mindmap Tab */}
        <TabsContent value="mindmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Mindmap (Bientôt disponible)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                La génération de mindmaps sera bientôt disponible...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}