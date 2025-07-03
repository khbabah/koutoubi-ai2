'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Send, 
  Loader2, 
  BookOpen, 
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Sparkles,
  User,
  Bot,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: number;
  chapterTitle?: string;
  pdfContext?: string;
}

export default function AITutorModal({ 
  isOpen, 
  onClose, 
  currentPage = 1,
  chapterTitle = 'Chapitre actuel',
  pdfContext = ''
}: AITutorModalProps) {
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre tuteur AI. Je peux vous aider à comprendre le contenu, répondre à vos questions, et vous expliquer les concepts difficiles. Comment puis-je vous aider ?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Quick action prompts
  const quickActions = [
    { icon: BookOpen, label: 'Résumer cette page', prompt: 'Peux-tu résumer le contenu de cette page ?' },
    { icon: HelpCircle, label: 'Expliquer concept', prompt: 'Peux-tu expliquer le concept principal de cette section ?' },
    { icon: Lightbulb, label: 'Donner exemples', prompt: 'Peux-tu me donner des exemples pratiques ?' },
    { icon: MessageCircle, label: 'Quiz rapide', prompt: 'Pose-moi une question pour vérifier ma compréhension.' }
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/explain', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: pdfContext || `Page ${currentPage} du ${chapterTitle}`,
          action: 'explain',
          question: messageText,
          context: `Chapitre: ${chapterTitle}, Page: ${currentPage}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Erreur de réponse');
      }
    } catch (error) {
      toast.error('Erreur de connexion avec le tuteur AI');
      
      // Fallback response
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Modal */}
      <div className={`${isMobile ? 'hidden' : 'fixed'} inset-0 bg-black/50 z-50 flex items-center justify-center p-4`}>
        <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Tutor</h2>
              <p className="text-sm text-gray-600">{chapterTitle} - Page {currentPage}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop Quick Actions */}
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Actions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Desktop Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 min-h-[60px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button 
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Propulsé par l'IA - Les réponses peuvent contenir des erreurs
          </p>
        </div>
        </div>
      </div>
      
      {/* Mobile Bottom Sheet */}
      <div className={`${!isMobile ? 'hidden' : 'fixed'} inset-0 z-50 flex items-end`}>
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl w-full h-[85vh] flex flex-col animate-slide-up">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold">AI Tutor</h2>
                <p className="text-xs text-gray-600">{chapterTitle?.slice(0, 30)}... - P{currentPage}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Quick Actions - Horizontal Scroll */}
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Actions rapides :</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Messages */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-0.5 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 min-h-[50px] max-h-[100px] text-sm resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Propulsé par l'IA
            </p>
          </div>
        </div>
      </div>
    </>
  );
}