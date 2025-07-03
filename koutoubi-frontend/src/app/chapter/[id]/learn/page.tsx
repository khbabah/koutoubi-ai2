'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  HelpCircle, 
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Settings,
  Menu,
  Home,
  Calendar,
  Archive,
  Trash2,
  Star,
  Clock,
  MoreHorizontal,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  pdf_path: string;
  content?: string;
}

export default function ChapterLearnPage() {
  const router = useRouter();
  const params = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);

  useEffect(() => {
    // Mock chapter data
    const mockChapter: Chapter = {
      id: params.id as string,
      chapter_number: 11,
      title: 'Le Bachagha Si Khelladi Ben Miloud',
      pdf_path: '/content/pdf/chapitre11.pdf',
      content: `
# Le Bachagha Si Khelladi Ben Miloud

## Introduction

Le Bachagha Si Khelladi Ben Miloud était un chef indigène renommé du sud-ouest algérien sous l'occupation française. Il était célèbre pour son rôle de bachagha de la tribu des Amours et pour le service de son père à l'administration coloniale.

## Son rôle historique

Malgré son rôle au service de l'administration coloniale, il possédait une forte personnalité et une grande influence. Il exprimait ses opinions avec audace, ce qui n'était pas toujours bien accueilli par les colons.

## Points clés à retenir

1. **Chef de la tribu des Amours** - Il dirigeait l'une des plus importantes tribus du sud-ouest algérien
2. **Service à l'administration coloniale** - Son père et lui ont servi l'administration française
3. **Personnalité forte et influente** - Malgré les critiques, il maintenait son influence et son autorité

## L'héritage

Son histoire illustre la complexité des relations entre les chefs traditionnels et l'administration coloniale. Il représente une figure ambivalente de cette période de l'histoire algérienne.
      `
    };

    setChapter(mockChapter);
    setLoading(false);
  }, [params.id]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      setShowFlashcardModal(true);
    }
  };

  const createFlashcard = () => {
    // Mock flashcard creation
    console.log('Creating flashcard with text:', selectedText);
    setShowFlashcardModal(false);
    setSelectedText('');
  };

  if (loading || !chapter) {
    return (
      <div className="h-screen bg-[#fbfbfc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc] text-[#2d3142]">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-[#e9ecef] flex items-center px-6">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Mes Cours</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Chapitre {chapter.chapter_number}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Learn</span>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Clock className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Star className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold mb-6">
              {chapter.title}
            </h1>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Comment utiliser le mode Learn
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start">
                  <span className="font-semibold mr-2">1.</span>
                  <span>Lisez attentivement le contenu du chapitre</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Sélectionnez les phrases importantes pour créer des flashcards</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Utilisez les outils AI pour obtenir des explications supplémentaires</span>
                </div>
              </div>
            </div>

            {/* Content with selection */}
            <div 
              className="prose prose-lg max-w-none"
              onMouseUp={handleTextSelection}
            >
              {chapter.content?.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{paragraph.replace('# ', '')}</h1>;
                } else if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-semibold mt-4 mb-3">{paragraph.replace('## ', '')}</h2>;
                } else if (paragraph.trim()) {
                  return (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4 hover:bg-yellow-50 cursor-text p-2 -m-2 rounded transition-colors">
                      {paragraph}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[360px] bg-white border-l border-[#e9ecef] p-6">
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-[#f8f9fa] rounded-xl p-4">
              <h3 className="font-semibold mb-3">Votre Progression</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Flashcards créées</span>
                    <span className="font-medium">8/15</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: '53%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-3">Actions Rapides</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/chapter/${chapter.id}/flashcards`)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Réviser Flashcards</span>
                  </div>
                  <span className="text-sm text-gray-500">15</span>
                </button>
                
                <button 
                  onClick={() => router.push(`/chapter/${chapter.id}/quiz`)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Faire un Quiz</span>
                  </div>
                  <span className="text-sm text-gray-500">10 Q</span>
                </button>
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <h3 className="font-semibold mb-3">Outils AI</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity">
                  <Brain className="h-5 w-5" />
                  <span className="font-medium">Générer un résumé</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Plus className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Poser une question</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Creation Modal */}
      <AnimatePresence>
        {showFlashcardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowFlashcardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Créer une flashcard</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">{selectedText}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createFlashcard}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowFlashcardModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}