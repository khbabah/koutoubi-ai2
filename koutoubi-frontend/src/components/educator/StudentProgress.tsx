'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Brain, BookOpen, Clock, Award,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface StudentStat {
  student_id: string;
  student_name: string;
  student_email: string;
  quizzes_completed: number;
  average_quiz_score: number;
  flashcards_reviewed: number;
  flashcards_mastered: number;
  last_activity?: string;
  total_study_time?: number;
}

export default function StudentProgress() {
  const [students, setStudents] = useState<StudentStat[]>([
    // Données de démonstration
    {
      student_id: '1',
      student_name: 'Marie Dupont',
      student_email: 'marie.dupont@example.com',
      quizzes_completed: 8,
      average_quiz_score: 0.85,
      flashcards_reviewed: 120,
      flashcards_mastered: 95,
      last_activity: '2024-01-20T10:30:00',
      total_study_time: 450
    },
    {
      student_id: '2',
      student_name: 'Jean Martin',
      student_email: 'jean.martin@example.com',
      quizzes_completed: 5,
      average_quiz_score: 0.72,
      flashcards_reviewed: 80,
      flashcards_mastered: 52,
      last_activity: '2024-01-19T15:45:00',
      total_study_time: 320
    }
  ]);

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (score >= 0.7) return { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    return { color: 'bg-red-100 text-red-800', icon: XCircle };
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getLastActivityText = (date?: string) => {
    if (!date) return 'Jamais';
    const lastDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return lastDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Progression des étudiants</h3>
        <p className="text-sm text-gray-600">
          Suivez les performances et l'activité de vos étudiants
        </p>
      </div>

      <div className="grid gap-4">
        {students.map((student) => {
          const scoreInfo = getScoreBadge(student.average_quiz_score);
          const ScoreIcon = scoreInfo.icon;
          const masteryRate = student.flashcards_reviewed > 0 
            ? (student.flashcards_mastered / student.flashcards_reviewed) * 100 
            : 0;

          return (
            <Card key={student.student_id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{student.student_name}</h4>
                  <p className="text-sm text-gray-600">{student.student_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Dernière activité</p>
                  <p className="text-sm font-medium">
                    {getLastActivityText(student.last_activity)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{student.quizzes_completed}</p>
                  <p className="text-xs text-gray-600">Quiz complétés</p>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <ScoreIcon className={`h-8 w-8 ${
                      student.average_quiz_score >= 0.9 ? 'text-green-600' :
                      student.average_quiz_score >= 0.7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.round(student.average_quiz_score * 100)}%
                  </p>
                  <p className="text-xs text-gray-600">Score moyen</p>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{student.flashcards_reviewed}</p>
                  <p className="text-xs text-gray-600">Flashcards reviewed</p>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-lg font-bold">
                    {student.total_study_time ? formatStudyTime(student.total_study_time) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">Temps d'étude</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Maîtrise des cartes</span>
                  <span className="text-sm text-gray-600">
                    {student.flashcards_mastered}/{student.flashcards_reviewed} maîtrisées
                  </span>
                </div>
                <Progress value={masteryRate} className="h-2" />
              </div>
            </Card>
          );
        })}
      </div>

      {students.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            Aucun étudiant dans vos groupes pour le moment
          </p>
        </Card>
      )}
    </div>
  );
}