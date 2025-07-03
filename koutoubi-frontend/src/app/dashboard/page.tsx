'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { contentApi } from '@/lib/api-client';
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
  Star,
  X,
  LogOut,
  User,
  GraduationCap,
  BarChart,
  Calculator,
  Type,
  Globe2,
  Languages,
  Map,
  Microscope,
  FlaskConical,
  Scroll,
  Users,
  BookOpenCheck,
  Palette,
  PenTool,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import UserMenu from '@/components/UserMenu';
import { useSubscription } from '@/hooks/useSubscription';
import UsageLimitBadge from '@/components/UsageLimitBadge';

interface Course {
  id: string;
  niveau: string;
  niveau_name?: string;
  annee: string;
  matiere: string;
  matiere_name?: string;
  title?: string;
  pdf_path: string;
  relative_path?: string;
  file_size_mb?: number;
  available?: boolean;
}

// Fonction pour obtenir l'icône appropriée selon la matière
const getSubjectIcon = (matiere: string, className: string = "h-16 w-16 text-white opacity-20") => {
  if (matiere.includes('math')) return <Calculator className={className} />;
  if (matiere.includes('francais')) return <Type className={className} />;
  if (matiere.includes('anglais')) return <Languages className={className} />;
  if (matiere.includes('arabe')) return <PenTool className={className} />;
  if (matiere.includes('histoire')) return <Scroll className={className} />;
  if (matiere.includes('geographie')) return <Map className={className} />;
  if (matiere.includes('physique')) return <Microscope className={className} />;
  if (matiere.includes('chimie')) return <FlaskConical className={className} />;
  if (matiere.includes('education-islamique')) return <BookOpenCheck className={className} />;
  if (matiere.includes('education-civique')) return <Users className={className} />;
  if (matiere.includes('philosophie')) return <Brain className={className} />;
  if (matiere.includes('sciences')) return <Microscope className={className} />;
  return <BookOpen className={className} />;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const { isPremium, status: subStatus } = useSubscription();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtres
  const [selectedNiveau, setSelectedNiveau] = useState<string>('all');
  const [selectedAnnee, setSelectedAnnee] = useState<string>('all');
  const [selectedMatiere, setSelectedMatiere] = useState<string>('all');
  
  // Listes pour les dropdowns
  const [niveaux, setNiveaux] = useState<{value: string, label: string}[]>([]);
  const [annees, setAnnees] = useState<{value: string, label: string}[]>([]);
  const [matieres, setMatieres] = useState<{value: string, label: string}[]>([]);
  const [sortBy, setSortBy] = useState<'matiere' | 'niveau' | 'annee'>('matiere');
  
  // Statistiques calculées
  const [totalPages, setTotalPages] = useState(0);
  
  // Favoris
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session) {
      fetchCourses();
      fetchFavorites();
    }
  }, [session, status, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses...');
      console.log('Session status:', status);
      console.log('Session data:', session);
      
      const response = await contentApi.getCourses();
      console.log('API Response:', response); // Debug
      
      // L'API retourne {total: number, courses: Course[]}
      const allCourses = response.courses || [];
      
      // Afficher tous les cours sans filtre
      console.log('All courses found:', allCourses.length); // Debug
      setCourses(allCourses);
      
      // Extraire les valeurs uniques pour les filtres
      const uniqueNiveaux = new Set<string>();
      const uniqueAnnees = new Set<string>();
      const uniqueMatieres = new Set<string>();
      
      allCourses.forEach((course: Course) => {
        uniqueNiveaux.add(course.niveau);
        uniqueAnnees.add(course.annee);
        uniqueMatieres.add(course.matiere);
      });
      
      // Créer les options pour les dropdowns
      setNiveaux([
        { value: 'all', label: 'Tous les niveaux' },
        ...Array.from(uniqueNiveaux).sort().map(n => ({
          value: n,
          label: n === 'secondaire1' ? 'Secondaire 1er cycle' : 'Secondaire 2ème cycle'
        }))
      ]);
      
      setAnnees([
        { value: 'all', label: 'Toutes les années' },
        ...Array.from(uniqueAnnees).sort().map(a => ({
          value: a,
          label: a === '1ere' ? '1ère année' :
                 a === '2eme' ? '2ème année' :
                 a === '3eme' ? '3ème année' :
                 a === '4eme' ? '4ème année' :
                 a === '5eme' ? '5ème année' :
                 a === '6eme' ? '6ème année' :
                 a === '7eme' ? '7ème année (Bac)' : a
        }))
      ]);
      
      setMatieres([
        { value: 'all', label: 'Toutes les matières' },
        ...Array.from(uniqueMatieres).sort().map(m => {
          // Trouver le nom complet de la matière
          const course = allCourses.find((c: Course) => c.matiere === m);
          return {
            value: m,
            label: course?.matiere_name || m
          };
        })
      ]);
      
      // Calculer le nombre total de pages estimé
      // En moyenne, 1 MB de PDF = ~50 pages
      const estimatedPages = allCourses.reduce((total: number, course: Course) => {
        const pages = course.file_size_mb ? Math.round(course.file_size_mb * 50) : 0;
        return total + pages;
      }, 0);
      setTotalPages(estimatedPages);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(`Erreur: ${error.message || 'Impossible de charger les cours'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await contentApi.getFavorites();
      const favoriteCourseIds = new Set(response.map((fav: any) => fav.course_id));
      setFavorites(favoriteCourseIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (course: Course) => {
    const courseId = course.id;
    if (loadingFavorites) return;
    
    setLoadingFavorites(courseId);
    try {
      if (favorites.has(courseId)) {
        // Retirer des favoris
        await contentApi.removeFavorite(courseId);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(courseId);
          return newFavorites;
        });
        toast.success('Cours retiré des favoris');
      } else {
        // Ajouter aux favoris
        await contentApi.addFavorite({
          course_id: courseId,
          niveau: course.niveau,
          annee: course.annee,
          matiere: course.matiere
        });
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(courseId);
          return newFavorites;
        });
        toast.success('Cours ajouté aux favoris');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    } finally {
      setLoadingFavorites(null);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const filteredAndSortedCourses = courses.filter(course => {
    // Filtre par dossier sélectionné
    if (selectedFolder === 'starred' && !favorites.has(course.id)) {
      return false;
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = course.matiere.toLowerCase().includes(query) ||
             course.annee.toLowerCase().includes(query) ||
             course.niveau.toLowerCase().includes(query) ||
             (course.matiere_name && course.matiere_name.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Filtre par niveau
    if (selectedNiveau !== 'all' && course.niveau !== selectedNiveau) {
      return false;
    }
    
    // Filtre par année
    if (selectedAnnee !== 'all' && course.annee !== selectedAnnee) {
      return false;
    }
    
    // Filtre par matière
    if (selectedMatiere !== 'all' && course.matiere !== selectedMatiere) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Tri selon la sélection
    if (sortBy === 'matiere') {
      return (a.matiere_name || a.matiere).localeCompare(b.matiere_name || b.matiere);
    } else if (sortBy === 'niveau') {
      const niveauOrder = { 'secondaire1': 1, 'secondaire2': 2 };
      return (niveauOrder[a.niveau] || 0) - (niveauOrder[b.niveau] || 0) ||
             a.annee.localeCompare(b.annee);
    } else { // annee
      return a.annee.localeCompare(b.annee) || 
             (a.matiere_name || a.matiere).localeCompare(b.matiere_name || b.matiere);
    }
  });

  const sidebarItems = [
    { id: 'all', label: 'Tous les cours', icon: Home, count: courses.length },
    { id: 'starred', label: 'Favoris', icon: Star, count: favorites.size },
  ];

  // Ajouter les liens spéciaux selon le rôle
  const additionalLinks = [
    ...(user?.role && ['teacher', 'parent', 'admin'].includes(user.role) ? [
      { id: 'educator', label: 'Mode éducateur', icon: GraduationCap, href: '/educator' }
    ] : []),
    ...(user?.role === 'super_admin' ? [
      { id: 'admin', label: 'Administration', icon: Shield, href: '/admin', className: 'text-red-600' }
    ] : []),
    { id: 'stats', label: 'Statistiques', icon: BarChart, href: '/stats' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <motion.div
        initial={false}
        animate={{ width: sidebarExpanded ? 240 : 64 }}
        className="bg-white border-r border-gray-200 flex flex-col"
      >
        {/* Logo and Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              animate={{ opacity: sidebarExpanded ? 1 : 0 }}
            >
              {sidebarExpanded && (
                <>
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-900">Koutoubi AI</span>
                </>
              )}
            </motion.div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedFolder(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors ${
                  selectedFolder === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="ml-3 flex-1 text-left">{item.label}</span>
                )}
                {sidebarExpanded && item.count > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Divider */}
          {additionalLinks.length > 0 && sidebarExpanded && (
            <div className="my-2 border-t border-gray-200"></div>
          )}
          
          {/* Additional Links */}
          {additionalLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => router.push(link.href)}
                className={`w-full flex items-center px-3 py-2 rounded-md transition-colors ${
                  link.className || 'text-gray-700'
                } hover:bg-gray-100`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="ml-3 flex-1 text-left">{link.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          {sidebarExpanded ? (
            <UserMenu />
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-md text-gray-600"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4 ml-4">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section avec stats intégrées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Bienvenue, {user?.name || 'Étudiant'} !
                  </h1>
                  <p className="text-gray-600">
                    Explorez vos manuels scolaires et apprenez avec l'IA
                  </p>
                </div>
                
                {/* Stats compactes pour desktop */}
                {courses.length > 0 && (
                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-6 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <span><strong>{courses.length}</strong> cours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span><strong>{totalPages > 1000 ? `${Math.round(totalPages/1000)}k` : totalPages}</strong> pages</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span><strong>8</strong> outils IA</span>
                      </div>
                    </div>
                    
                    {/* Subscription Status */}
                    {subStatus && !isPremium && (
                      <UsageLimitBadge feature="ai_summary" label="Résumés" />
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats bannière mobile */}
            {courses.length > 0 && (
              <div className="md:hidden mb-4 flex items-center gap-4 text-xs text-gray-600 px-3 py-2 bg-gray-50 rounded-lg overflow-x-auto">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Calculator className="h-3.5 w-3.5 text-blue-600" />
                  <span><strong>{courses.length}</strong> cours</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <FileText className="h-3.5 w-3.5 text-green-600" />
                  <span><strong>{totalPages > 1000 ? `${Math.round(totalPages/1000)}k` : totalPages}</strong> pages</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Brain className="h-3.5 w-3.5 text-purple-600" />
                  <span><strong>8</strong> outils</span>
                </div>
              </div>
            )}

            {/* Filtres */}
            <div className="mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Filtre Niveau */}
              <div className="flex-1 md:min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Niveau</span>
                  {selectedNiveau !== 'all' && (
                    <span className="text-xs text-blue-600 font-normal">Actif</span>
                  )}
                </label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => {
                    setSelectedNiveau(e.target.value);
                    // Réinitialiser l'année quand on change de niveau
                    setSelectedAnnee('all');
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium transition-colors hover:border-gray-400"
                >
                  {niveaux.map(niveau => (
                    <option key={niveau.value} value={niveau.value}>
                      {niveau.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Année */}
              <div className="flex-1 md:min-w-[200px] relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Année</span>
                  {selectedAnnee !== 'all' && (
                    <span className="text-xs text-blue-600 font-normal">Actif</span>
                  )}
                </label>
                <select
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(e.target.value)}
                  disabled={selectedNiveau === 'all'}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium transition-colors ${
                    selectedNiveau === 'all' 
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {selectedNiveau === 'all' ? (
                    <option value="all">D'abord sélectionner un niveau</option>
                  ) : (
                    annees
                      .filter(a => {
                        if (a.value === 'all') return true;
                        // Filtrer les années selon le niveau
                        if (selectedNiveau === 'secondaire1') {
                          return ['1ere', '2eme', '3eme'].includes(a.value);
                        } else if (selectedNiveau === 'secondaire2') {
                          return ['4eme', '5eme', '6eme', '7eme'].includes(a.value);
                        }
                        return false;
                      })
                      .map(annee => (
                        <option key={annee.value} value={annee.value}>
                          {annee.label}
                        </option>
                      ))
                  )}
                </select>
              </div>

              {/* Filtre Matière */}
              <div className="flex-1 md:min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Matière</span>
                  {selectedMatiere !== 'all' && (
                    <span className="text-xs text-blue-600 font-normal">Actif</span>
                  )}
                </label>
                <select
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium transition-colors hover:border-gray-400"
                >
                  {matieres.map(matiere => (
                    <option key={matiere.value} value={matiere.value}>
                      {matiere.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton de réinitialisation */}
              {(selectedNiveau !== 'all' || selectedAnnee !== 'all' || selectedMatiere !== 'all') && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedNiveau('all');
                      setSelectedAnnee('all');
                      setSelectedMatiere('all');
                    }}
                    className="px-4 py-2.5 text-sm text-gray-600 hover:text-white hover:bg-gray-800 border border-gray-300 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </button>
                </div>
              )}
              </div>
            </div>

            {/* Résultats et tri */}
            {filteredAndSortedCourses.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                {filteredAndSortedCourses.length} {filteredAndSortedCourses.length === 1 ? 'cours trouvé' : 'cours trouvés'}
              </div>
              
              {/* Tri */}
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-gray-500">Trier par:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'matiere' | 'niveau' | 'annee')}
                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="matiere">Matière</option>
                  <option value="niveau">Niveau</option>
                  <option value="annee">Année</option>
                </select>
              </div>
            </div>
            )}

            {/* Courses Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-20 md:h-24 bg-gray-200 animate-pulse" />
                    <div className="p-3">
                      <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-2 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-1">
                          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                <AnimatePresence>
                  {filteredAndSortedCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        // Utiliser directement les valeurs du cours sans transformation
                        router.push(`/cours/${course.niveau}/${course.annee}/${course.matiere}`);
                      }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer overflow-hidden group"
                    >
                      <div className={`h-20 md:h-24 relative ${
                        course.matiere.includes('math') ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        course.matiere.includes('francais') ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        course.matiere.includes('anglais') ? 'bg-gradient-to-br from-green-500 to-green-600' :
                        course.matiere.includes('arabe') ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                        course.matiere.includes('histoire') ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                        course.matiere.includes('geographie') ? 'bg-gradient-to-br from-teal-500 to-teal-600' :
                        course.matiere.includes('physique') ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                        course.matiere.includes('chimie') ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                        course.matiere.includes('education-islamique') ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        course.matiere.includes('education-civique') ? 'bg-gradient-to-br from-red-500 to-red-600' :
                        course.matiere.includes('philosophie') ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                        course.matiere.includes('sciences') ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' :
                        'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {getSubjectIcon(course.matiere, "h-10 w-10 md:h-12 md:w-12 text-white opacity-20")}
                        </div>
                        <div className="absolute bottom-2 left-3 right-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {getSubjectIcon(course.matiere, "h-3.5 w-3.5 text-white opacity-80")}
                            <h3 className="text-white font-semibold text-sm truncate">{course.matiere_name || course.matiere}</h3>
                          </div>
                          <p className="text-blue-100 text-xs">{course.annee_name || course.annee}</p>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">{course.niveau_name || course.niveau}</span>
                          <span className="text-xs text-gray-500">
                            {course.file_size_mb ? `${course.file_size_mb.toFixed(1)} MB` : 'PDF'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <button className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                              <BookOpen className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(course);
                              }}
                              disabled={loadingFavorites === course.id}
                              className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors ${
                                loadingFavorites === course.id ? 'opacity-50 cursor-not-allowed' : ''
                              } ${
                                favorites.has(course.id) ? 'text-yellow-500' : 'text-gray-600'
                              }`}
                            >
                              <Star 
                                className={`h-3.5 w-3.5 ${favorites.has(course.id) ? 'fill-current' : ''}`} 
                              />
                            </button>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  {selectedFolder === 'starred' ? (
                    <Star className="h-12 w-12 text-gray-400" />
                  ) : (
                    <Search className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedFolder === 'starred'
                    ? 'Aucun cours favori'
                    : searchQuery || selectedNiveau !== 'all' || selectedAnnee !== 'all' || selectedMatiere !== 'all' 
                    ? 'Aucun cours trouvé' 
                    : 'Commencez votre apprentissage'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {selectedFolder === 'starred'
                    ? 'Ajoutez des cours à vos favoris en cliquant sur l\'étoile pour les retrouver facilement.'
                    : searchQuery || selectedNiveau !== 'all' || selectedAnnee !== 'all' || selectedMatiere !== 'all'
                    ? 'Essayez de modifier vos critères de recherche ou vos filtres pour trouver des cours.'
                    : 'Sélectionnez un niveau, une année et une matière pour voir les cours disponibles.'}
                </p>
                {(searchQuery || selectedNiveau !== 'all' || selectedAnnee !== 'all' || selectedMatiere !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedNiveau('all');
                      setSelectedAnnee('all');
                      setSelectedMatiere('all');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}