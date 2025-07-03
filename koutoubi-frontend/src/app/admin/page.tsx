'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuthenticatedSWR } from '@/hooks/useApi';
import { 
  Users, 
  Users2, 
  BookOpen, 
  TrendingUp,
  Activity,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // SWR hooks for fetching data
  const { 
    data: dashboardData, 
    error: dashboardError, 
    isLoading: dashboardLoading,
    mutate: mutateDashboard
  } = useAuthenticatedSWR(`/admin/reports/dashboard?period=${period}`);

  const { 
    data: userStats, 
    error: userStatsError, 
    isLoading: userStatsLoading,
    mutate: mutateUserStats
  } = useAuthenticatedSWR('/admin/users/stats');

  const { 
    data: contentStats, 
    error: contentStatsError, 
    isLoading: contentStatsLoading,
    mutate: mutateContentStats
  } = useAuthenticatedSWR('/admin/content/stats');

  const isLoading = dashboardLoading || userStatsLoading || contentStatsLoading;
  const hasError = dashboardError || userStatsError || contentStatsError;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        mutateDashboard(),
        mutateUserStats(),
        mutateContentStats()
      ]);
      toast.success('Données actualisées');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500">Erreur lors du chargement des données</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const roleChartData = userStats?.role_distribution ? 
    Object.entries(userStats.role_distribution).map(([role, count]) => ({
      name: role,
      value: count as number
    })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Tableau de bord administrateur</h2>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.user_metrics?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.user_metrics?.new || 0} nouveaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.user_metrics?.active_in_period || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sur la période sélectionnée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contenu total</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(contentStats?.total_content?.quizzes || 0) + 
               (contentStats?.total_content?.flashcards || 0) + 
               (contentStats?.total_content?.summaries || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Quiz, flashcards, résumés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Groupes actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Croissance des utilisateurs</CardTitle>
            <CardDescription>Nouveaux utilisateurs par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.user_growth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des rôles</CardTitle>
            <CardDescription>Répartition des utilisateurs par rôle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques du contenu</CardTitle>
          <CardDescription>Vue d'ensemble du contenu de la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Quiz</h4>
              <div className="text-2xl font-bold">{contentStats?.total_content?.quizzes || 0}</div>
              <p className="text-sm text-muted-foreground">
                +{contentStats?.recent_content?.quizzes || 0} récents
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Flashcards</h4>
              <div className="text-2xl font-bold">{contentStats?.total_content?.flashcards || 0}</div>
              <p className="text-sm text-muted-foreground">
                +{contentStats?.recent_content?.flashcards || 0} récentes
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Résumés</h4>
              <div className="text-2xl font-bold">{contentStats?.total_content?.summaries || 0}</div>
              <p className="text-sm text-muted-foreground">
                +{contentStats?.recent_content?.summaries || 0} récents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Content */}
      {dashboardData?.top_content && dashboardData.top_content.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contenu populaire</CardTitle>
            <CardDescription>Quiz les plus utilisés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.top_content.map((content: any) => (
                <div key={content.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{content.title}</p>
                    <p className="text-xs text-muted-foreground">{content.attempts} tentatives</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}