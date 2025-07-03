'use client';

import { useEffect, useRef, useState } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

interface MindmapDesktopViewProps {
  data: {
    root: any;
    markdown: string;
    theme: any;
  };
  onNodeClick?: (node: any) => void;
  onRegenerateClick?: () => void;
}

export default function MindmapDesktopView({ 
  data, 
  onNodeClick,
  onRegenerateClick 
}: MindmapDesktopViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.markdown) return;
    
    // Check if component is visible
    const isVisible = () => {
      const element = svgRef.current;
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    
    if (!isVisible()) {
      return;
    }
    
    // Add custom CSS for professional styling
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = `
      .markmap-node {
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .markmap-node rect {
        rx: 8;
        ry: 8;
        stroke-width: 2;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }
      .markmap-node:hover rect {
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
        stroke-width: 3;
      }
      .markmap-node text {
        font-weight: 500;
        fill: white;
        pointer-events: none;
      }
      .markmap-node[data-depth="0"] rect {
        rx: 12;
        ry: 12;
      }
      .markmap-node[data-depth="0"] text {
        font-size: 18px;
        font-weight: 600;
      }
      .markmap-link {
        stroke-width: 2;
        opacity: 0.8;
      }
      /* Force link colors */
      path[stroke] {
        stroke-opacity: 0.8 !important;
      }
      /* Style for expand/collapse circles */
      g.markmap-expand-g {
        pointer-events: all !important;
        cursor: pointer !important;
      }
      g.markmap-expand-g circle {
        cursor: pointer !important;
        fill: #E8F0FE !important;
        stroke: #1976D2 !important;
        stroke-width: 2 !important;
        transition: all 0.2s ease;
        r: 10 !important;
      }
      g.markmap-expand-g:hover circle {
        fill: #BBDEFB !important;
        stroke: #1565C0 !important;
        transform: scale(1.3);
        stroke-width: 3 !important;
        filter: drop-shadow(0 0 3px rgba(25, 118, 210, 0.5));
      }
      g.markmap-expand-g text {
        fill: #1976D2 !important;
        font-weight: bold !important;
        font-size: 16px !important;
        pointer-events: none;
        user-select: none;
      }
    `;
    
    // Transform markdown to markmap data
    const transformer = new Transformer();
    const { root } = transformer.transform(data.markdown);
    
    // Create markmap instance with professional styling
    const mm = Markmap.create(svgRef.current, {
      // Use a single color for all nodes
      color: () => '#4F46E5', // Single indigo color for all nodes
      // Animation
      duration: 500,
      
      // Node styling
      nodeMinHeight: 40,
      
      // Spacing - more generous
      spacingVertical: data.theme.nodeSpacing?.vertical || 20,
      spacingHorizontal: data.theme.nodeSpacing?.horizontal || 120,
      
      // Auto fit
      autoFit: true,
      fitRatio: 0.95,
      
      // Padding
      paddingX: 40,
      
      
      // Disable Markmap's zoom to use our own
      zoom: false,
      pan: false,
      
      // Enable scrollbar if needed
      scrollForPan: false,
      
      // Set initial scale
      initialExpandLevel: 3,
    });
    
    // Set data
    mm.setData(root);
    mm.fit();
    
    // Save reference
    mmRef.current = mm;
    
    // Add custom click handler for nodes only (not expand circles)
    if (onNodeClick) {
      // Wait for Markmap to fully render
      setTimeout(() => {
        const svg = d3.select(svgRef.current);
        
        // Select all node groups but not the expand circles
        svg.selectAll('g.markmap-node').each(function() {
          const nodeGroup = d3.select(this);
          
          // Add click handler to the rect/text area only
          nodeGroup.select('rect').on('click', function(event: any) {
            event.stopPropagation();
            
            const nodeText = nodeGroup.select('text').text();
            
            // Simple node data with just the text
            onNodeClick({ text: nodeText });
          });
        });
      }, 200);
    }
    
    // Wait a bit for Markmap to render
    setTimeout(() => {
      const svg = d3.select(svgRef.current);
      const g = svg.select('g');
      
      if (!g.empty()) {
        // Create zoom behavior
        const zoom = d3.zoom()
          .scaleExtent([0.5, 3])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
            setZoom(event.transform.k);
          });
        
        // Apply zoom to SVG
        svg.call(zoom as any);
        
        // Store zoom behavior for button handlers
        (svgRef.current as any).__zoom = zoom;
        
        // Set initial zoom
        svg.call(zoom.transform as any, d3.zoomIdentity);
        
        // Apply different colors to links based on branches
        const colors = data.theme.colorScheme || [
          '#5B69C3', '#48B4E0', '#7ED321', '#F5A623', '#E94B3C', '#9B59B6'
        ];
        
        // Apply colors with smarter branch detection
        const applyLinkColors = () => {
          // First, collect all paths and their positions
          const pathsData: { path: any; startY: number }[] = [];
          
          svg.selectAll('path').each(function() {
            const path = d3.select(this);
            const d = path.attr('d');
            
            if (d && d.includes('M')) {
              // Extract the starting Y position from the path
              const match = d.match(/M\s*([\d.-]+)\s*,\s*([\d.-]+)/);
              if (match) {
                const startY = parseFloat(match[2]);
                pathsData.push({ path, startY });
              }
            }
          });
          
          // Sort paths by Y position to group branches
          pathsData.sort((a, b) => a.startY - b.startY);
          
          // Color paths based on their vertical grouping
          let currentBranch = 0;
          let lastY = -Infinity;
          const threshold = 50; // Minimum Y distance to consider a new branch
          
          pathsData.forEach(({ path, startY }) => {
            // Check if this is a new branch based on Y position
            if (startY - lastY > threshold && lastY !== -Infinity) {
              currentBranch++;
            }
            lastY = startY;
            
            const colorIndex = currentBranch % colors.length;
            path
              .style('stroke', colors[colorIndex])
              .style('stroke-width', 2.5)
              .style('opacity', 0.8)
              .attr('stroke', colors[colorIndex]);
          });
          
        };
        
        // Apply colors multiple times to override Markmap's updates
        timeoutRefs.current.push(
          setTimeout(applyLinkColors, 300),
          setTimeout(applyLinkColors, 600),
          setTimeout(applyLinkColors, 1000)
        );
        
        // Skip MutationObserver entirely - apply colors at fixed intervals only
        // This prevents performance issues and click interference
        
        // Enhance click areas for expand/collapse circles
        svg.selectAll('g.markmap-expand-g').each(function() {
          const expandGroup = d3.select(this);
          const circle = expandGroup.select('circle');
          
          if (!circle.empty()) {
            // Increase circle size directly
            circle.attr('r', 10);
            
            // Add transparent larger click area
            const cx = parseFloat(circle.attr('cx') || '0');
            const cy = parseFloat(circle.attr('cy') || '0');
            
            expandGroup.insert('rect', 'circle')
              .attr('x', cx - 15)
              .attr('y', cy - 15)
              .attr('width', 30)
              .attr('height', 30)
              .attr('fill', 'transparent')
              .attr('cursor', 'pointer');
          }
        });
      }
    }, 300);
    
    // Store markmap instance for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      (window as any).__markmap = mm;
    }
    
    // Cleanup
    return () => {
      // Clear all timeouts
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      
      // Destroy markmap instance
      if (mmRef.current) {
        mmRef.current.destroy();
        mmRef.current = null;
      }
      
      // Clean up debugging reference
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).__markmap;
      }
      
      // Remove style element
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [data, onNodeClick]);
  
  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      toast.error('Impossible de passer en plein écran');
    }
  };
  
  const handleExport = async () => {
    if (!svgRef.current || !containerRef.current) return;
    
    try {
      toast('Préparation du téléchargement...', { icon: '⏳' });
      
      // Get the mindmap container (which includes the SVG)
      const mindmapContainer = svgRef.current.parentElement;
      if (!mindmapContainer) {
        throw new Error('Container not found');
      }
      
      // Use html2canvas to capture the mindmap
      const canvas = await html2canvas(mindmapContainer, {
        backgroundColor: 'white',
        scale: 2, // 2x resolution for better quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Erreur lors de la création de l\'image');
          return;
        }
        
        // Download PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carte-mentale-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Carte mentale téléchargée en PNG');
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };
  
  
  return (
    <div ref={containerRef} className={`h-full flex flex-col ${isFullscreen ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h2 className="text-lg font-semibold">Carte Mentale</h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Mindmap */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => {
            const svg = e.currentTarget;
            svg.style.cursor = 'grabbing';
          }}
          onMouseUp={(e) => {
            const svg = e.currentTarget;
            svg.style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            const svg = e.currentTarget;
            svg.style.cursor = 'grab';
          }}
        />
      </div>
      
      {/* Legend */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center justify-center text-xs text-gray-600">
          <span>
            Cliquez sur un nœud pour développer ou réduire
          </span>
        </div>
      </div>
    </div>
  );
}