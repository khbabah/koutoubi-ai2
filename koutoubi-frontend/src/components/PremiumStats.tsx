'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, BookOpen, Brain, Clock, Target,
  Calendar, Award, BarChart3, Activity, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';

interface StudyStats {
  totalStudyTime: number;
  studyStreak: number;
  averageSessionTime: number;
  favoriteSubject: string;
  weeklyProgress: number[];
  monthlyGoal: {
    target: number;
    current: number;
  };
  performanceBySubject: {
    subject: string;
    score: number;
    time: number;
  }[];
}

export default function PremiumStats() {
  const { isPremium } = useSubscription();
  const [stats] = useState<StudyStats>({
    totalStudyTime: 1250,
    studyStreak: 7,
    averageSessionTime: 35,
    favoriteSubject: 'Mathématiques',
    weeklyProgress: [45, 60, 30, 80, 55, 90, 70],
    monthlyGoal: {
      target: 2000,
      current: 1250
    },
    performanceBySubject: [
      { subject: 'Mathématiques', score: 85, time: 450 },
      { subject: 'Français', score: 78, time: 320 },
      { subject: 'Sciences', score: 92, time: 280 },
      { subject: 'Histoire', score: 73, time: 200 }
    ]
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isPremium) {
    return (
      <Card className="p-8 text-center">
        <Zap className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Statistiques Premium</h3>
        <p className="text-gray-600 mb-4">
          Débloquez des analyses détaillées de votre progression avec un abonnement Premium
        </p>
        <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
          Réservé aux membres Premium
        </Badge>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">Total</Badge>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatTime(stats.totalStudyTime)}
            </p>
            <p className="text-sm text-blue-700">Temps d'étude total</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-3">
              <Activity className="h-8 w-8 text-green-600" />
              <Badge variant="secondary">🔥 {stats.studyStreak}</Badge>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.studyStreak} jours
            </p>
            <p className="text-sm text-green-700">Série d'étude</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between mb-3">
              <Brain className="h-8 w-8 text-purple-600" />
              <Badge variant="secondary">Moy.</Badge>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {stats.averageSessionTime} min
            </p>
            <p className="text-sm text-purple-700">Par session</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between mb-3">
              <Award className="h-8 w-8 text-orange-600" />
              <Badge variant="secondary">Top</Badge>
            </div>
            <p className="text-lg font-bold text-orange-900">
              {stats.favoriteSubject}
            </p>
            <p className="text-sm text-orange-700">Matière favorite</p>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Goal */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Objectif mensuel</h3>
          </div>
          <Badge variant="outline">
            {Math.round((stats.monthlyGoal.current / stats.monthlyGoal.target) * 100)}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium">
              {formatTime(stats.monthlyGoal.current)} / {formatTime(stats.monthlyGoal.target)}
            </span>
          </div>
          <Progress 
            value={(stats.monthlyGoal.current / stats.monthlyGoal.target) * 100}
            className="h-3"
          />
          <p className="text-sm text-gray-600">
            Encore {formatTime(stats.monthlyGoal.target - stats.monthlyGoal.current)} pour atteindre votre objectif !
          </p>
        </div>
      </Card>

      {/* Weekly Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Activité hebdomadaire</h3>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-32">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
            <div key={day} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ 
                  height: `${(stats.weeklyProgress[index] / 100) * 100}%`,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-gray-600 mt-2">{day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance by Subject */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">Performance par matière</h3>
        </div>
        
        <div className="space-y-4">
          {stats.performanceBySubject.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{subject.subject}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">{formatTime(subject.time)}</span>
                  <span className={`font-bold ${getProgressColor(subject.score)}`}>
                    {subject.score}%
                  </span>
                </div>
              </div>
              <Progress value={subject.score} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold">Insights personnalisés</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
            <p className="text-sm text-gray-700">
              Votre temps d'étude a augmenté de <strong>23%</strong> cette semaine !
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <p className="text-sm text-gray-700">
              Vos meilleures performances sont en <strong>Sciences</strong> avec une moyenne de 92%
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
            <p className="text-sm text-gray-700">
              Conseil : Consacrez plus de temps à l'<strong>Histoire</strong> pour améliorer vos résultats
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}