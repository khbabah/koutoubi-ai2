'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Save, ChevronUp, ChevronDown, 
  AlertCircle, CheckCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { educatorApi } from '@/lib/api';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  choices?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  order?: number;
}

interface QuizEditorProps {
  quizId?: string;
  chapterId?: string;
  courseId?: string;
  onSave?: (quiz: any) => void;
  onCancel?: () => void;
}

export default function QuizEditor({ 
  quizId, 
  chapterId, 
  courseId,
  onSave, 
  onCancel 
}: QuizEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    } else {
      // Start with one default question
      setQuestions([{
        question_text: '',
        question_type: 'multiple_choice',
        choices: ['', ''],
        correct_answer: '0',
        points: 1,
        order: 0
      }]);
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const response = await educatorApi.getQuiz(quizId!);
      const quiz = response.data;
      
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setQuestions(quiz.questions);
    } catch (error) {
      toast.error('Erreur lors du chargement du quiz');
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      choices: ['', ''],
      correct_answer: '0',
      points: 1,
      order: questions.length
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    
    // If changing question type, adjust choices
    if (updates.question_type === 'true_false' && updates.question_type !== newQuestions[index].question_type) {
      newQuestions[index].choices = ['Vrai', 'Faux'];
      newQuestions[index].correct_answer = '0';
    }
    
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('Le quiz doit contenir au moins une question');
      return;
    }
    
    setQuestions(questions.filter((_, i) => i !== index));
    if (activeQuestion >= questions.length - 1) {
      setActiveQuestion(Math.max(0, activeQuestion - 1));
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    newQuestions.forEach((q, i) => q.order = i);
    setQuestions(newQuestions);
    setActiveQuestion(newIndex);
  };

  const addChoice = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question.choices) return;
    
    if (question.choices.length >= 6) {
      toast.error('Maximum 6 choix par question');
      return;
    }
    
    const newChoices = [...question.choices, ''];
    updateQuestion(questionIndex, { choices: newChoices });
  };

  const updateChoice = (questionIndex: number, choiceIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (!question.choices) return;
    
    const newChoices = [...question.choices];
    newChoices[choiceIndex] = value;
    updateQuestion(questionIndex, { choices: newChoices });
  };

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    const question = questions[questionIndex];
    if (!question.choices || question.choices.length <= 2) {
      toast.error('Minimum 2 choix requis');
      return;
    }
    
    const newChoices = question.choices.filter((_, i) => i !== choiceIndex);
    
    // Adjust correct answer if needed
    let newCorrectAnswer = question.correct_answer;
    if (parseInt(question.correct_answer) === choiceIndex) {
      newCorrectAnswer = '0';
    } else if (parseInt(question.correct_answer) > choiceIndex) {
      newCorrectAnswer = String(parseInt(question.correct_answer) - 1);
    }
    
    updateQuestion(questionIndex, { 
      choices: newChoices,
      correct_answer: newCorrectAnswer 
    });
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return false;
    }

    if (questions.length === 0) {
      toast.error('Ajoutez au moins une question');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1}: Le texte est requis`);
        setActiveQuestion(i);
        return false;
      }

      if (q.question_type === 'multiple_choice') {
        // Check for empty choices
        const nonEmptyChoices = q.choices?.filter(c => c.trim()) || [];
        if (nonEmptyChoices.length < 2) {
          toast.error(`Question ${i + 1}: Au moins 2 choix non vides sont requis`);
          setActiveQuestion(i);
          return false;
        }

        // Check for duplicates
        const uniqueChoices = new Set(nonEmptyChoices.map(c => c.toLowerCase().trim()));
        if (uniqueChoices.size !== nonEmptyChoices.length) {
          toast.error(`Question ${i + 1}: Les choix doivent être uniques`);
          setActiveQuestion(i);
          return false;
        }

        // Check if correct answer is valid
        const correctIndex = parseInt(q.correct_answer);
        if (!q.choices?.[correctIndex]?.trim()) {
          toast.error(`Question ${i + 1}: La réponse correcte ne peut pas être vide`);
          setActiveQuestion(i);
          return false;
        }
      }

      if (q.question_type === 'short_answer' && !q.correct_answer.trim()) {
        toast.error(`Question ${i + 1}: La réponse correcte est requise`);
        setActiveQuestion(i);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateQuiz()) return;

    setLoading(true);
    try {
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        chapter_id: chapterId,
        course_id: courseId,
        difficulty: 'medium',
        time_limit: null,
        pass_score: 0.7,
        is_public: false,
        tags: [],
        questions: questions.map((q, i) => ({
          ...q,
          question_text: q.question_text.trim(),
          choices: q.choices?.map(c => c.trim()).filter(c => c),
          correct_answer: q.correct_answer,
          explanation: q.explanation?.trim(),
          order: i
        }))
      };

      let response;
      if (quizId) {
        response = await educatorApi.updateQuiz(quizId, quizData);
      } else {
        response = await educatorApi.createQuiz(quizData);
      }

      toast.success(quizId ? 'Quiz mis à jour' : 'Quiz créé avec succès');
      
      if (onSave) {
        onSave(response.data);
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {quizId ? 'Modifier le quiz' : 'Créer un quiz'}
        </h2>
        <p className="text-gray-600 text-sm">
          Créez des questions simples et claires pour évaluer vos étudiants
        </p>
      </div>

      {/* Quiz Info */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Titre du quiz <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quiz sur les équations"
              className="max-w-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optionnel)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le contenu du quiz..."
              rows={2}
              className="max-w-lg"
            />
          </div>
        </div>
      </Card>

      {/* Questions Navigation */}
      {questions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button onClick={addQuestion} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={activeQuestion === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveQuestion(index)}
                className="min-w-[40px]"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Active Question Editor */}
      {questions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-lg">
              Question {activeQuestion + 1} sur {questions.length}
            </h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveQuestion(activeQuestion, 'up')}
                disabled={activeQuestion === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveQuestion(activeQuestion, 'down')}
                disabled={activeQuestion === questions.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(activeQuestion)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Type de question
              </label>
              <select
                value={questions[activeQuestion].question_type}
                onChange={(e) => updateQuestion(activeQuestion, { 
                  question_type: e.target.value as any 
                })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="multiple_choice">Choix multiple</option>
                <option value="true_false">Vrai/Faux</option>
                <option value="short_answer">Réponse courte</option>
              </select>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Question <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={questions[activeQuestion].question_text}
                onChange={(e) => updateQuestion(activeQuestion, { 
                  question_text: e.target.value 
                })}
                placeholder="Écrivez votre question ici..."
                rows={3}
              />
            </div>

            {/* Multiple Choice Options */}
            {questions[activeQuestion].question_type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Choix de réponses <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {questions[activeQuestion].choices?.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${activeQuestion}`}
                        checked={questions[activeQuestion].correct_answer === String(index)}
                        onChange={() => updateQuestion(activeQuestion, { 
                          correct_answer: String(index) 
                        })}
                        className="flex-shrink-0"
                      />
                      <Input
                        value={choice}
                        onChange={(e) => updateChoice(activeQuestion, index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {questions[activeQuestion].choices!.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChoice(activeQuestion, index)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {questions[activeQuestion].correct_answer === String(index) && choice.trim() && (
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                
                {questions[activeQuestion].choices!.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addChoice(activeQuestion)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un choix
                  </Button>
                )}
                
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-1 text-blue-600" />
                  Sélectionnez la bonne réponse en cliquant sur le bouton radio
                </div>
              </div>
            )}

            {/* True/False Options */}
            {questions[activeQuestion].question_type === 'true_false' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Réponse correcte <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${activeQuestion}`}
                      checked={questions[activeQuestion].correct_answer === '0'}
                      onChange={() => updateQuestion(activeQuestion, { 
                        correct_answer: '0' 
                      })}
                    />
                    <span>Vrai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`tf-${activeQuestion}`}
                      checked={questions[activeQuestion].correct_answer === '1'}
                      onChange={() => updateQuestion(activeQuestion, { 
                        correct_answer: '1' 
                      })}
                    />
                    <span>Faux</span>
                  </label>
                </div>
              </div>
            )}

            {/* Short Answer */}
            {questions[activeQuestion].question_type === 'short_answer' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Réponse correcte <span className="text-red-500">*</span>
                </label>
                <Input
                  value={questions[activeQuestion].correct_answer}
                  onChange={(e) => updateQuestion(activeQuestion, { 
                    correct_answer: e.target.value 
                  })}
                  placeholder="Entrez la réponse attendue..."
                />
                <p className="text-sm text-gray-600 mt-1">
                  La réponse de l'étudiant devra correspondre exactement
                </p>
              </div>
            )}

            {/* Points */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Points
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={questions[activeQuestion].points}
                onChange={(e) => updateQuestion(activeQuestion, { 
                  points: parseInt(e.target.value) || 1 
                })}
                className="w-24"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Explication (optionnel)
              </label>
              <Textarea
                value={questions[activeQuestion].explanation || ''}
                onChange={(e) => updateQuestion(activeQuestion, { 
                  explanation: e.target.value 
                })}
                placeholder="Expliquez pourquoi c'est la bonne réponse..."
                rows={2}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Total: {questions.reduce((sum, q) => sum + q.points, 0)} points
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || questions.length === 0}
          >
            {loading ? (
              <>Enregistrement...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {quizId ? 'Mettre à jour' : 'Créer le quiz'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}