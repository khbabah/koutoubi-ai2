'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Save, RotateCcw, Grid, List, 
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { educatorApi } from '@/lib/api';

interface Flashcard {
  id?: string;
  front_text: string;
  back_text: string;
  difficulty?: number;
}

interface FlashcardEditorProps {
  deckId?: string;
  chapterId?: string;
  courseId?: string;
  onSave?: (deck: any) => void;
  onCancel?: () => void;
}

export default function FlashcardEditor({
  deckId,
  chapterId,
  courseId,
  onSave,
  onCancel
}: FlashcardEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    if (deckId) {
      loadDeck();
    } else {
      // Start with one default card
      setCards([{
        front_text: '',
        back_text: '',
        difficulty: 1
      }]);
    }
  }, [deckId]);

  const loadDeck = async () => {
    try {
      const response = await educatorApi.getFlashcardDeck(deckId!);
      const deck = response.data;
      
      setTitle(deck.title);
      setDescription(deck.description || '');
      setCards(deck.cards);
    } catch (error) {
      toast.error('Erreur lors du chargement du deck');
    }
  };

  const addCard = () => {
    const newCard: Flashcard = {
      front_text: '',
      back_text: '',
      difficulty: 1
    };
    setCards([...cards, newCard]);
    setActiveCard(cards.length);
  };

  const updateCard = (index: number, updates: Partial<Flashcard>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    setCards(newCards);
  };

  const removeCard = (index: number) => {
    if (cards.length === 1) {
      toast.error('The deck must contain at least one flashcard');
      return;
    }
    
    setCards(cards.filter((_, i) => i !== index));
    if (activeCard >= cards.length - 1) {
      setActiveCard(Math.max(0, activeCard - 1));
    }
  };

  const flipCard = (index: number) => {
    const card = cards[index];
    updateCard(index, {
      front_text: card.back_text,
      back_text: card.front_text
    });
  };

  const duplicateCard = (index: number) => {
    const cardToDuplicate = { ...cards[index] };
    delete cardToDuplicate.id;
    const newCards = [...cards];
    newCards.splice(index + 1, 0, cardToDuplicate);
    setCards(newCards);
    setActiveCard(index + 1);
  };

  const validateDeck = () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return false;
    }

    if (cards.length === 0) {
      toast.error('Add at least one flashcard');
      return false;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.front_text.trim()) {
        toast.error(`Flashcard ${i + 1}: Front is required`);
        setActiveCard(i);
        return false;
      }
      if (!card.back_text.trim()) {
        toast.error(`Flashcard ${i + 1}: Back is required`);
        setActiveCard(i);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateDeck()) return;

    setLoading(true);
    try {
      const deckData = {
        title: title.trim(),
        description: description.trim(),
        chapter_id: chapterId,
        course_id: courseId,
        is_public: false,
        tags: [],
        cards: cards.map(card => ({
          ...card,
          front_text: card.front_text.trim(),
          back_text: card.back_text.trim(),
          front_media_url: '',
          back_media_url: '',
          tags: []
        }))
      };

      let response;
      if (deckId) {
        response = await educatorApi.updateFlashcardDeck(deckId, deckData);
      } else {
        response = await educatorApi.createFlashcardDeck(deckData);
      }

      toast.success(deckId ? 'Deck mis à jour' : 'Deck créé avec succès');
      
      if (onSave) {
        onSave(response.data);
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const navigateCard = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeCard > 0) {
      setActiveCard(activeCard - 1);
    } else if (direction === 'next' && activeCard < cards.length - 1) {
      setActiveCard(activeCard + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {deckId ? 'Modifier le deck' : 'Create flashcard deck'}
        </h2>
        <p className="text-gray-600 text-sm">
          Create simple and effective flashcards
        </p>
      </div>

      {/* Deck Info */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Titre du deck <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vocabulaire anglais - Chapitre 1"
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
              placeholder="Décrivez brièvement le contenu du deck..."
              rows={2}
              className="max-w-lg"
            />
          </div>
        </div>
      </Card>

      {/* View Mode Toggle & Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">
            {cards.length} carte{cards.length > 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            <span className="ml-2">{viewMode === 'list' ? 'Grille' : 'Liste'}</span>
          </Button>
        </div>
        <Button onClick={addCard} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add flashcard
        </Button>
      </div>

      {/* Cards Display */}
      {viewMode === 'list' ? (
        <>
          {/* Navigation for List View */}
          {cards.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCard('prev')}
                disabled={activeCard === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-1">
                {cards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCard(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeCard ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCard('next')}
                disabled={activeCard === cards.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Active Card Editor */}
          {cards.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg">
                  Carte {activeCard + 1} sur {cards.length}
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => flipCard(activeCard)}
                    title="Inverser recto/verso"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateCard(activeCard)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCard(activeCard)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Recto (Question) <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={cards[activeCard].front_text}
                    onChange={(e) => updateCard(activeCard, { front_text: e.target.value })}
                    placeholder="Écrivez la question ou le terme à mémoriser..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Verso (Réponse) <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={cards[activeCard].back_text}
                    onChange={(e) => updateCard(activeCard, { back_text: e.target.value })}
                    placeholder="Écrivez la réponse ou la définition..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Difficulté
                  </label>
                  <div className="flex items-center gap-4">
                    {[
                      { value: 1, label: 'Facile', color: 'bg-green-500' },
                      { value: 2, label: 'Moyen', color: 'bg-yellow-500' },
                      { value: 3, label: 'Difficile', color: 'bg-red-500' }
                    ].map(level => (
                      <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`difficulty-${activeCard}`}
                          checked={cards[activeCard].difficulty === level.value}
                          onChange={() => updateCard(activeCard, { difficulty: level.value })}
                        />
                        <span className="text-sm">{level.label}</span>
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Grid View */
        <div className="grid md:grid-cols-2 gap-4">
          {cards.map((card, index) => (
            <Card 
              key={index} 
              className={`p-4 cursor-pointer transition-all ${
                activeCard === index ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveCard(index)}
            >
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="text-xs">
                  Carte {index + 1}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      flipCard(index);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(index);
                    }}
                    className="h-7 w-7 p-0 text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Recto:</p>
                  <p className="text-sm line-clamp-2">
                    {card.front_text || <span className="text-gray-400">Vide</span>}
                  </p>
                </div>
                <hr />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Verso:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {card.back_text || <span className="text-gray-400">Vide</span>}
                  </p>
                </div>
              </div>
              
              {/* Difficulty indicator */}
              <div className="mt-3 flex justify-end">
                <div className={`w-2 h-2 rounded-full ${
                  card.difficulty === 1 ? 'bg-green-500' : 
                  card.difficulty === 2 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
              </div>
            </Card>
          ))}
          
          {/* Add card button in grid */}
          <Card 
            className="p-4 border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 min-h-[150px]"
            onClick={addCard}
          >
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Add flashcard</p>
            </div>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          {cards.filter(c => c.front_text.trim() && c.back_text.trim()).length} carte{cards.filter(c => c.front_text.trim() && c.back_text.trim()).length > 1 ? 's' : ''} complète{cards.filter(c => c.front_text.trim() && c.back_text.trim()).length > 1 ? 's' : ''}
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || cards.length === 0}
          >
            {loading ? (
              <>Enregistrement...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {deckId ? 'Mettre à jour' : 'Créer le deck'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}