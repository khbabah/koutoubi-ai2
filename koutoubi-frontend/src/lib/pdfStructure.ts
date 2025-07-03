// Structure générique des chapitres pour les PDFs de mathématiques
export const pdfStructure = {
  pdfName: "mathematiques.pdf",
  totalPages: 248,
  chapters: [
    {
      id: "ch1",
      title: "Programmation en langage Python",
      startPage: 17,
      endPage: 42,
      sections: [
        { id: "ch1-s1", title: "Types de variables et affectation", startPage: 22, endPage: 23 },
        { id: "ch1-s2", title: "Instructions conditionnelles", startPage: 24, endPage: 25 },
        { id: "ch1-s3", title: "Fonctions", startPage: 26, endPage: 27 },
        { id: "ch1-s4", title: "Boucles bornées", startPage: 28, endPage: 28 },
        { id: "ch1-s5", title: "Boucles conditionnelles", startPage: 28, endPage: 30 },
        { id: "ch1-ex1", title: "Exercices d'entraînement", startPage: 32, endPage: 36 },
        { id: "ch1-ex2", title: "Exercices de synthèse", startPage: 37, endPage: 37 },
        { id: "ch1-ex3", title: "Exercices d'approfondissement", startPage: 38, endPage: 38 },
        { id: "ch1-tp", title: "Travaux pratiques", startPage: 42, endPage: 42 }
      ],
      description: "Algorithmique et programmation",
      color: "#4F46E5" // Indigo
    },
    {
      id: "ch2",
      title: "Nombres et calculs",
      startPage: 45,
      endPage: 68,
      sections: [
        { id: "ch2-s1", title: "Puissances entières relatives", startPage: 48, endPage: 48 },
        { id: "ch2-s2", title: "Racine carrée", startPage: 48, endPage: 49 },
        { id: "ch2-s3", title: "Multiples, diviseurs et nombres premiers", startPage: 50, endPage: 51 },
        { id: "ch2-s4", title: "Ensembles de nombres", startPage: 52, endPage: 53 },
        { id: "ch2-ex1", title: "Exercices automatismes", startPage: 55, endPage: 55 },
        { id: "ch2-ex2", title: "Exercices d'entraînement", startPage: 56, endPage: 61 },
        { id: "ch2-ex3", title: "Exercices de synthèse", startPage: 62, endPage: 62 },
        { id: "ch2-ex4", title: "Exercices d'approfondissement", startPage: 63, endPage: 64 },
        { id: "ch2-tp", title: "Travaux pratiques", startPage: 68, endPage: 68 }
      ],
      description: "Partie 1 - Nombres et calculs",
      color: "#059669" // Emerald
    },
    {
      id: "ch3",
      title: "Intervalles, inégalités, inéquations",
      startPage: 71,
      endPage: 94,
      sections: [
        { id: "ch3-s1", title: "Intervalles", startPage: 74, endPage: 75 },
        { id: "ch3-s2", title: "Inégalités et inéquations", startPage: 76, endPage: 77 },
        { id: "ch3-s3", title: "Comparaison", startPage: 78, endPage: 78 },
        { id: "ch3-s4", title: "Valeur absolue d'un nombre réel", startPage: 78, endPage: 79 },
        { id: "ch3-ex1", title: "Exercices automatismes", startPage: 81, endPage: 81 },
        { id: "ch3-ex2", title: "Exercices d'entraînement", startPage: 82, endPage: 88 },
        { id: "ch3-ex3", title: "Exercices de synthèse", startPage: 89, endPage: 89 },
        { id: "ch3-ex4", title: "Exercices d'approfondissement", startPage: 90, endPage: 90 },
        { id: "ch3-tp", title: "Travaux pratiques", startPage: 94, endPage: 94 }
      ],
      description: "Partie 2 - Nombres et calculs",
      color: "#DC2626" // Red
    },
    {
      id: "ch4",
      title: "Calcul littéral",
      startPage: 97,
      endPage: 120,
      sections: [],
      description: "Partie 3 - Nombres et calculs",
      color: "#7C3AED" // Violet
    }
  ],
  metadata: {
    subject: "Mathématiques",
    level: "4ème Secondaire",
    language: "fr",
    analyzed: true,
    method: "manual_from_toc"
  }
};

export type Section = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

export type Chapter = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  sections: Section[];
  description?: string;
  color?: string;
};

export const getChapterById = (id: string): Chapter | undefined => {
  return pdfStructure.chapters.find(ch => ch.id === id);
};

export const getChapterByPage = (pageNum: number): Chapter | undefined => {
  return pdfStructure.chapters.find(
    ch => pageNum >= ch.startPage && pageNum <= ch.endPage
  );
};

export const getSectionByPage = (pageNum: number): Section | undefined => {
  const chapter = getChapterByPage(pageNum);
  if (!chapter) return undefined;
  
  return chapter.sections.find(
    section => pageNum >= section.startPage && pageNum <= section.endPage
  );
};

export const getChapterProgress = (chapterId: string, completedPages: number[]): number => {
  const chapter = getChapterById(chapterId);
  if (!chapter) return 0;
  
  const chapterPages = Array.from(
    { length: chapter.endPage - chapter.startPage + 1 }, 
    (_, i) => chapter.startPage + i
  );
  
  const completedCount = chapterPages.filter(page => completedPages.includes(page)).length;
  return Math.round((completedCount / chapterPages.length) * 100);
};

export const getTotalProgress = (completedPages: number[]): number => {
  return Math.round((completedPages.length / pdfStructure.totalPages) * 100);
};