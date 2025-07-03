'use client';

import { useState } from 'react';
import { useAuthenticatedSWR, useApiMutation } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Download,
  Calendar,
  Loader2,
  Heart,
  AlertCircle,
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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // Determine which endpoint to use based on active tab
  const getReportEndpoint = () => {
    switch (activeTab) {
      case 'overview':
        return `/admin/dashboard?period=${period}`;
      case 'users':
        return '/admin/reports/user-activity';
      case 'content':
        return '/admin/reports/content-performance';
      case 'system':
        return '/admin/system/health';
      default:
        return null;
    }
  };

  // Fetch report data based on active tab
  const { data: reportData, error, isLoading, mutate } = useAuthenticatedSWR<any>(
    getReportEndpoint(),
    {
      revalidateOnFocus: false,
    }
  );

  // Extract data based on active tab
  const dashboardData = activeTab === 'overview' ? reportData : null;
  const userActivity = activeTab === 'users' ? (reportData || []) : [];
  const contentPerformance = activeTab === 'content' ? (reportData || []) : [];
  const systemHealth = activeTab === 'system' ? reportData : null;

  const handleExportReport = async (reportType: string) => {
    try {
      // Determine the export endpoint
      const endpoint = reportType === 'users' ? '/admin/reports/export/users' : 
                      `/admin/reports/export/content?type=${reportType}`;
      
      // Use the API directly for file download
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${endpoint}`, {
        headers: {
          Authorization: `Bearer ${(await import('next-auth/react')).getSession()?.then(s => s?.access_token)}`,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rapports et analyses</CardTitle>
              <CardDescription>Analyses détaillées de l'utilisation de la plateforme</CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="system">Système</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="overview" className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData?.user_metrics?.active_in_period || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sur {dashboardData?.user_metrics?.total || 0} total
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nouveaux utilisateurs</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData?.user_metrics?.new || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Période sélectionnée
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taux d'activité</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData?.user_metrics?.total > 0
                            ? Math.round((dashboardData.user_metrics.active_in_period / dashboardData.user_metrics.total) * 100)
                            : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Utilisateurs actifs
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contenu populaire</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData?.top_content?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Quiz actifs
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Growth Chart */}
                  {dashboardData?.user_growth && dashboardData.user_growth.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Croissance des utilisateurs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={dashboardData.user_growth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => formatDate(value as string)}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              name="Nouveaux utilisateurs"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => handleExportReport('users')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter le rapport
                    </Button>
                  </div>

                  {/* User Activity Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activité des utilisateurs</CardTitle>
                      <CardDescription>Détails de l'activité par utilisateur</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Utilisateur</th>
                              <th className="text-left py-2">Rôle</th>
                              <th className="text-left py-2">Inscrit le</th>
                              <th className="text-left py-2">Dernière connexion</th>
                              <th className="text-left py-2">Activités</th>
                              <th className="text-left py-2">Dernière activité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userActivity.slice(0, 10).map((user) => (
                              <tr key={user.id} className="border-b">
                                <td className="py-2">
                                  <div>
                                    <div className="font-medium">{user.username || 'N/A'}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </td>
                                <td className="py-2">{user.role}</td>
                                <td className="py-2">{formatDate(user.created_at)}</td>
                                <td className="py-2">
                                  {user.last_login ? formatDate(user.last_login) : 'Jamais'}
                                </td>
                                <td className="py-2">{user.total_activities}</td>
                                <td className="py-2">
                                  {user.last_activity ? formatDate(user.last_activity) : 'Aucune'}
                                </td>
                              </tr>
                            ) || null)}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="flex justify-end mb-4 space-x-2">
                    <Button onClick={() => handleExportReport('quiz')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter Quiz
                    </Button>
                    <Button onClick={() => handleExportReport('flashcard')}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter Flashcards
                    </Button>
                  </div>

                  {/* Content Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance du contenu</CardTitle>
                      <CardDescription>Analyse de l'utilisation du contenu</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {contentPerformance.length > 0 ? (
                        <div className="space-y-4">
                          {contentPerformance.slice(0, 10).map((content) => content && (
                            <div key={content.id} className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">{content.title}</p>
                                <p className="text-sm text-gray-500">
                                  {content.type} • Créé le {formatDate(content.created_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{content.attempts} tentatives</p>
                                {content.avg_score > 0 && (
                                  <p className="text-sm text-gray-500">
                                    Score moyen: {Math.round(content.avg_score)}%
                                  </p>
                                )}
                              </div>
                            </div>
                          ) || null)}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  {/* System Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Santé du système</CardTitle>
                      <CardDescription>État actuel de la plateforme</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-5 w-5 text-green-500" />
                            <span>État général</span>
                          </div>
                          <span className="font-medium text-green-600">
                            {systemHealth?.status === 'healthy' ? 'Opérationnel' : 'Problème détecté'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Taille de la base de données</h4>
                          <div className="space-y-2">
                            {systemHealth?.database?.table_sizes && 
                              Object.entries(systemHealth.database.table_sizes).map(([table, size]) => (
                                <div key={table} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{table}</span>
                                  <span>{size as number} enregistrements</span>
                                </div>
                              ))
                            }
                          </div>
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between font-medium">
                              <span>Total</span>
                              <span>{systemHealth?.database?.total_records || 0} enregistrements</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Activité (24h)</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Utilisateurs actifs</span>
                            <span>{systemHealth?.activity?.active_users_24h || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}