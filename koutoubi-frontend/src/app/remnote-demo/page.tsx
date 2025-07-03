'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ourDemoPage() {
  const router = useRouter();
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [expandedSections, setExpandedSections] = useState<number[]>([1, 2]);

  const chapters = [
    {
      id: 1,
      title: 'Le Bachagha Si Khelladi Ben Miloud',
      flashcards: 15,
      quiz: 10,
      progress: 53,
      lastStudied: '2 heures',
      starred: true
    },
    {
      id: 2,
      title: 'La colonisation française en Afrique',
      flashcards: 20,
      quiz: 12,
      progress: 100,
      lastStudied: 'Hier',
      starred: false
    },
    {
      id: 3,
      title: 'Les mouvements de résistance',
      flashcards: 18,
      quiz: 8,
      progress: 28,
      lastStudied: '3 jours',
      starred: true
    }
  ];

  const toggleSection = (id: number) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen flex bg-[#fbfbfc] text-[#2d3142] font-sans">
      {/* Left Sidebar - our style */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-[280px] bg-white border-r border-[#e9ecef] flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#e9ecef]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-lg">Koutoubi AI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-[#e9ecef]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#f8f9fa] text-sm group">
                <Home className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                <span>Accueil</span>
              </button>
              
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#f8f9fa] text-sm group">
                <Calendar className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                <span>Daily Notes</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                <span>Mes Cours</span>
              </button>

              <div className="pt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  Chapitres
                </div>
                
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="mb-1">
                    <button
                      onClick={() => {
                        setSelectedChapter(chapter.id);
                        toggleSection(chapter.id);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm hover:bg-[#f8f9fa] group ${
                        selectedChapter === chapter.id ? 'bg-[#f8f9fa]' : ''
                      }`}
                    >
                      <ChevronRight 
                        className={`h-3 w-3 text-gray-400 transition-transform ${
                          expandedSections.includes(chapter.id) ? 'rotate-90' : ''
                        }`}
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className={selectedChapter === chapter.id ? 'font-medium' : ''}>
                            Chapitre {chapter.id}
                          </span>
                          {chapter.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        </div>
                        <div className="text-xs text-gray-500">{chapter.title.substring(0, 30)}...</div>
                      </div>
                      <div className="text-xs text-gray-400">{chapter.progress}%</div>
                    </button>
                    
                    {expandedSections.includes(chapter.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        <button className="w-full flex items-center space-x-2 px-3 py-1.5 rounded text-xs hover:bg-[#f8f9fa] text-gray-600">
                          <FileText className="h-3 w-3" />
                          <span>Flashcards ({chapter.flashcards})</span>
                        </button>
                        <button className="w-full flex items-center space-x-2 px-3 py-1.5 rounded text-xs hover:bg-[#f8f9fa] text-gray-600">
                          <HelpCircle className="h-3 w-3" />
                          <span>Quiz ({chapter.quiz})</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 mt-3 border-t border-[#e9ecef]">
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#f8f9fa] text-sm group">
                  <Archive className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                  <span>Archive</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#f8f9fa] text-sm group">
                  <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                  <span>Corbeille</span>
                </button>
              </div>
            </nav>

            {/* Bottom User Section */}
            <div className="p-3 border-t border-[#e9ecef]">
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#f8f9fa] group">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Demo User</div>
                  <div className="text-xs text-gray-500">Free Plan</div>
                </div>
                <Settings className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#e9ecef] flex items-center px-6">
          <div className="flex items-center space-x-4 flex-1">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            )}
            
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">Mes Cours</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {chapters.find(c => c.id === selectedChapter)?.title}
              </span>
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
        <div className="flex-1 flex">
          {/* Document Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {/* Title */}
              <h1 className="text-3xl font-bold mb-6">
                {chapters.find(c => c.id === selectedChapter)?.title}
              </h1>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Understand and Remember This Chapter
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start">
                    <span className="font-semibold mr-2">1. Learn:</span>
                    <span>Read the content and add flashcards by clicking on sentences that you want to remember.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold mr-2">2. Practice:</span>
                    <span>After reading, practice the flashcards to solidify your memory.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold mr-2">3. Quiz:</span>
                    <span>Check your understanding with a multiple-choice quiz.</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <h2>Introduction</h2>
                <p className="text-gray-700 leading-relaxed hover:bg-yellow-50 cursor-pointer p-2 -m-2 rounded transition-colors">
                  Le Bachagha Si Khelladi Ben Miloud était un chef indigène renommé du sud-ouest algérien sous l'occupation française, célèbre pour son rôle de bachagha de la tribu des Amours et pour le service de son père à l'administration coloniale.
                </p>
                
                <p className="text-gray-700 leading-relaxed hover:bg-yellow-50 cursor-pointer p-2 -m-2 rounded transition-colors">
                  Malgré son rôle au service de l'administration coloniale, il possédait une forte personnalité et une grande influence, exprimant ses opinions avec audace, ce qui n'était pas toujours bien accueilli par les colons.
                </p>

                <h2>Points Clés</h2>
                <ul className="space-y-2">
                  <li className="hover:bg-yellow-50 cursor-pointer p-2 -m-2 rounded transition-colors">
                    Chef de la tribu des Amours dans le sud-ouest algérien
                  </li>
                  <li className="hover:bg-yellow-50 cursor-pointer p-2 -m-2 rounded transition-colors">
                    Service remarquable à l'administration coloniale française
                  </li>
                  <li className="hover:bg-yellow-50 cursor-pointer p-2 -m-2 rounded transition-colors">
                    Personnalité forte et influente malgré les critiques
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[360px] bg-white border-l border-[#e9ecef] p-6">
            {!showQuizModal ? (
              <div className="space-y-6">
                {/* Progress Card */}
                <div className="bg-[#f8f9fa] rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Votre Progression</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-medium">{chapters.find(c => c.id === selectedChapter)?.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${chapters.find(c => c.id === selectedChapter)?.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dernière étude</span>
                      <span>{chapters.find(c => c.id === selectedChapter)?.lastStudied}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold mb-3">Actions Rapides</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Brain className="h-5 w-5" />
                        <span className="font-medium">Mode Learn</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Flashcards</span>
                      </div>
                      <span className="text-sm text-gray-500">{chapters.find(c => c.id === selectedChapter)?.flashcards}</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowQuizModal(true)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Generate Quiz</span>
                      </div>
                      <span className="text-sm text-gray-500">{chapters.find(c => c.id === selectedChapter)?.quiz} Q</span>
                    </button>
                  </div>
                </div>

                {/* Add Note */}
                <div>
                  <button className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 text-gray-600 hover:text-gray-700 transition-colors">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add Note</span>
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex items-center justify-center"
              >
                <div className="w-full">
                  <div className="bg-[#e3f2fd] rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Generate a Quiz
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Generate a multiple-choice quiz from this source.
                    </p>
                    <button 
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <span>Generate Quiz</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowQuizModal(false)}
                      className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}