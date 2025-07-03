import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, ExternalLink } from 'lucide-react';

interface MindmapTooltipProps {
  node: {
    text: string;
    description?: string;
    type?: string;
    page?: number;
    note?: string;
  };
  onNavigate?: (page: number) => void;
  position: { x: number; y: number };
}

export default function MindmapTooltip({ node, onNavigate, position }: MindmapTooltipProps) {
  const getTypeIcon = () => {
    switch (node.type) {
      case 'definition':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'example':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute z-50 bg-white rounded-lg shadow-xl border p-4 max-w-sm"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        {getTypeIcon()}
        <h3 className="font-semibold text-sm flex-1">{node.text}</h3>
      </div>
      
      {/* Description */}
      {(node.description || node.note) && (
        <p className="text-xs text-gray-600 mb-3">
          {node.description || node.note}
        </p>
      )}
      
      {/* Actions */}
      {node.page && onNavigate && (
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-500">Page {node.page}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => onNavigate(node.page!)}
          >
            Voir dans le PDF
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}