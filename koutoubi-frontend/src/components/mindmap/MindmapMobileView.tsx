'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Hash, BookOpen, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MindmapNode {
  id: string;
  text: string;
  children?: MindmapNode[];
  note?: string;
  color?: string;
  page?: number;
  expanded?: boolean;
  level?: number;
  type?: string;
}

interface MindmapMobileViewProps {
  data: {
    root: MindmapNode;
    markdown: string;
    theme: any;
  };
  onNodeClick?: (node: MindmapNode) => void;
}

const NodeCard = ({ 
  node, 
  level, 
  onExpand, 
  onNodeClick,
  theme 
}: {
  node: MindmapNode;
  level: number;
  onExpand: (nodeId: string) => void;
  onNodeClick?: (node: MindmapNode) => void;
  theme: any;
}) => {
  const colors = theme.colorScheme || [
    '#4A90E2', '#7ED321', '#F5A623', '#BD10E0', '#50E3C2', '#E94B3C'
  ];
  
  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'formula':
        return <Hash className="h-3 w-3" />;
      case 'definition':
        return <BookOpen className="h-3 w-3" />;
      case 'example':
        return <Lightbulb className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };
  
  const getBgColor = (level: number) => {
    const colorMap = [
      'bg-blue-50 border-l-4 border-blue-400',
      'bg-green-50 border-l-4 border-green-400',
      'bg-orange-50 border-l-4 border-orange-400',
      'bg-purple-50 border-l-4 border-purple-400',
      'bg-cyan-50 border-l-4 border-cyan-400',
      'bg-red-50 border-l-4 border-red-400',
    ];
    return colorMap[level % colorMap.length];
  };
  
  const [isExpanded, setIsExpanded] = useState(node.expanded ?? (level < 2));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && node.children && node.children.length > 0) {
      setIsExpanded(true);
      onExpand(node.id);
    }
    if (isRightSwipe) {
      setIsExpanded(false);
      onExpand(node.id);
    }
  };
  
  return (
    <div className="mb-2 node-transition">
      <div 
        className={`
          flex items-center p-3 rounded-lg cursor-pointer
          ${getBgColor(level)}
          ${level > 0 ? `ml-${Math.min(level * 4, 16)}` : ''}
          active:scale-[0.98] active:opacity-90
        `}
        onClick={() => {
          if (node.children && node.children.length > 0) {
            setIsExpanded(!isExpanded);
            onExpand(node.id);
          }
          onNodeClick?.(node);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {node.type && getNodeIcon(node.type)}
            <h3 className={`
              ${level === 0 ? 'font-semibold text-base' : ''}
              ${level === 1 ? 'font-medium text-sm' : ''}
              ${level >= 2 ? 'text-sm' : ''}
              truncate
            `}>
              {node.text}
            </h3>
          </div>
          {node.note && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{node.note}</p>
          )}
          {level === 0 && node.children && (
            <p className="text-xs text-gray-500 mt-1">
              {node.children.length} sous-sections
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {node.page && (
            <Badge 
              variant="outline" 
              className="text-xs"
            >
              P{node.page}
            </Badge>
          )}
          
          {node.children && node.children.length > 0 && (
            <ChevronRight 
              className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
        </div>
      </div>
      
      {isExpanded && node.children && (
        <div className="mt-1 animate-fade-in">
          {node.children.map(child => (
            <NodeCard 
              key={child.id}
              node={child}
              level={level + 1}
              onExpand={onExpand}
              onNodeClick={onNodeClick}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function MindmapMobileView({ 
  data, 
  onNodeClick
}: MindmapMobileViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<MindmapNode[]>([data.root]);
  const [focusedNode, setFocusedNode] = useState<MindmapNode | null>(null);
  
  const handleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  const handleNodeClick = (node: MindmapNode) => {
    if (node.children && node.children.length > 0) {
      setFocusedNode(node);
    }
    onNodeClick?.(node);
  };
  
  const handleBack = () => {
    setFocusedNode(null);
  };
  
  // Focus view for a specific node
  if (focusedNode) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center p-4 border-b bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg truncate">{focusedNode.text}</h2>
            {focusedNode.page && (
              <Badge 
                variant="outline" 
                className="text-xs mt-1"
              >
                Page {focusedNode.page}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {focusedNode.note && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">{focusedNode.note}</p>
              </div>
            )}
            
            {/* Sub-elements */}
            <div className="space-y-3">
              {focusedNode.children?.map(child => (
                <div 
                  key={child.id}
                  className="bg-white border rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    {child.type && (
                      <div className="mt-0.5">
                        {child.type === 'formula' && <Hash className="h-4 w-4 text-blue-500" />}
                        {child.type === 'definition' && <BookOpen className="h-4 w-4 text-green-500" />}
                        {child.type === 'example' && <Lightbulb className="h-4 w-4 text-orange-500" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{child.text}</h3>
                      {child.note && (
                        <p className="text-xs text-gray-600 mt-1">{child.note}</p>
                      )}
                    </div>
                    {child.page && (
                      <Badge variant="outline" className="text-xs ml-2">
                        P{child.page}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }
  
  // List view
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-semibold">Carte Mentale</h2>
        <p className="text-sm text-gray-600 mt-1">
          Touchez pour développer ou réduire
        </p>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <NodeCard 
            node={data.root}
            level={0}
            onExpand={handleExpand}
            onNodeClick={handleNodeClick}
            theme={data.theme}
          />
        </div>
      </ScrollArea>
    </div>
  );
}