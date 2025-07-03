import { NextResponse } from 'next/server';

export async function GET() {
  // Mock chapters data for the our-style UI
  const chapters = [
    {
      id: '1',
      chapter_number: 11,
      title: 'Le Bachagha Si Khelladi Ben Miloud',
      pdf_path: '/content/pdf/chapitre11.pdf',
      flashcard_count: 15,
      quiz_count: 10,
      progress: {
        completed_flashcards: 8,
        quiz_attempts: 2,
        last_study_date: '2025-06-27T10:00:00Z'
      }
    },
    {
      id: '2',
      chapter_number: 12,
      title: 'La colonisation française en Afrique',
      pdf_path: '/content/pdf/chapitre12.pdf',
      flashcard_count: 20,
      quiz_count: 12,
      progress: {
        completed_flashcards: 20,
        quiz_attempts: 5,
        last_study_date: '2025-06-26T14:30:00Z'
      }
    },
    {
      id: '3',
      chapter_number: 13,
      title: 'Les mouvements de résistance',
      pdf_path: '/content/pdf/chapitre13.pdf',
      flashcard_count: 18,
      quiz_count: 8,
      progress: {
        completed_flashcards: 5,
        quiz_attempts: 1,
        last_study_date: '2025-06-25T09:15:00Z'
      }
    }
  ];

  return NextResponse.json(chapters);
}