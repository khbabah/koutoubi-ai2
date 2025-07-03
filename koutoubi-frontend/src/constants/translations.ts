// Traductions et nomenclature cohérente pour l'application
export const TRANSLATIONS = {
  // Navigation principale
  navigation: {
    learn: 'Cours',
    flashcards: 'Cartes',
    quiz: 'Quiz',
    mindmap: 'Carte mentale',
  },
  
  // Titres des sections
  titles: {
    flashcards: 'Cartes de révision',
    quiz: 'Quiz',
    mindmap: 'Carte mentale',
    course: 'Cours',
  },
  
  // Messages de limite
  limits: {
    flashcards: 'Limite de création de cartes de révision atteinte. Passez à Premium pour continuer.',
    quiz: 'Limite de génération de quiz atteinte. Passez à Premium pour continuer.',
    mindmap: 'Limite de génération de cartes mentales atteinte. Passez à Premium pour continuer.',
    summary: 'Limite de résumés IA atteinte. Passez à Premium pour continuer.',
  },
  
  // Messages de génération
  generating: {
    flashcards: 'Génération des cartes de révision en cours...',
    quiz: 'Génération du quiz en cours...',
    mindmap: 'Génération de la carte mentale...',
    summary: 'Génération du résumé en cours...',
  },
  
  // Messages de succès
  success: {
    flashcards: 'Cartes de révision générées avec succès!',
    quiz: 'Quiz généré avec succès!',
    mindmap: 'Carte mentale régénérée',
    summary: 'Résumé généré avec succès!',
  },
  
  // Fonctionnalités
  features: {
    flashcards: 'Cartes de révision',
    quiz: 'Quiz personnalisés',
    mindmap: 'Cartes mentales',
    summary: 'Résumés IA',
    questions: 'Questions IA',
    download: 'Téléchargement PDF',
    offline: 'Mode hors-ligne',
  },
  
  // Actions
  actions: {
    create: 'Créer',
    generate: 'Générer',
    regenerate: 'Régénérer',
    show: 'Afficher',
    hide: 'Masquer',
    retry: 'Réessayer',
  },
} as const;

// Type helper pour l'autocomplétion
export type TranslationKey = keyof typeof TRANSLATIONS;
export type NavigationKey = keyof typeof TRANSLATIONS.navigation;
export type FeatureKey = keyof typeof TRANSLATIONS.features;