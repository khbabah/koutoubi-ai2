"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Copy, Check, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { explainApi } from '@/lib/api';

interface PageSummary {
  page_number: number;
  summary: string;
  keywords: string[];
  word_count: number;
  is_complete: boolean;
}

interface PDFSummaryProps {
  pageNumbers?: number[];
  maxPages?: number;
  documentName?: string;
}

export default function PDFSummary({ 
  pageNumbers, 
  maxPages = 10,
  documentName = "Document"
}: PDFSummaryProps) {
  const { data: session } = useSession();
  const [summaries, setSummaries] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPages, setCopiedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (session?.access_token) {
      loadSummaries();
    }
  }, [pageNumbers, maxPages, session?.access_token]);

  const loadSummaries = async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/v1/pdf-summary/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          page_numbers: pageNumbers,
          max_pages: maxPages,
          force_refresh: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummaries(data.page_summaries);
      } else {
        toast.error('Erreur lors du chargement des résumés');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const refreshSummary = async (pageNumber: number) => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch('/api/v1/pdf-summary/page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          page_number: pageNumber,
          force_refresh: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSummaries(prev => 
          prev.map(s => s.page_number === pageNumber ? {
            page_number: data.page_number,
            summary: data.summary,
            keywords: data.keywords,
            word_count: data.word_count,
            is_complete: data.is_complete
          } : s)
        );
        toast.success(`Résumé de la page ${pageNumber} actualisé`);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const copyToClipboard = async (text: string, pageNumber: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPages(prev => new Set(prev).add(pageNumber));
      toast.success('Résumé copié !');
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(pageNumber);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const copyAllSummaries = async () => {
    const allText = summaries
      .map(s => `Page ${s.page_number}:\n${s.summary}\n`)
      .join('\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(allText);
      toast.success('Tous les résumés copiés !');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Génération des résumés...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Résumés du document</h2>
          <Badge variant="secondary">{summaries.length} pages</Badge>
        </div>
        
        {summaries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllSummaries}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copier tout
          </Button>
        )}
      </div>

      {/* Summaries */}
      <div className="space-y-4">
        {summaries.map((summary) => (
          <Card key={summary.page_number} className="relative overflow-hidden">
            <CardContent className="pt-6">
              {/* Page header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    Page {summary.page_number}
                  </Badge>
                  {!summary.is_complete && (
                    <Badge variant="destructive" className="text-xs">
                      Incomplet
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refreshSummary(summary.page_number)}
                    title="Actualiser le résumé"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(summary.summary, summary.page_number)}
                    title="Copier le résumé"
                  >
                    {copiedPages.has(summary.page_number) ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Summary text */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {summary.summary}
              </p>

              {/* Keywords */}
              {summary.keywords.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Mots-clés:</span>
                  {summary.keywords.map((keyword, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Word count */}
              <div className="mt-2 text-xs text-gray-400">
                {summary.word_count} mots
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more button */}
      {summaries.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              // Load next batch of summaries
              const lastPage = Math.max(...summaries.map(s => s.page_number));
              const nextPages = Array.from(
                { length: 5 }, 
                (_, i) => lastPage + i + 1
              );
              // You would call loadSummaries with new page numbers here
            }}
          >
            Charger plus de résumés
          </Button>
        </div>
      )}
    </div>
  );
}